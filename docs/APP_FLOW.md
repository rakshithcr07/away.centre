# Application Flow

User journeys and system flows for Away Intelligence.

---

## 1. Sales Rep Daily Flow

```
Login (future) → Dashboard
    │
    ├─► Review KPIs (high intent count, new signals)
    │
    ├─► Open Sales Queue
    │       ├─ Immediate Outreach → contact within 24h
    │       ├─ Manual Review → approve AI outreach first
    │       └─ Nurture → add to email sequence
    │
    ├─► Click company → Company Detail
    │       ├─ Review signal timeline
    │       ├─ Read outreach recommendation
    │       ├─ Copy subject + message
    │       └─ Contact decision makers
    │
    └─► Sync CRM (manual trigger if needed)
```

---

## 2. Sales Manager Flow

```
Dashboard → Leads Table
    │
    ├─► Filter by city, industry, score range
    │
    ├─► Review qualified accounts (score ≥ 75)
    │
    ├─► Check CRM sync status
    │
    ├─► Recalculate Scores (after manual data fix)
    │
    └─► Monitor conversion rate KPI
```

---

## 3. Admin Flow

```
POST /api/pipeline/run → trigger full pipeline manually
POST /api/scores/recalculate → force score refresh
POST /api/crm/sync → push pending leads to Zoho
POST /api/notifications/send → test Slack alerts

Monitor:
  - audit_logs table
  - crm_records with status = dead_letter
  - raw_signals with processing_error
```

---

## 4. Pipeline Flow (Automated)

Runs every **6 hours** via scheduler.

```
┌─────────────┐
│  Scheduler  │ cron: 0 */6 * * *
└──────┬──────┘
       ▼
┌─────────────┐
│  Collect    │ Google News RSS (Free), Playwright Web Scraper
│  Signals    │ (with HTTP crawler fallback), and Mock feeds
└──────┬──────┘
       ▼
┌─────────────┐
│  Store Raw  │ → raw_signals table
└──────┬──────┘
       ▼
┌─────────────┐
│  Process    │ dedupe, resolve company, insert signals
└──────┬──────┘
       ▼
┌─────────────┐
│  Normalize  │ merge aliases (Google LLC = Google India)
└──────┬──────┘
       ▼
┌─────────────┐
│  Enrich     │ fill website, city, industry from signals
└──────┬──────┘
       ▼
┌─────────────┐
│  Score      │ fit + intent + timing → overall_score
└──────┬──────┘
       ▼
┌─────────────┐
│  Outreach   │ GPT message for score ≥ 75
└──────┬──────┘
       ▼
┌─────────────┐
│  CRM Push   │ Zoho Bigin for qualified leads
└──────┬──────┘
       ▼
┌─────────────┐
│  Notify     │ Slack + email to sales team
└──────┬──────┘
       ▼
┌─────────────┐
│  Dashboard  │ updated data visible via API
└─────────────┘
```

---

## 5. Signal Processing Flow

```
Raw Signal JSON
    │
    ├─► findOrCreateCompany(name, website, city, ...)
    │       ├─ alias lookup
    │       ├─ domain lookup
    │       ├─ fuzzy name match
    │       └─ create new
    │
    ├─► hashContent(type, text, date, company_id)
    │
    ├─► duplicate check → skip if exists
    │
    ├─► INSERT signal
    │
    └─► IF HIRING_SIGNAL → increment company.hiring_count
```

---

## 6. Scoring Decision Flow

```
Company + Signals
    │
    ├─ is_active? ──NO──► EXCLUDE (score=0)
    ├─ has website? ──NO──► EXCLUDE
    ├─ is_remote_only? ──YES──► EXCLUDE
    ├─ is_staffing_agency? ──YES──► EXCLUDE
    ├─ crm = closed_lost? ──YES──► EXCLUDE
    ├─ blue collar hiring? ──YES──► EXCLUDE
    ├─ outside India? ──YES──► EXCLUDE
    │
    └─► CALCULATE SCORES
            │
            ├─ overall ≥ 75 → qualified
            │       ├─ generate outreach
            │       ├─ push to CRM
            │       └─ sales queue: immediate_outreach
            │
            ├─ overall 50-74 → nurture queue
            │
            └─ overall < 50 → ignored
```

---

## 7. CRM Sync Flow

```
Qualified Company (score ≥ 75)
    │
    ├─ crm_record exists?
    │       ├─ status = synced → skip
    │       ├─ status = closed_lost → skip
    │       └─ status = failed → retry
    │
    ├─► Call Zoho Bigin API
    │       ├─ success → zoho_lead_id, status=synced
    │       └─ failure → retry_count++, status=failed
    │
    └─ retry_count ≥ 5 → status=dead_letter
```

---

## 8. Frontend Page Flow

| Route | Data Source | User Action |
|-------|-------------|-------------|
| `/` | dashboard/summary + companies | View KPIs, top leads |
| `/leads` | companies (filtered) | Filter, paginate, click company |
| `/companies/[id]` | companies/:id | Review signals, outreach, contacts |
| `/signals` | signals (filtered) | Explore raw signals |
| `/sales-queue` | sales-queue | Prioritize outreach |

---

## 9. Error Recovery Flows

| Error | Recovery |
|-------|----------|
| Pipeline job fails | BullMQ retries 3× with exponential backoff |
| CRM sync fails | Per-lead retry up to 5×, then dead_letter |
| LinkedIn blocked | Log, skip source, continue pipeline |
| GPT unavailable | Template fallback outreach |
| API down (frontend) | Empty state, zero KPIs, no crash |

---

## 10. Data Lifecycle

```
Signal created → active
    │
    ├─ duplicate detected → never inserted
    │
    ├─ hiring signal > 60 days old → is_active = false
    │
    └─ company deactivated → cascade inactive

Score calculated → updated on every pipeline run

CRM record → pending → synced | failed → dead_letter
                        └→ closed_won | closed_lost (manual)
```
