# Away Intelligence: Product & System Architecture Specification
This document outlines the product brief, system design, data strategy, scoring models, and implementation recommendations for Away Intelligence.

---

## 1. Product Brief

### What Problem Are We Solving?
Currently, away.center's sales teams spend significant time manually prospecting for companies that need coworking spaces, private offices, managed offices, day passes, meeting rooms, event spaces, and India team setup support. By the time a company actively searches for a coworking space, competitors may already be in conversation. 

Away Intelligence changes this from a **reactive search** to a **predictive signal-driven GTM model**. It identifies companies in target cities (Bangalore, Vizag, Kolkata) that are showing early signals of physical growth, hiring surges, or remote-to-hybrid transitions, enabling sales reps to contact decision-makers *before* competitors do.

### Who is the User?
*   **Sales Representative (`sales_rep`)**: Needs a prioritized list of accounts, context on *why* a company is interested (the signals), key contacts, and AI-generated email drafts to initiate immediate outreach.
*   **Sales Manager (`sales_manager`)**: Needs pipeline visibility, conversion rates, and control over CRM syncing.
*   **Admin (`admin`)**: Needs to tune scoring weights, schedule the collection pipelines, and review execution logs.

### What is the MVP?
A self-contained web platform that:
1.  Runs an automated background collection pipeline to scrape and ingest public data (job boards, news, career pages).
2.  Deduplicates, resolves, and scores companies from 0 to 100 based on Fit, Intent, and Timing.
3.  Suggests the right workspace product (e.g., Private Office for companies with 6-30 employees) and drafts a personalized email template using GPT.
4.  Provides a prioritized Kanban **Sales Queue** divided into:
    *   *Immediate Outreach* (Score ≥ 75, ready to be pushed to CRM).
    *   *Nurture* (Score 50-74, long-term tracking).
    *   *Manual Review* (Low confidence AI generation, needs sales rep review).
    *   *Ignored* (Excluded accounts).
5.  Pushes hot leads automatically or manually into **Zoho Bigin CRM**.

### What to Build First?
1.  **Shared Types & Database Schema**: Set up the relational core for companies, signals, and scores.
2.  **Mock DB & Local API Server**: Establish the local development environment using Node/Express without heavy local DB/Redis dependencies to ensure rapid prototyping.
3.  **Core Scrapers**: Create the RSS News Scraper and the Career Page Crawler.
4.  **Priority Sales Queue & Detail View**: Design a high-contrast web dashboard so sales reps can act on data immediately.

### What NOT to Build?
*   **A Custom CRM**: Use Zoho Bigin for deal management, pipelines, and tasks; do not build CRM functionalities internally.
*   **Email Sending Gateway**: The system drafts and formats emails. It does not send them directly, preventing accidental spam and ensuring a "human-in-the-loop" review model.
*   **Massive B2B Database**: Do not try to replicate ZoomInfo or Apollo; query them in real-time or via targeted scraper waterfalls.

### What to Buy?
*   **Apollo.io / People Data Labs**: For contact enrichment (emails, LinkedIn profiles, phone numbers) once a target company is flagged.
*   **OpenAI API**: For structuring unstructured text and personalizing outreach drafts.
*   **Hosted Database / Redis**: Neon (Serverless Postgres) and Upstash (Serverless Redis) to keep maintenance overhead near zero.

### What Does Success Look Like?
*   **50+ high-intent leads** identified per week.
*   **50% reduction** in time spent by sales reps on manual prospecting.
*   **20-30% higher conversion rate** on cold outreach compared to standard outbound.

---

## 2. System Architecture Diagram

