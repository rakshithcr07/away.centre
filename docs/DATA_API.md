# Data API Reference

REST API documentation for Away Intelligence backend.

**Base URL:** `http://localhost:4000` (dev)  
**Auth:** All `/api/*` routes require header `x-api-key`  
**Role header (write routes):** `x-user-role: admin | sales_manager | sales_rep | viewer`

---

## Health Check

### `GET /health`

No authentication required.

**Response 200:**
```json
{
  "status": "ok",
  "timestamp": "2026-06-11T15:30:00.000Z"
}
```

---

## Dashboard

### `GET /api/dashboard/summary`

KPI metrics for the dashboard.

**Response 200:**
```json
{
  "high_intent_leads": 12,
  "new_signals": 45,
  "qualified_accounts": 12,
  "leads_sent_to_crm": 8,
  "conversion_rate": 25,
  "signals_by_type": {
    "HIRING_SIGNAL": 20,
    "FUNDING_SIGNAL": 8,
    "SOCIAL_SIGNAL": 10,
    "EXPANSION_SIGNAL": 7
  },
  "top_cities": [
    { "city": "Bangalore", "count": 15 },
    { "city": "Kolkata", "count": 3 }
  ]
}
```

---

## Companies

### `GET /api/companies`

Paginated list of companies with scores and CRM status.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `city` | string | Filter by city (partial match) |
| `industry` | string | Filter by industry |
| `signal_type` | enum | HIRING_SIGNAL, FUNDING_SIGNAL, etc. |
| `funding_stage` | string | Filter by funding stage |
| `min_score` | number | Minimum overall_score |
| `max_score` | number | Maximum overall_score |
| `recency_days` | number | Has signal within N days |
| `page` | number | Page number (default: 1) |
| `limit` | number | Page size (default: 20, max: 100) |
| `sort` | string | overall_score, name, hiring_count, created_at |
| `order` | string | asc or desc |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Razorpay",
      "website": "https://razorpay.com",
      "linkedin_url": null,
      "industry": "Fintech",
      "city": "Bangalore",
      "employee_count": 2500,
      "hiring_count": 3,
      "signal_types": ["HIRING_SIGNAL", "FUNDING_SIGNAL"],
      "fit_score": 72,
      "intent_score": 85,
      "timing_score": 100,
      "overall_score": 83,
      "recommended_product": "Enterprise Review",
      "crm_status": "synced",
      "assigned_salesperson": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "total_pages": 1
  }
}
```

### `GET /api/companies/:id`

Full company detail with related data.

**Response 200:**
```json
{
  "id": "uuid",
  "name": "Razorpay",
  "website": "https://razorpay.com",
  "industry": "Fintech",
  "city": "Bangalore",
  "employee_count": 2500,
  "hiring_count": 3,
  "signals": [
    {
      "id": "uuid",
      "signal_type": "HIRING_SIGNAL",
      "signal_source": "wellfound",
      "signal_text": "Hiring in Bangalore - 15 engineering roles",
      "signal_date": "2026-06-11",
      "confidence_score": 0.92
    }
  ],
  "contacts": [
    {
      "id": "uuid",
      "name": "Arjun Mehta",
      "title": "CEO",
      "email": "arjun@razorpay.com",
      "decision_maker": true
    }
  ],
  "score": {
    "fit_score": 72,
    "intent_score": 85,
    "timing_score": 100,
    "overall_score": 83,
    "score_reasoning": "Fit: size=20, location=100..."
  },
  "crm_record": {
    "zoho_lead_id": "ZOHO-123",
    "status": "synced"
  },
  "outreach": {
    "recommended_product": "Enterprise Review",
    "subject": "Razorpay — workspace solution for Bangalore",
    "personalization": "I noticed your recent hiring...",
    "pain_point": "Growing teams need flexible workspace",
    "cta": "Would you be open to a 15-minute call?",
    "ai_confidence": 0.75,
    "requires_human_review": false
  }
}
```

**Response 404:**
```json
{ "error": "Company not found" }
```

---

## Signals

### `GET /api/signals`

Browse signals with filters.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `signal_type` | enum | Signal type filter |
| `signal_source` | enum | Source filter |
| `city` | string | Company city |
| `industry` | string | Company industry |
| `min_confidence` | number | Min confidence (0-1) |
| `recency_days` | number | Signal within N days |
| `page` | number | Page number |
| `limit` | number | Page size (max 100) |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "company_id": "uuid",
      "company_name": "Razorpay",
      "signal_type": "HIRING_SIGNAL",
      "signal_source": "wellfound",
      "signal_text": "Hiring in Bangalore - 15 engineering roles",
      "signal_date": "2026-06-11",
      "confidence_score": 0.92,
      "city": "Bangalore",
      "industry": "Fintech",
      "website": "https://razorpay.com"
    }
  ]
}
```

---

## Sales Queue

### `GET /api/sales-queue`

Prioritized outreach queue.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `category` | string | immediate_outreach, nurture, manual_review, ignored |

**Response 200:**
```json
{
  "data": [
    {
      "company_id": "uuid",
      "company_name": "Juspay",
      "overall_score": 82,
      "category": "immediate_outreach",
      "recommended_product": "Managed Office",
      "next_action": "Contact within 24h",
      "signal_count": 2,
      "latest_signal_date": "2026-06-11"
    }
  ],
  "grouped": {
    "immediate_outreach": [],
    "nurture": [],
    "manual_review": [],
    "ignored": []
  }
}
```

---

## Actions

### `POST /api/scores/recalculate`

Recalculate scores for all active companies.

**Required role:** `admin`, `sales_manager`

**Response 200:**
```json
{
  "message": "Recalculated scores for 15 companies",
  "count": 15
}
```

### `POST /api/crm/sync`

Push qualified leads to Zoho Bigin.

**Required role:** `admin`, `sales_manager`

**Response 200:**
```json
{
  "message": "Synced 5 leads to CRM",
  "synced": 5
}
```

### `POST /api/notifications/send`

Send Slack notification for recent qualified leads.

**Required role:** `admin`, `sales_manager`

**Response 200:**
```json
{ "message": "Notifications sent" }
```

### `POST /api/pipeline/run`

Run the full signal → score → CRM pipeline manually.

**Required role:** `admin`

**Response 200:**
```json
{ "message": "Pipeline completed" }
```

---

## Error Responses

| Status | Body |
|--------|------|
| 401 | `{ "error": "Unauthorized" }` |
| 403 | `{ "error": "Forbidden" }` |
| 404 | `{ "error": "Company not found" }` |
| 500 | `{ "error": "Internal server error" }` |

---

## Frontend API Client

Located at `frontend/src/lib/api.ts`. Uses:

- `NEXT_PUBLIC_API_URL` — backend base URL
- `NEXT_PUBLIC_API_KEY` — API key header

Example:
```typescript
import { api } from '@/lib/api';

const summary = await api.getDashboardSummary();
const companies = await api.getCompanies({ min_score: '75' });
```
