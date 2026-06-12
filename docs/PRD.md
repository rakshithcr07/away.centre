# Product Requirements Document (PRD)

## Away Intelligence

**Product:** Marketing Intelligence and Workspace Intent Platform  
**Owner:** away.center Sales & Growth  
**Version:** 1.0 (MVP)  
**Last Updated:** June 2026

---

## 1. Problem Statement

away.center sales teams spend significant time manually prospecting for companies that need coworking spaces, private offices, managed offices, day passes, meeting rooms, event spaces, and India team setup support. By the time a company actively searches for workspace, competitors may already be in conversation.

**Away Intelligence** identifies high-intent companies **before** they actively search, using external buying signals.

---

## 2. Product Vision

Enable away.center to reach workspace-ready companies before competitors by automatically:

1. Detecting buying signals from public sources
2. Scoring and ranking companies by fit, intent, and timing
3. Recommending the right workspace product
4. Generating personalized outreach
5. Pushing qualified leads into Zoho Bigin CRM
6. Notifying sales teams in real time

---

## 3. Target Users

| Persona | Role | Primary Need |
|---------|------|--------------|
| Sales Rep | `sales_rep` | Prioritized lead list with outreach suggestions |
| Sales Manager | `sales_manager` | Pipeline visibility, CRM sync, team performance |
| Admin | `admin` | System configuration, pipeline control, audit |
| Viewer | `viewer` | Read-only dashboard access |

---

## 4. Business Goals (MVP)

| Goal | Target |
|------|--------|
| Companies discovered per week | ≥ 50 |
| Identify before active search | Yes — signal-driven |
| Reduce manual prospecting | 50% reduction |
| Qualified lead generation | Automated (score ≥ 75) |
| Competitive advantage | Reach companies before competitors |

---

## 5. Core Features

### 5.1 Signal Collection

Collect and store raw buying signals from:

- **Job signals:** Google Jobs, Wellfound, company career pages
- **Funding signals:** Crunchbase, news APIs
- **Social signals:** LinkedIn posts, founder posts, HR posts, Twitter/X
- **Expansion signals:** India team announcements, Bangalore/Vizag/Kolkata expansion

### 5.2 Company Enrichment

- Normalize company names (merge aliases)
- Enrich partial records over time
- Track employee count, industry, city, funding stage

### 5.3 Scoring Engine

Score companies 0–100 on:

- **Fit** (40%) — size, location, industry
- **Intent** (40%) — hiring, funding, social, expansion signals
- **Timing** (20%) — signal recency

### 5.4 Product Recommendations

| Employee Count | Recommended Product |
|----------------|---------------------|
| 1–5 | Day Pass, Meeting Rooms |
| 6–30 | Coworking Seats, Private Office |
| 31–100 | Managed Office |
| 100+ | Enterprise Review |

### 5.5 Outreach Generation

GPT-powered generation of:

- Subject line
- Personalization
- Pain point
- Recommended product
- CTA

With confidence score and human review flag when confidence < 70%.

### 5.6 CRM Integration

Push qualified leads (overall_score ≥ 75) to **Zoho Bigin** with retry and dead-letter queue on failure.

### 5.7 Notifications

- Slack alerts for new qualified leads
- Email digest to sales team

### 5.8 Dashboard

- KPI summary
- Leads table with filters
- Company detail with signal timeline
- Signal explorer
- Sales queue (Immediate / Nurture / Manual Review / Ignored)

---

## 6. Exclusion Rules

Companies are excluded from scoring when:

- Fully remote
- Blue-collar hiring only
- Staffing agency posting for others
- Outside supported regions (non-India primary)
- Company closed / inactive
- No valid website
- Duplicate company or signal
- CRM status = closed-lost

---

## 7. Success Metrics

| Metric | Definition |
|--------|------------|
| High Intent Leads | Companies with overall_score ≥ 75 |
| New Signals | Signals created in last 7 days |
| Qualified Accounts | Distinct companies above threshold |
| Leads Sent to CRM | CRM records with status = synced |
| Conversion Rate | closed_won / total conversions |

---

## 8. Non-Goals (MVP)

- Full LinkedIn scraping at scale (mock/fallback in MVP)
- Multi-tenant SaaS for external customers
- Mobile native app
- Automated email sending (outreach is suggested, not sent)
- Payment / billing integration

---

## 9. Supported Regions

**Primary (score 100):** Bangalore, Vizag, Kolkata  
**Secondary (score 40):** Other Indian cities  
**Excluded (score 10):** Outside India

---

## 10. Dependencies

| System | Purpose |
|--------|---------|
| PostgreSQL + pgvector | Primary data store, vector search |
| Redis | Cache and job queue |
| OpenAI GPT | Outreach generation |
| Zoho Bigin | CRM |
| Slack | Team notifications |
| Firecrawl + Playwright | Career page crawling |
| Vercel | Frontend hosting |
| Railway | Backend hosting |
| Neon | Production PostgreSQL |
