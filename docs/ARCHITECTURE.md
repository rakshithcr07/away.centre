# Architecture Overview

## Away Intelligence

High-level architecture for the Marketing Intelligence and Workspace Intent Platform.

---

## 1. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SOURCES                             │
│  Google Jobs │ Wellfound │ Crunchbase │ News API │ LinkedIn │ X     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SIGNAL COLLECTOR SERVICE                        │
│              (Playwright / Firecrawl / API adapters)                 │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ raw_signals
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PIPELINE ORCHESTRATOR                         │
│  Normalize → Enrich → Score → Outreach → CRM → Notify               │
└───────┬─────────────────┬─────────────────┬─────────────────────────┘
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│  PostgreSQL  │  │    Redis     │  │  External APIs   │
│  + pgvector  │  │   BullMQ     │  │  OpenAI / Zoho   │
└──────┬───────┘  └──────────────┘  │  Slack / SMTP    │
       │                             └──────────────────┘
       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      NODE.JS EXPRESS API                             │
│  /dashboard  /companies  /signals  /sales-queue  /actions           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ REST + API Key
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      NEXT.JS 15 FRONTEND                             │
│  Dashboard │ Leads │ Company Detail │ Signals │ Sales Queue         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Responsibilities

### 2.1 Frontend (`frontend/`)

- Next.js 15 App Router
- Server-side data fetching from API
- Dark-themed sales dashboard
- Deployed on Vercel

### 2.2 Backend API (`backend/src/`)

- Express REST API
- Authentication middleware (API key + RBAC)
- Audit logging on write operations
- Deployed on Railway

### 2.3 Workers (`backend/src/workers/`)

- BullMQ job processors
- Pipeline execution
- CRM retry queue with exponential backoff

### 2.4 Scheduler (`backend/src/scheduler/`)

- node-cron triggers every 6 hours
- Enqueues pipeline job to BullMQ
- Fallback: direct pipeline run if Redis unavailable

### 2.5 Shared Types (`shared/`)

- TypeScript interfaces shared between frontend and backend
- Built to `shared/dist/` before backend/frontend compile

---

## 3. Data Flow

```
Signal Sources
    → raw_signals (unprocessed)
    → signals + companies (processed, deduplicated)
    → scores (calculated)
    → outreach_recommendations (GPT)
    → crm_records (Zoho sync)
    → notifications (Slack/email)
    → dashboard (read via API)
```

---

## 4. Technology Choices

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js 15 | SSR, fast dashboard, Vercel deploy |
| Styling | TailwindCSS | Rapid UI development |
| API | Node.js + Express | Team familiarity, JS ecosystem |
| Database | PostgreSQL | Relational data, ACID, mature |
| Vector search | pgvector | Semantic signal search without extra service |
| Cache / Queue | Redis + BullMQ | Node-native job queue (Celery equivalent) |
| Crawler | Playwright + Firecrawl | Career page and dynamic content |
| AI | OpenAI GPT-4o | Outreach generation (configurable model) |
| CRM | Zoho Bigin | away.center existing CRM |

---

## 5. Security Model

```
Request → helmet + cors → apiKeyAuth → roleAuth (write routes) → auditLog → handler
```

- API key required for all `/api/*` routes
- Role check on destructive/write endpoints
- Audit log captures action, entity, IP
- Secrets in environment variables only

---

## 6. Scalability Considerations (Post-MVP)

- Horizontal API scaling on Railway
- Separate worker processes for pipeline
- Read replicas for dashboard queries
- Signal collector sharding by source
- pgvector IVFFlat index tuning for embeddings

---

## 7. Observability

- Winston structured logging
- Slow query warnings (>500ms)
- Pipeline duration logging
- CRM retry count and dead-letter tracking
- Audit log table for compliance

---

## 8. Failure Modes

| Failure | Mitigation |
|---------|------------|
| DB down | API health check fails, no start |
| Redis down | Scheduler falls back to direct pipeline |
| Zoho API down | Retry 5×, then dead_letter |
| OpenAI down | Fallback template outreach (confidence 0.65) |
| LinkedIn blocked | Log warning, skip source, continue pipeline |
| Duplicate signal | Unique index on content_hash |