```
                 ┌────────────────────────────────────────────────────────┐
                 │                 UNSTRUCTURED PUBLIC SOURCES            │
                 │ Google News RSS ── Playwright Crawler ── Google Jobs   │
                 └───────────────────────────┬────────────────────────────┘
                                             │ raw signals
                                             ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                              PIPELINE ORCHESTRATOR                                     │
 │ ┌──────────────────────┐   ┌─────────────────────┐   ┌──────────────┐   ┌────────────┐ │
 │ │ Company Resolver &   │ ──│ Scoring Engine      │── │ AI Outreach  │── │ CRM Sync   │ │
 │ │ Name Normalization   │   │ (Fit, Intent, Time) │   │ (GPT-4o)     │   │ Queue      │ │
 │ └──────────────────────┘   └─────────────────────┘   └──────────────┘   └────────────┘ │
 └────────────────────────┬──────────────┬───────────────┬────────────────────────┬───────┘
                          │              │               │                        │
                          ▼              ▼               ▼                        ▼
                   ┌──────────────┐┌───────────┐┌──────────────────┐       ┌──────────────┐
                   │  PostgreSQL  ││   Redis   ││   Enrichment     │       │  Zoho Bigin  │
                   │  + pgvector  ││  (BullMQ) ││  (Apollo API)    │       │     CRM      │
                   └──────────────┘└───────────┘└──────────────────┘       └──────────────┘
                          ▲
                          │ REST + API Key
                          ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   EXPRESS API SERVER                                   │
 └────────────────────────────────────────┬───────────────────────────────────────────────┘
                                          │
                                          ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   NEXT.JS 15 FRONTEND                                  │
 │   Dashboard ─── Sales Queue ─── Company Profile ─── Leads Table ─── Settings Panel     │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. ICP and Scoring Logic

### Ideal Customer Profile (ICP) Filters
*   **Geography**: Cities where away.center has physical locations: **Bangalore**, **Vizag**, **Kolkata** (Score 100). Sibling Indian cities (Score 40). Non-India (Score 0 / Excluded).
*   **Company Size**: 10 to 500 employees (sweet spot for private and managed offices).
*   **Hiring Profile**: Hiring for white-collar office roles (Software Engineers, HR, Sales, Admins, Office Managers, Operations) in target cities.
*   **Office Intent**: Hiring for "Onsite" or "Hybrid" models.
*   **Budget**: High-growth startups with recent funding rounds (Series A/B/C) indicating budget to invest in workspace infrastructure.

### Lead Scoring Model (Weighted Sum)
$$\text{Overall Score} = (w_f \times \text{Fit Score}) + (w_i \times \text{Intent Score}) + (w_t \times \text{Timing Score})$$
*(Default weights: $w_f = 0.35, w_i = 0.35, w_t = 0.30$)*

#### 1. Fit Score (Max 100)
*   **City**: Match with primary cities = 100 points. Match with secondary cities = 40 points.
*   **Company Size**: 10–50 employees = 100 points. 51–200 employees = 80 points. 1–9 employees = 50 points. 200+ employees = 30 points.
*   **Industry**: Tech, Fintech, SaaS, Consulting = 100 points. Traditional logistics, industrial = 30 points.

#### 2. Intent Score (Max 100)
*   **Hiring Signals**: Active hiring in target city = 50 points.
*   **Expansion Signals**: Opening new branch / office expansion = 40 points.
*   **Funding Signals**: Raised funding in last 12 months = 30 points.
*   **Onsite/Hybrid Language**: Job description states "Onsite" or "Hybrid" = 20 points.

#### 3. Timing Score (Max 100)
*   **Signal Recency**: 
    *   Signal detected in last 7 days = 100 points.
    *   Signal detected 8–30 days ago = 70 points.
    *   Signal detected 31–90 days ago = 30 points.
    *   Older than 90 days = 10 points.

### Reducing False Positives
*   **Negative Signals Filter**: Automatic exclusion if the company is a staffing agency, is fully remote, or is hiring purely blue-collar workers (e.g., delivery riders, warehouse workers).
*   **Fuzzy Name Matching**: Prevent duplicate leads by normalizing names and matching domains.
*   **Human-in-the-Loop**: If the AI confidence score of the generated outreach is under 70%, it is placed in the "Manual Review" queue instead of auto-syncing to Zoho.

---

## 4. Data Source Plan

### Data Flow Pipeline
1.  **Ingestion**: Scrapers fetch raw feed items (Google News, Wellfound, RSS feeds).
2.  **Cleaning & Normalization**:
    *   Remove common corporate suffixes ("Pvt. Ltd.", "Inc.").
    *   Extract domain from URL (e.g., `https://sliceit.com` -> `sliceit.com`).
    *   Deduplicate using a unique hash of the signal content (`SHA256`).
