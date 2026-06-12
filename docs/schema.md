# Database Schema

PostgreSQL schema reference for Away Intelligence.

**Engine:** PostgreSQL 16 + pgvector  
**Migration file:** `backend/src/db/migrations/001_initial_schema.sql`

---

## Entity Relationship Diagram

```
users ──────────────────────────────────────────────┐
                                                     │
companies ──┬── company_aliases                      │
            ├── signals ──── signal_embeddings       │
            ├── contacts                             │
            ├── scores (1:1)                         │
            ├── crm_records (1:1)                    │
            ├── outreach_recommendations             │
            └── conversions                          │
                                                     │
raw_signals (unprocessed)                              │
audit_logs ──────────────────────────────────────────┘
```

---

## Enums

```sql
user_role:        admin | sales_manager | sales_rep | viewer
signal_type:      HIRING_SIGNAL | FUNDING_SIGNAL | SOCIAL_SIGNAL | EXPANSION_SIGNAL
signal_source:    google_jobs | wellfound | career_page | crunchbase | news_api | linkedin | twitter | manual
crm_status:       pending | synced | failed | closed_won | closed_lost | dead_letter
```

---

## Core Tables

### `companies`

Primary entity — one row per resolved company.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Primary key |
| `name` | VARCHAR(500) | Display name |
| `normalized_name` | VARCHAR(500) | Lowercase, suffix-stripped for matching |
| `website` | VARCHAR(500) | Company website (unique when set) |
| `linkedin_url` | VARCHAR(500) | LinkedIn company page |
| `industry` | VARCHAR(255) | Industry vertical |
| `employee_count` | INTEGER | Estimated headcount |
| `city` | VARCHAR(255) | Primary city |
| `country` | VARCHAR(255) | Default: India |
| `funding_stage` | VARCHAR(100) | Seed, Series A, etc. |
| `latest_funding_date` | DATE | Most recent funding |
| `estimated_budget` | DECIMAL(12,2) | Workspace budget estimate |
| `is_active` | BOOLEAN | Default true |
| `is_remote_only` | BOOLEAN | Excluded from scoring if true |
| `is_staffing_agency` | BOOLEAN | Excluded from scoring if true |
| `hiring_count` | INTEGER | Count of hiring signals |
| `metadata` | JSONB | Flexible extra data |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | Auto-updated via trigger |

**Indexes:** normalized_name, city, industry, is_active, website (unique partial)

---

### `company_aliases`

Maps alternate names to canonical companies.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `company_id` | UUID FK → companies | Canonical company |
| `alias_name` | VARCHAR(500) | Original alias text |
| `normalized_alias` | VARCHAR(500) | Normalized, unique |

**Example:** "Google India" → company_id of "Google"

---

### `signals`

Processed buying signals linked to companies.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `company_id` | UUID FK → companies | |
| `signal_type` | signal_type ENUM | HIRING, FUNDING, SOCIAL, EXPANSION |
| `signal_source` | signal_source ENUM | Where it was collected |
| `signal_text` | TEXT | Human-readable signal description |
| `signal_date` | DATE | When the signal occurred |
| `confidence_score` | DECIMAL(5,2) | 0.00–1.00 |
| `is_duplicate` | BOOLEAN | Default false |
| `is_active` | BOOLEAN | False when stale (e.g. old hiring) |
| `raw_payload` | JSONB | Original source data |
| `content_hash` | VARCHAR(64) | SHA256 for deduplication |
| `created_at` | TIMESTAMPTZ | |

**Unique:** `(company_id, content_hash)` — prevents duplicate signals

---

### `raw_signals`

Unprocessed signals from collectors.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `source` | signal_source ENUM | Collection source |
| `raw_payload` | JSONB | Full raw JSON from collector |
| `processed` | BOOLEAN | Default false |
| `processing_error` | TEXT | Error message if processing failed |
| `created_at` | TIMESTAMPTZ | |

---

### `contacts`

People at target companies.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `company_id` | UUID FK → companies | |
| `name` | VARCHAR(255) | |
| `title` | VARCHAR(255) | Job title |
| `linkedin_url` | VARCHAR(500) | |
| `email` | VARCHAR(255) | |
| `seniority` | VARCHAR(100) | C-Level, VP, Manager, etc. |
| `decision_maker` | BOOLEAN | Default false |
| `created_at` | TIMESTAMPTZ | |

