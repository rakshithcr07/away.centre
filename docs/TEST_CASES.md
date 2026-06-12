# Test Cases

Test strategy and test case reference for Away Intelligence.

---

## 1. Test Strategy

| Layer | Tool | Location | Coverage |
|-------|------|----------|----------|
| Unit | Vitest | `backend/tests/` | Scoring engine |
| Integration | Vitest (planned) | `backend/tests/` | API routes, DB |
| E2E | Playwright (planned) | `frontend/e2e/` | Dashboard flows |
| Manual | Checklist | This doc | CRM, Slack, pipeline |

**Run unit tests:**
```bash
npm test
```

---

## 2. Scoring Engine Unit Tests

File: `backend/tests/scoring-engine.test.ts`  
**Status:** 38 tests passing

### 2.1 Company Size Scoring

| ID | Input | Expected |
|----|-------|----------|
| SIZE-01 | employee_count = 3 | score = 20 |
| SIZE-02 | employee_count = 5 | score = 20 |
| SIZE-03 | employee_count = 6 | score = 80 |
| SIZE-04 | employee_count = 20 | score = 80 |
| SIZE-05 | employee_count = 21 | score = 100 |
| SIZE-06 | employee_count = 100 | score = 100 |
| SIZE-07 | employee_count = 101 | score = 90 |
| SIZE-08 | employee_count = 300 | score = 90 |
| SIZE-09 | employee_count = 301 | score = 60 |
| SIZE-10 | employee_count = 1000 | score = 60 |
| SIZE-11 | employee_count = 1001 | score = 20 |
| SIZE-12 | employee_count = null | score = 50 |

### 2.2 Location Scoring

| ID | Input | Expected |
|----|-------|----------|
| LOC-01 | city = Bangalore | score = 100 |
| LOC-02 | city = Bengaluru | score = 100 |
| LOC-03 | city = Vizag | score = 100 |
| LOC-04 | city = Kolkata | score = 100 |
| LOC-05 | city = Mumbai | score = 40 |
| LOC-06 | city = San Francisco, USA | score = 10 |

### 2.3 Exclusion Rules

| ID | Condition | Expected |
|----|-----------|----------|
| EXC-01 | is_remote_only = true | excluded, score = 0 |
| EXC-02 | is_staffing_agency = true | excluded |
| EXC-03 | hasValidWebsite = false | excluded |
| EXC-04 | crmStatus = closed_lost | excluded |
| EXC-05 | blue collar hiring | excluded |

### 2.4 Integration Scoring

| ID | Scenario | Expected |
|----|----------|----------|
| INT-01 | Bangalore + hiring + funding | overall > 0, not excluded |
| INT-02 | Funding > 90 days old | "Ignored old funding" in reasoning |
| INT-03 | Same input twice | identical output (idempotent) |
| INT-04 | Weighted formula | overall = fit×0.4 + intent×0.4 + timing×0.2 |

---

## 3. API Integration Tests (Planned)

| ID | Endpoint | Test |
|----|----------|------|
| API-01 | GET /health | Returns 200 |
| API-02 | GET /api/dashboard/summary | 401 without API key |
| API-03 | GET /api/companies | Pagination works |
| API-04 | GET /api/companies?min_score=75 | Filters correctly |
| API-05 | POST /api/scores/recalculate | Requires admin role |

---

## 4. Pipeline Manual Tests

| ID | Scenario | Expected |
|----|----------|----------|
| PIPE-01 | POST /api/pipeline/run | Data populated |
| PIPE-02 | Run pipeline twice | No duplicate signals |
| PIPE-03 | CRM mock mode | Mock Zoho IDs created |
| PIPE-04 | No OpenAI key | Template outreach created |

---

## 5. Frontend Manual Tests

| ID | Page | Expected |
|----|------|----------|
| UI-01 | Dashboard | KPI cards populated |
| UI-02 | Leads | Filters work |
| UI-03 | Company Detail | Signal timeline visible |
| UI-04 | Sales Queue | 4 category columns |
| UI-05 | Empty state | Graceful when API down |

---

## 6. Edge Case Tests

| ID | Scenario | Expected |
|----|----------|----------|
| EDGE-01 | Same signal 3× | Only 1 stored |
| EDGE-02 | CRM fails 5× | status = dead_letter |
| EDGE-03 | GPT low confidence | requires_human_review = true |
| EDGE-04 | Partial company data | Stored, enriched later |

---

## 7. Performance Targets

| ID | Metric | Target |
|----|--------|--------|
| PERF-01 | GET /api/dashboard/summary | < 500ms |
| PERF-02 | Dashboard first load | < 2s |
| PERF-03 | Full pipeline | < 60s |
