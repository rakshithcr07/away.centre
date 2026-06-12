# Technical Specification

## Away Intelligence MVP

**Stack:** Next.js 15 · Node.js · PostgreSQL · Redis · BullMQ · OpenAI

---

## 1. System Requirements

| Requirement | Target |
|-------------|--------|
| API response time | < 500ms |
| Dashboard load | < 2 seconds |
| API uptime | 99% |
| Scoring | Idempotent |
| Background jobs | Retryable with dead-letter |
| Audit | All write actions logged |
| Access | Role-based (RBAC) |

---

## 2. Monorepo Structure

```
away-intelligence/
├── backend/     # Express API, workers, scheduler
├── frontend/    # Next.js 15 dashboard
├── shared/      # TypeScript types
└── docs/        # Documentation
```

**Package manager:** npm workspaces (not Nx)

---

## 3. Scoring Engine

### 3.1 Formula

```
overall_score = (fit_score × 0.40) + (intent_score × 0.40) + (timing_score × 0.20)
```

All sub-scores are 0–100, rounded to integer.

### 3.2 Fit Score Components

**Company Size**

| Employees | Score |
|-----------|-------|
| 1–5 | 20 |
| 6–20 | 80 |
| 21–100 | 100 |
| 101–300 | 90 |
| 301–1000 | 60 |
| 1000+ | 20 |

**Location**

| Location | Score |
|----------|-------|
| Bangalore, Vizag, Kolkata | 100 |
| Other Indian cities | 40 |
| Outside India | 10 |

**Industry**

| Industry | Score |
|----------|-------|
| SaaS | 100 |
| Fintech | 95 |
| HealthTech | 85 |
| E-commerce | 75 |
| Consulting | 70 |
| Staffing | 20 |
| Manufacturing | 15 |

Fit score = `size × 0.4 + location × 0.35 + industry × 0.25`

### 3.3 Intent Score Boosts

| Signal | Boost |
|--------|-------|
| Hiring in Bangalore/Vizag/Kolkata | +20 |
| Hiring multiple roles | +20 |
| Hiring onsite | +15 |
| Hiring hybrid | +15 |
| Funding raised (≤90 days) | +25 |
| Founder office complaint | +40 |
| HR office-related post | +30 |
| India expansion | +35 |
| Opened office | +40 |

Base intent = `min(signal_count × 10, 50)` + boosts (capped at 100)

### 3.4 Timing Score

| Signal Age | Score |
|------------|-------|
| ≤ 7 days | 100 |
| ≤ 30 days | 80 |
| ≤ 60 days | 50 |
| ≤ 90 days | 25 |
| > 90 days | 0 |

Uses the **most recent** active signal.

### 3.5 Qualification Threshold

`overall_score >= 75` → qualified for CRM push and immediate outreach queue.

---

## 4. Signal Types

```typescript
type SignalType =
  | 'HIRING_SIGNAL'
  | 'FUNDING_SIGNAL'
  | 'SOCIAL_SIGNAL'
  | 'EXPANSION_SIGNAL';
```

### Examples

**HIRING_SIGNAL:** Hiring in Bangalore, hiring office managers, multiple jobs posted  
**FUNDING_SIGNAL:** Seed, Series A/B, expansion capital  
**SOCIAL_SIGNAL:** Looking for office space, WFH isn't working, team growing fast  
**EXPANSION_SIGNAL:** India launch, new office announcement, South India expansion

---

## 5. Pipeline Specification

**Schedule:** Every 6 hours (`0 */6 * * *`)

| Step | Action |
|------|--------|
| 1 | Scheduler triggers pipeline job |
| 2 | Collect signals from all sources → `raw_signals` |
| 3 | Process raw signals → normalize company names |
| 4 | Enrich companies with partial data |
| 5 | Calculate/recalculate scores |
| 6 | Generate outreach for qualified companies |
| 7 | Push qualified leads to Zoho Bigin |
| 8 | Notify Slack + email |
| 9 | Dashboard reflects updated data |

---

## 6. Edge Case Handling

| Scenario | Behavior |
|----------|----------|
| Company appears with different names | Merge via `company_aliases` + fuzzy match |
| Same signal arrives multiple times | Deduplicate via `content_hash` unique index |
| Old funding article (>90 days) | Ignore funding boost |
| Job postings disappear | Mark hiring signals inactive after 60 days |
| LinkedIn scraping blocked | Retry, then fallback gracefully |
| Incomplete company data | Store partial record, enrich later |
| Multiple cities detected | Use highest-scoring city |
| AI hallucinated outreach | Store confidence, flag `requires_human_review` |
| CRM API failure | Retry up to 5×, then `dead_letter` status |

---

## 7. Authentication

- API key via `x-api-key` header
- Role via `x-user-role` header (`admin`, `sales_manager`, `sales_rep`, `viewer`)
- JWT support planned for production UI auth

---

## 8. Environment Variables

See `.env.example` at repo root. Critical vars:

- `DATABASE_URL`, `REDIS_URL`
- `OPENAI_API_KEY`, `OPENAI_MODEL`
- `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`
- `SLACK_WEBHOOK_URL`
- `QUALIFIED_SCORE_THRESHOLD` (default: 75)
- `SCORING_FIT_WEIGHT` (default: 0.40)
- `SCORING_INTENT_WEIGHT` (default: 0.40)
- `SCORING_TIMING_WEIGHT` (default: 0.20)

> [!NOTE]
> In local/offline mode, the PostgreSQL database is mocked via a local `.mock_db.json` file adapter and the queue is mocked using asynchronous in-memory timeouts, avoiding docker setup requirements.

---

## 9. Deployment

| Component | Platform |
|-----------|----------|
| Frontend | Vercel |
| Backend API | Railway |
| Workers / Scheduler | Railway (separate process) |
| PostgreSQL | Neon (with pgvector) |
| Redis | Railway Redis |

---

## 10. Code Locations

| Concern | Path |
|---------|------|
| Scoring engine | `backend/src/services/scoring/scoring-engine.ts` |
| Score persistence | `backend/src/services/scoring/score-service.ts` |
| Signal collector | `backend/src/services/signals/signal-collector.ts` |
| Company merge | `backend/src/services/companies/company-service.ts` |
| Outreach (GPT) | `backend/src/services/outreach/outreach-service.ts` |
| Zoho CRM | `backend/src/services/crm/zoho-bigin.ts` |
| Pipeline | `backend/src/services/pipeline/pipeline-orchestrator.ts` |
| API routes | `backend/src/routes/` |
| Frontend pages | `frontend/src/app/` |
