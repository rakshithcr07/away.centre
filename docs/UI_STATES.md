# Away Intelligence — UI States & Screenshots

This document describes the key UI states in the Away Intelligence dashboard.

## Dashboard (`/`)

**State: Populated**
- 5 KPI cards: High Intent Leads, New Signals, Qualified Accounts, Leads Sent to CRM, Conversion Rate
- Signal distribution bar chart by type (Hiring, Funding, Social, Expansion)
- Top cities list
- Top 10 scored leads table

**State: Empty**
- KPI cards show `0`
- "No city data yet" in Top Cities
- "No companies found. Run the pipeline to collect signals." in leads table

**State: API Unavailable**
- Graceful fallback with zero values
- Dashboard still renders with empty state messaging

## Leads Table (`/leads`)

**Columns:** Company, Industry, City, Employees, Hiring, Signals, Intent, Fit, Timing, Overall, Product, CRM Status

**Filters:** City, Industry, Signal Type, Min Score

**Score Colors:**
- Green (≥75): High intent — immediate outreach
- Amber (50-74): Medium — nurture
- Red (<50): Low — ignored

## Company Details (`/companies/{id}`)

**Sections:**
1. Company Overview — website, employees, hiring count, funding, CRM status
2. Score Breakdown — overall, intent, fit, timing with reasoning
3. Outreach Recommendation — subject, product, pain point, message, CTA, AI confidence
4. Signal Timeline — chronological signal history
5. Contacts — decision makers with email links

**State: Requires Review**
- Amber badge on outreach section when AI confidence < 70%

## Signal Explorer (`/signals`)

**Filters:** Signal Type, Source, City, Recency (days)

Each signal card shows:
- Type badge (color-coded)
- Source badge
- Date
- Full signal text
- Company link with city/industry
- Confidence percentage

## Sales Queue (`/sales-queue`)

Four kanban-style columns:

| Column | Criteria | Next Action |
|--------|----------|-------------|
| Immediate Outreach | Score ≥ 75, no review flag | Contact within 24h |
| Nurture | Score 50-74 | Add to nurture sequence |
| Manual Review | AI confidence < 70% | Review outreach before sending |
| Ignored | Score < 50 | No action needed |

## Visual Design

- **Theme:** Dark mode with green accent (away.center brand)
- **Background:** `#0f1419` (surface)
- **Cards:** `#1a1f2e` with `#2a3142` borders
- **Accent:** `#22c55e` (away green)
- **Typography:** Inter font family
- **Layout:** Fixed 256px sidebar + fluid main content

## Running Screenshots

After starting the app with seed data:

```bash
docker compose up -d
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Visit `http://localhost:3000` to see all populated states.
