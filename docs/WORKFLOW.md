# System Workflow: Away Intelligence

This document details the end-to-end technical workflow of the **Away Intelligence** application, describing how signals are discovered, companies are scored, recommendations are generated, and data is prioritized on the sales dashboard.

---

## 1. High-Level Data Flow

```mermaid
graph TD
    A[Data Ingestion] --> B[Data Processing & Merge]
    B --> C[Scoring & ICP Filtering]
    C --> D[Outreach & Recommendations]
    D --> E[CRM Integration]
    D --> F[Dashboard Display]
    E --> F
```

---

## 2. Ingestion & Scraper Workflow

The signal collection runs on a scheduler or manual trigger. It combines mock lists with real-world live scrapers.

```mermaid
sequenceDiagram
    participant S as Signal Collector
    participant RSS as Google News RSS Search
    participant W as Company Website Scraper
    participant DB as Mock DB (.mock_db.json)

    Note over S: Scheduler triggers collection
    
    S->>RSS: Query: "funding raised/office expansion/hiring [City]"
    RSS-->>S: Return XML RSS feeds
    Note over S: Parse items using Regex, clean XML entities, extract company name heuristics

    S->>DB: Fetch active companies with websites
    DB-->>S: Return active websites list

    loop For each website
        S->>W: Crawl site (Playwright Chromium)
        Note over W: Scan links for "careers", "jobs"
        alt Playwright Success
            W-->>S: Return text scan result (hiring status)
        else Playwright Fails (No binaries)
            S->>W: Fallback: crawler fetch HTTP request
            W-->>S: Return text scan result
        end
    end

    S->>DB: Bulk insert raw signals into raw_signals table
```

---

## 3. Data Processing & Deduplication

Signals are normalized and companies are merged before scoring.

```mermaid
flowchart TD
    A[Raw Signal Received] --> B{Does company alias exist?}
    B -- Yes --> C[Get existing company_id]
    B -- No --> D{Does website domain match company?}
    D -- Yes --> C
    D -- No --> E{Fuzzy name match against database?}
    E -- Yes --> F[Insert into company_aliases] --> C
    E -- No --> G[Create new company in database] --> C
    C --> H[Generate content hash for signal text]
    H --> I{Is duplicate content hash in signals?}
    I -- Yes --> J[Skip duplicates]
    I -- No --> K[Insert signal linked to company]
```

---

## 4. Scoring & Product Recommendation Engine

The scoring engine ranks companies using configurable weights (`SCORING_FIT_WEIGHT`, `SCORING_INTENT_WEIGHT`, `SCORING_TIMING_WEIGHT`).

```mermaid
flowchart TD
    A[Assess Company] --> B{Check Exclusions}
    B -- Inactive / Fully Remote / Staffing Agency / Blue Collar Only / Closed-Lost --> C[Exclude company: score = 0]
    B -- Passes Exclusions --> D[Calculate Sub-Scores]

    subgraph Sub-Scores
        D --> E[Fit Score: Size 40% + Location 35% + Industry 25%]
        D --> F[Intent Score: Base 10 per signal + Keyword Boosts cap 100]
        D --> G[Timing Score: Recency of newest active signal cap 100]
    end

    E --> H[Calculate Overall Score]
    F --> H
    G --> H

    H --> I{Overall Score >= 75?}
    I -- Yes --> J[Status: Qualified Lead]
    I -- No --> K{Overall Score 50-74?}
    K -- Yes --> L[Status: Nurture Lead]
    K -- No --> M[Status: Ignored Lead]

    H --> N[Recommend Workspace Product]
    N --> N1[1-5 employees: Day Pass & Meeting Rooms]
    N --> N2[6-30 employees: Coworking Seats & Private Office]
    N --> N3[31-100 employees: Managed Office]
    N --> N4[100+ employees: Enterprise Review]
```

---

## 5. Queue & CRM Integration Workflow

Qualified leads (`overall_score >= 75`) trigger asynchronous background tasks.

```mermaid
sequenceDiagram
    participant PE as Pipeline Orchestrator
    participant Q as Mock Queue (setTimeout)
    participant O as Outreach Service (GPT or Fallback)
    participant CRM as Zoho CRM Sync
    participant DB as Mock DB (.mock_db.json)

    PE->>Q: Enqueue pipeline task
    Note over Q: Execute background job in 100ms
    Q->>O: Generate outreach recommendations
    alt OpenAI Key Available
        O-->>Q: Generate message via GPT-4o JSON Mode
    else OpenAI Key Falsy
        O-->>Q: Generate fallback template based on signal text
    end
    Q->>DB: Store outreach recommendation

    PE->>Q: Enqueue CRM sync task
    Q->>CRM: Push qualified leads
    alt Zoho Client ID Present
        CRM->>Q: Connect via OAuth token and insert Zoho Lead
    else Zoho Client ID Missing
        CRM->>Q: Generate local ZOHO mock ID
    end
    Q->>DB: Update CRM Lead record status = "synced"
```

---

## 6. Dashboard Flow (Frontend Layout)

* **`/` (Dashboard Summary)**: Exposes total metrics (High Intent count, New Signals, Conversion Rates), top cities, and a quick list of top-scored companies.
* **`/leads` (Leads Explorer)**: Provides paginated list of companies with advanced filtering (city, industry, score range, signal types).
* **`/companies/[id]` (Details Page)**: Displays company details, signal history, contacts, CRM log, and AI-generated outreach copy.
* **`/sales-queue` (Outreach Board)**: Splits sales reps' action tasks into **Immediate Outreach**, **Manual Review**, or **Nurture**.
* **`/signals` (Signal Feed)**: Feeds chronological signal notifications.
