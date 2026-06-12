# UI Guide & Sales Workflow

This guide explains the visual layout and user workflow of the **Away Intelligence** dashboard.

---

## Dashboard Layout and GTM Workflow

The diagram below shows how signals flow from ingestion, through lead scoring and AI outreach creation, to syncing with the Zoho CRM.

![Away Intelligence Dashboard and Sales Workflow](C:/Users/crrak/.gemini/antigravity-ide/brain/5367def4-f74c-43dc-8d98-3d2d28c2b4c2/ui_workflow_mockup_1781249324421.png)

---

## Key Views in the Application

### 1. Dashboard Overview (`/`)
* **KPI Metrics:** Displays active counts for **High Intent Leads** (score ≥ 75), **New Signals** (last 7 days), **CRM Synced Leads**, and overall **Conversion Rates**.
* **Visual Feeds:** Lists top cities by signal density and shows signal counts categorized by type (hiring, funding, expansion, social).
* **Top Leads Table:** Quick preview list of the highest scoring companies.

### 2. Leads Explorer (`/leads`)
* **Lead List Table:** Displays companies, matching cities, industries, employee sizes, and overall scores.
* **Filter Sidebar:** Filter companies dynamically by supported region, industry, minimum/maximum score, or specific signal types.

### 3. Sales Queue Board (`/sales-queue`)
* Organizes leads into distinct action lanes for sales representatives:
  * **Immediate Outreach:** Qualified leads (score ≥ 75) that have clean, high-confidence signals. Reps should contact these within 24 hours.
  * **Manual Review:** Leads where the AI outreach message confidence score is low (< 70%). Reps must review and adjust the text copy before sending.
  * **Nurture:** Medium fit/intent leads (scores 50–74) to add to standard marketing lists.

### 4. Company Detail Page (`/companies/[id]`)
* **Timeline of Signals:** Chronological listing of all detected news articles or career page crawls for that specific company.
* **AI Outreach Copy:** Generates a suggested subject line, email personalization line referencing their recent news, pain point statement, recommended coworking seat package, and call to action.
* **CRM Sync Control:** Features a button to manually trigger a Zoho Bigin CRM upload.