3.  **Resolution & Merge**: Match the company against existing database records via domain or name similarity. If matched, append the new signal to the existing profile rather than creating a new company.
4.  **Enrichment**: Query the Apollo.io API using the company domain to find the headcount, exact city, and contact details for the decision-makers.

### Reliability of Data Sources

| Source | Reliability | Cost | Notes |
| :--- | :--- | :--- | :--- |
| **Google News RSS** | High | Free | Best for corporate office openings/expansion news. |
| **Company Career Pages** | High | Free | Directly indicates hiring intent. Low false-positive rate. |
| **Wellfound / Job Boards** | Medium-High | Low | Excellent for early-stage startup hiring. |
| **LinkedIn Posts** | Medium | High | Hard to scrape directly due to IP blocks. |

*   **Avoid Scraping**: Avoid direct, high-volume scraping of LinkedIn or Google Search pages. This leads to IP blocks, captchas, and high proxy costs. Instead, use official APIs or data aggregators like Apollo.io for enrichment.
*   **Compliance (GDPR / DPDP)**: Store only publicly broadcasted business contact information. Include opt-out links in emails. Ensure the tool is used internally by sales reps rather than doing automated cold mass-mailing.

---

## 5. Database Schema

```sql
-- Companies Table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    normalized_name VARCHAR(255) UNIQUE,
    website VARCHAR(255),
    linkedin_url VARCHAR(255),
    industry VARCHAR(100),
    employee_count INTEGER,
    city VARCHAR(100),
    country VARCHAR(100),
    funding_stage VARCHAR(100),
    latest_funding_date DATE,
    estimated_budget NUMERIC,
    is_active BOOLEAN DEFAULT true,
    is_remote_only BOOLEAN DEFAULT false,
    is_staffing_agency BOOLEAN DEFAULT false,
    hiring_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company Aliases (for deduplication)
CREATE TABLE company_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    alias_name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Signals Table
CREATE TABLE signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    signal_type VARCHAR(50) NOT NULL, -- 'HIRING_SIGNAL', 'FUNDING_SIGNAL', etc.
    signal_source VARCHAR(50) NOT NULL, -- 'career_page', 'news_api', etc.
    signal_text TEXT NOT NULL,
    signal_date DATE NOT NULL,
    confidence_score INTEGER DEFAULT 100,
    content_hash VARCHAR(64) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (company_id, content_hash)
);

-- Contacts Table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    linkedin_url VARCHAR(255),
    email VARCHAR(255),
    seniority VARCHAR(50),
    decision_maker BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scores Table
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
    fit_score INTEGER DEFAULT 0,
    intent_score INTEGER DEFAULT 0,
    timing_score INTEGER DEFAULT 0,
    overall_score INTEGER DEFAULT 0,
    score_reasoning TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outreach Recommendations Table
CREATE TABLE outreach_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    recommended_product VARCHAR(100),
    outreach_angle VARCHAR(255),
    subject VARCHAR(255),
    personalization TEXT,
    pain_point TEXT,
    cta TEXT,
    ai_confidence NUMERIC,
    requires_human_review BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM Records (Sync Audit Log)
CREATE TABLE crm_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
    zoho_lead_id VARCHAR(100),
    status VARCHAR(50) NOT NULL, -- 'pending', 'synced', 'failed', 'dead_letter'
    assigned_salesperson VARCHAR(100),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    retry_count INTEGER DEFAULT 0,
    last_error TEXT
);
```

---

## 6. CRM & Sales Integration Plan

