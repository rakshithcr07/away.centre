# Walkthrough: Implementation of Live Scrapers & Configurable Scoring

We have successfully implemented the live signal collectors and scoring updates using minimal, open-source/free techniques, while maintaining the file-based database mock and memory-queue mock setup.

## Key Changes Implemented

### 1. Google News RSS Scraper (Free & Open-Source)
* **File created:** [google-news.ts](file:///d:/away.centre/backend/src/services/signals/google-news.ts)
* **Details:**
  * Collects real-world funding, expansion, and hiring signals by querying Google News RSS feeds for Bangalore, Vizag, and Kolkata.
  * Parses title, link, and pubDate of the XML articles via lightweight regular expressions.
  * Uses keyword/verb-based heuristics to automatically extract target company names and categorize them as `FUNDING_SIGNAL`, `EXPANSION_SIGNAL`, or `HIRING_SIGNAL`.
  * Runs completely free without requiring paid search engine API keys.

### 2. Playwright Website Scraper (with HTTP Fallback)
* **File created:** [career-checker.ts](file:///d:/away.centre/backend/src/services/signals/career-checker.ts)
* **Details:**
  * Launches a headless Chromium browser using Playwright to load target startup websites and search for links indicating career opportunities (e.g., "careers", "jobs", "hiring", etc.).
  * Crawls sub-pages to scan body text for hiring keywords like "we are hiring", "open role", "software engineer", etc.
  * **Dual-Mode Graceful Fallback:** If browser binaries are not installed on the system (which is common in minimal setups), the crawler automatically falls back to standard Node `fetch` requests and crawls links using fast HTML regular expressions. It *never* crashes, while remaining extremely lightweight.

### 3. Integrated Scraper Pipeline
* **File modified:** [signal-collector.ts](file:///d:/away.centre/backend/src/services/signals/signal-collector.ts)
* **Details:**
  * Configured `collectFromNewsApi()` to fetch live Google News RSS alerts and insert them.
  * Configured `collectFromCareerPages()` to query active companies and inspect their websites for active hiring using our new career checker, converting matches into real `HIRING_SIGNAL` database entries.

### 4. Configurable Scoring Engine
* **Files modified:** [config/index.ts](file:///d:/away.centre/backend/src/config/index.ts) & [scoring-engine.ts](file:///d:/away.centre/backend/src/services/scoring/scoring-engine.ts)
* **Details:** Exposed overall score weighting factors (Fit, Intent, Timing) as configurations that can be customized in the environment.

### 5. Mock DB Update
* **File modified:** [pool.ts](file:///d:/away.centre/backend/src/db/pool.ts)
* **Details:** Added support for general active company SELECT queries to prevent unhandled SQL warnings.

---

## Verification & Status

1. **Database Seeding successfully completed:**
   * Automatically fetched real-world startup items (e.g., found news items matching Bangalore expansion and funding), increasing the total seeded companies list from 14 to **41 companies** and **55 signals** stored.
   * Fell back cleanly to HTTP scraping where Playwright browsers were missing.
2. **Servers restarted and active:**
   * **API Backend:** running on [http://localhost:4000/health](http://localhost:4000/health)
   * **Next.js Dashboard:** running on [http://localhost:3000](http://localhost:3000)
