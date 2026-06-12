# Phase 2 — Transitioning Away Intelligence to Live Infrastructure

This implementation plan details the steps required to transition the Away Intelligence MVP (which is currently running with mock data and mock databases) into a production-hardened platform using live database systems, real queues, active scrapers, and distance-based filtering.

## User Review Required

> [!IMPORTANT]
> Since we currently have the MVP running in-memory for quick demonstration, transitioning to live databases (PostgreSQL/pgvector and Redis) will require starting up a PostgreSQL server and a Redis instance locally or in cloud environments (such as Railway or Neon).

> [!WARNING]
> Live scraping of LinkedIn and Crunchbase at scale may require third-party data providers (e.g. Proxycurl, Clay, or rapid API scrapers) to avoid rate limits or IP bans. We will start with standard Google Jobs API and Firecrawl scrapers.

## Open Questions

> [!IMPORTANT]
> **Please clarify these items before we begin execution:**
> 
> 1. **Next Scope Priorities:** Do you want us to transition the infrastructure to live databases (PostgreSQL + Redis) first, or do you want us to focus on building the real signal collectors (e.g., Google Jobs, Twitter, LinkedIn scraping)?
> 2. **away.center Locations Database:** For the "Distance from away.center location" filter, what are the coordinates (lat/lng) or street addresses of the away.center coworking hubs in Bangalore, Vizag, and Kolkata?
> 3. **CRM Sync Setup:** Do you have credentials/OAuth details for Zoho Bigin ready, or should we keep Zoho mocked for now?
> 4. **Authentication Requirement:** Should we implement a standard user login page (JWT + database users) for the Next.js dashboard now?

---

## Proposed Changes

### Database & Queue Infrastructure

#### [MODIFY] [pool.ts](file:///d:/away.centre/backend/src/db/pool.ts)
Revert the mock JSON database back to the real standard PostgreSQL connection pool utilizing `pg`, enabling `pgvector` indexing.

#### [MODIFY] [queues.ts](file:///d:/away.centre/backend/src/workers/queues.ts)
Revert the mock queue system to use `bullmq` with connection to the local/production Redis instance.

---

### Signal Collection & Scraping

#### [NEW] [google-jobs.ts](file:///d:/away.centre/backend/src/services/signals/collectors/google-jobs.ts)
Implement live scraping of Google Jobs using SerpAPI or direct search queries looking for "onsite" or "hybrid" roles in Bangalore, Vizag, and Kolkata.

#### [NEW] [firecrawl-scraper.ts](file:///d:/away.centre/backend/src/services/signals/collectors/firecrawl-scraper.ts)
Integrate Firecrawl API to extract jobs, location data, and team size info directly from target startup career pages.

---

### Scoring & ICP Filtering

#### [MODIFY] [scoring-engine.ts](file:///d:/away.centre/backend/src/services/scoring/scoring-engine.ts)
* Expose scoring weights and thresholds as configurable environment variables.
* Implement geographic distance scoring between company offices and away.center hub coordinates.

---

## Verification Plan

### Automated Tests
* Run `npm test` to verify that the scoring engine tests still pass after adding distance calculations and dynamic configurations.

### Manual Verification
* Trigger the pipeline via `/api/pipeline/run` and verify that raw signals are parsed and company details are populated in PostgreSQL.
* Open the Next.js dashboard to inspect the top-scored leads and check if they correctly sync to Zoho Bigin.