### How the Sales Team Acts on It
1.  Every morning, the sales rep logs into the dashboard and views the **Sales Queue** under the *Immediate Outreach* tab.
2.  They review the AI-suggested subject line and personalized message.
3.  They click **Find via Apollo** to pull the latest contact information.
4.  They push the lead to Zoho CRM by clicking **Sync to Zoho**.
5.  They copy the personalized outreach template and send it via email or LinkedIn.

### Zoho Bigin API Integration
*   The backend enqueues CRM sync jobs to a **BullMQ queue** powered by Redis.
*   The worker retrieves Zoho Access Tokens using a secure OAuth2 refresh token workflow.
*   It checks if the company already exists in Zoho (to prevent duplicates) and creates a new Lead/Contact.
*   **Error Management**: If the Zoho API rate limit is exceeded or returns a `5xx` error, the job is retried using exponential backoff (e.g., retry after 5 mins, 15 mins, 45 mins). After 5 failed attempts, the status is marked as `dead_letter` for manual admin review.

---

## 7. Build vs. Buy Recommendation

We recommend a **hybrid architecture** that builds the orchestration layer internally but buys/integrates specialized APIs for data enrichment and scraping.

### Internally Built (Custom Code)
*   **Orchestration Engine**: Custom background job queue (BullMQ), name normalization, and company merging rules.
*   **Scoring Model & Product Recommendation**: Custom calculation based on away.center's specific locations and product catalog.
*   **Sales Dashboard**: Next.js app to display the pipeline, queues, and settings.

### Bought / Third-Party Integrated
*   **Contact & Company Profile Enrichment**: Integrated via **Apollo.io API** or **Clay** waterfalls (do not build in-house web scrapers to crawl social profiles).
*   **Raw News & Alert Extraction**: Integrated via **Google News RSS** and **NewsAPI**.
*   **AI Copywriting**: Powered by **OpenAI API (GPT-4o)**.

### Monthly Cost Analysis (Projections for MVP)

| Component | Provider | Cost | Notes |
| :--- | :--- | :--- | :--- |
| **Enrichment** | Apollo.io API (Basic) | \$99 / mo | 2,000 email/phone credits per month. |
| **Web Crawling** | ScrapingBee or similar proxy | \$49 / mo | For fallback career page crawling. |
| **Generative AI** | OpenAI API (GPT-4o-mini) | \~$20 / mo | Pay-per-token (extremely cheap for small payloads). |
| **Database & Queue** | Neon + Upstash Redis | \$0 - \$20 / mo | Free tiers cover initial low-volume testing. |
| **Hosting** | Vercel (Frontend) + Railway (Backend) | \$25 / mo | For running background Node services. |
| **Total Estimated Cost** | — | **\~$213 / month** | Extremely cost-effective for a business pipeline. |

---

## 8. Risks, Compliance, and Future Improvements

### Key Risks & Mitigations
*   **LinkedIn Web Scraping Blocks**: *Risk:* Getting account-restricted or IP-blocked. *Mitigation:* Completely avoid scraping LinkedIn directly. Instead, fetch employee and role data programmatically via Apollo.io enrichment API.
*   **Data Decay**: *Risk:* Contacts changing jobs, making emails bounce. *Mitigation:* Refresh contact details through the enrichment API before launching campaigns.
*   **Sales Team Alert Fatigue**: *Risk:* Too many low-quality leads flooding the CRM. *Mitigation:* Ensure a strict threshold (score ≥ 75) for auto-syncing, and keep a manual review queue active.

### Continuous Improvement (Feedback Loop)
*   **Outcome Tracking**: The system monitors deals synced to Zoho. When a lead's status transitions to `closed_won` or `closed_lost`, the outcome is recorded.
*   **Machine Learning Calibration**: If a high-intent lead in a particular industry or city consistently results in a `closed_lost` deal, the system decreases that industry's/city's Fit score weight. If a specific signal (e.g., funding) leads to a high rate of `closed_won` deals, its Intent score weight is automatically boosted.