---

### `scores`

One score record per company (upserted on recalculate).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `company_id` | UUID FK UNIQUE → companies | |
| `fit_score` | DECIMAL(5,2) | 0–100 |
| `intent_score` | DECIMAL(5,2) | 0–100 |
| `timing_score` | DECIMAL(5,2) | 0–100 |
| `overall_score` | DECIMAL(5,2) | Weighted composite |
| `score_reasoning` | TEXT | Human-readable breakdown |
| `updated_at` | TIMESTAMPTZ | |

**Index:** overall_score DESC (for lead ranking)

---

### `crm_records`

Zoho Bigin sync state per company.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `company_id` | UUID FK UNIQUE → companies | |
| `zoho_lead_id` | VARCHAR(100) | Zoho lead ID |
| `status` | crm_status ENUM | Sync state |
| `assigned_salesperson` | VARCHAR(255) | Rep name |
| `last_updated` | TIMESTAMPTZ | |
| `retry_count` | INTEGER | Default 0, max 5 |
| `last_error` | TEXT | Last API error message |

**Status flow:** pending → synced | failed → dead_letter

---

### `outreach_recommendations`

AI-generated outreach per company.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `company_id` | UUID FK → companies | |
| `recommended_product` | VARCHAR(100) | Day Pass, Managed Office, etc. |
| `outreach_angle` | TEXT | Pain point / angle |
| `generated_message` | TEXT | Full JSON message |
| `subject` | VARCHAR(500) | Email subject |
| `personalization` | TEXT | Personalization paragraph |
| `pain_point` | TEXT | Identified pain point |
| `cta` | TEXT | Call to action |
| `ai_confidence` | DECIMAL(5,2) | 0.00–1.00 |
| `requires_human_review` | BOOLEAN | True if confidence < 0.70 |
| `created_at` | TIMESTAMPTZ | |

---

## Supporting Tables

### `users`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `email` | VARCHAR(255) UNIQUE | |
| `name` | VARCHAR(255) | |
| `role` | user_role ENUM | RBAC role |
| `password_hash` | VARCHAR(255) | For future auth |
| `is_active` | BOOLEAN | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### `audit_logs`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | Nullable |
| `action` | VARCHAR(100) | e.g. crm_sync, recalculate_scores |
| `entity_type` | VARCHAR(100) | e.g. companies, scores |
| `entity_id` | UUID | Target entity |
| `details` | JSONB | Request metadata |
| `ip_address` | INET | Client IP |
| `created_at` | TIMESTAMPTZ | |

### `conversions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `company_id` | UUID FK → companies | |
| `crm_record_id` | UUID FK → crm_records | |
| `conversion_type` | VARCHAR(100) | closed_won, meeting_booked, etc. |
| `conversion_date` | TIMESTAMPTZ | |
| `revenue` | DECIMAL(12,2) | Deal value |
| `notes` | TEXT | |

### `signal_embeddings` (Phase 3)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `signal_id` | UUID FK UNIQUE → signals | |
| `embedding` | vector(1536) | OpenAI embedding |
| `created_at` | TIMESTAMPTZ | |

**Index:** IVFFlat cosine similarity on embedding column

---

## Key Queries

### Top scored leads
```sql
SELECT c.*, s.overall_score
FROM companies c
JOIN scores s ON s.company_id = c.id
WHERE c.is_active = true
ORDER BY s.overall_score DESC
LIMIT 20;
```

### Qualified for CRM
```sql
SELECT c.id, c.name, s.overall_score
FROM companies c
JOIN scores s ON s.company_id = c.id
LEFT JOIN crm_records cr ON cr.company_id = c.id
WHERE s.overall_score >= 75
  AND c.is_active = true
  AND (cr.id IS NULL OR cr.status IN ('pending', 'failed'));
```

### Signals by type (dashboard)
```sql
SELECT signal_type, COUNT(*)
FROM signals
WHERE is_active = true
GROUP BY signal_type;
```

### Duplicate check
```sql
SELECT id FROM signals
WHERE company_id = $1 AND content_hash = $2;
```

---

## Migrations

```bash
# Apply migration
npm run db:migrate

# Seed data
npm run db:seed
```

To add a new migration, create `002_description.sql` and update `migrate.ts` to run sequentially.
