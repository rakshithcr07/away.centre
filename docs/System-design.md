# System Design

Detailed design document for Away Intelligence.

---

## 1. Pipeline Design

```mermaid
sequenceDiagram
    participant Cron as Scheduler (6h)
    participant Queue as BullMQ
    participant Pipeline as Orchestrator
    participant Collector as Signal Collector
    participant DB as PostgreSQL
    participant Scorer as Scoring Engine
    participant GPT as OpenAI
    participant CRM as Zoho Bigin
    participant Slack as Slack

    Cron->>Queue: enqueue pipeline job
    Queue->>Pipeline: process job
    Pipeline->>Collector: collectAll()
    Collector->>DB: INSERT raw_signals
    Pipeline->>Collector: processRawSignals()
    Collector->>DB: UPSERT companies, signals
    Pipeline->>Scorer: recalculateAllScores()
    Scorer->>DB: UPSERT scores
    Pipeline->>GPT: generateOutreach (qualified)
    GPT->>DB: INSERT outreach_recommendations
    Pipeline->>CRM: syncQualifiedLeads()
    CRM->>DB: UPSERT crm_records
    Pipeline->>Slack: notifyQualifiedLeads()

> [!NOTE]
> In local development/mock mode, **PostgreSQL** is simulated via a local file-persisted JSON database ([pool.ts](file:///d:/away.centre/backend/src/db/pool.ts)) and **BullMQ** is simulated using standard asynchronous in-memory queues ([queues.ts](file:///d:/away.centre/backend/src/workers/queues.ts)). This removes the need for local Docker Postgres/Redis services.
```

---

## 2. Company Resolution Design

When a new signal arrives with company name `N`:

```
1. Normalize name → normalized_name
2. Lookup company_aliases by normalized_name → found? merge
3. Lookup companies by website domain → found? merge
4. Lookup companies by normalized_name → found? merge
5. Fuzzy match against active companies (word overlap ≥50%) → found? create alias + merge
6. Else → INSERT new company
7. Enrich existing fields with COALESCE (never overwrite non-null with null)
```

**Example merges:**
- "Google LLC" + "Google India" → single company, alias table entry
- Same domain `razorpay.com` → same company regardless of name variant

---

## 3. Signal Deduplication Design

```
content_hash = SHA256(signal_type | signal_text | signal_date | company_id)
```

Unique partial index: `(company_id, content_hash) WHERE content_hash IS NOT NULL`

Duplicate signals are silently skipped at insert time.

---

## 4. Scoring Service Design

**Idempotency guarantee:** Given identical input state (company fields + active signals + CRM status), `calculateScores()` always returns the same result.

```
Input:
  - company attributes (size, city, industry, flags)
  - active non-duplicate signals[]
  - crm status

Process:
  1. Exclusion checks (early return score=0)
  2. Compute fit_score from size/location/industry
  3. Compute intent_score from signal keywords + count
  4. Compute timing_score from most recent signal
  5. Weighted overall_score

Output:
  - fit_score, intent_score, timing_score, overall_score
  - score_reasoning (human-readable audit trail)
  - excluded flag + reason
```

Persistence: `INSERT ... ON CONFLICT (company_id) DO UPDATE` — safe to re-run.

---

## 5. Sales Queue Categorization

```
if requires_human_review → manual_review
else if overall_score >= 75 → immediate_outreach
else if overall_score >= 50 → nurture
else → ignored
```

Computed at read time (not stored) to stay in sync with score changes.

---

## 6. CRM Sync Design

```
SELECT qualified companies WHERE:
  - overall_score >= threshold
  - is_active = true
  - crm status IN (null, pending, failed)
  - retry_count < 5
  - status != closed_lost

FOR EACH lead:
  TRY create Zoho lead
  ON success → status = synced, retry_count = 0
  ON failure → retry_count++, status = failed
  IF retry_count >= 5 → status = dead_letter
```

Mock mode (no Zoho credentials): generates `ZOHO-{timestamp}-{random}` IDs.

---

## 7. Outreach Generation Design

```
IF company.score >= 75 AND no existing outreach:
  IF OPENAI_API_KEY set:
    → GPT JSON response (subject, personalization, pain_point, product, cta, confidence)
  ELSE:
    → Template fallback (confidence = 0.65)

  IF confidence < 0.70:
    → requires_human_review = true

  STORE in outreach_recommendations
```

Generated message stored as JSON string in `generated_message` column plus denormalized fields for querying.

---

## 8. Database Design Principles

- UUID primary keys throughout
- `TIMESTAMPTZ` for all timestamps
- JSONB for flexible metadata and raw payloads
- Enum types for signal_type, signal_source, crm_status, user_role
- Cascade deletes from companies → signals, contacts, scores
- Indexes on filter columns: city, industry, overall_score, signal_date

---

## 9. API Design Principles

- RESTful resource naming
- Pagination via `page` + `limit` query params
- Filtering via query string (city, industry, signal_type, min_score, etc.)
- Consistent error format: `{ error: string }`
- All routes prefixed `/api`
- Health check at `/health` (no auth)

---

## 10. Frontend Data Fetching

- Server Components fetch from API at request time
- `dynamic = 'force-dynamic'` on data pages
- API revalidation: 30 seconds (`next: { revalidate: 30 }`)
- Graceful empty states when API unavailable

---

## 11. Vector Search (Future)

`signal_embeddings` table stores 1536-dim OpenAI embeddings per signal.

IVFFlat index enables cosine similarity search for:
- "Find companies with signals similar to office expansion"
- Semantic deduplication across phrasing variants

Not actively used in MVP pipeline — schema ready for Phase 2.

---

## 12. Conversion Tracking

```
conversions table:
  - company_id
  - crm_record_id
  - conversion_type (closed_won, closed_lost, meeting_booked, etc.)
  - revenue
  - conversion_date
```

Dashboard conversion rate = `closed_won / total conversions × 100`
