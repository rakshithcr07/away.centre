# Away Intelligence

Marketing intelligence and workspace intent platform for away.center.

Away Intelligence helps sales teams identify companies that are likely to need coworking seats, private offices, managed offices, meeting rooms, event spaces, or India team setup support before they actively start searching.

## What It Does

- Collects workspace buying signals from hiring, funding, social, news, and expansion sources.
- Normalizes and enriches company records over time.
- Scores companies by fit, intent, and timing.
- Recommends the most relevant workspace product.
- Generates outreach context for sales teams.
- Pushes qualified leads into Zoho Bigin CRM.
- Sends sales notifications through Slack and email.

## Tech Stack

- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Data: PostgreSQL, Redis, BullMQ
- Shared package: TypeScript types shared between frontend and backend
- Testing: Vitest
- Integrations: OpenAI, Zoho Bigin, Slack, email, news and signal sources

## Project Structure

```text
away-intelligence/
|-- backend/          Express API, workers, scheduler, services, tests
|-- frontend/         Next.js dashboard and sales workspace UI
|-- shared/           Shared TypeScript types
|-- docs/             Product, API, architecture, workflow, and UI docs
|-- docker-compose.yml
|-- package.json      npm workspace scripts
`-- .env.example      Local environment template
```

## Prerequisites

- Node.js 20+
- npm
- Docker and Docker Compose

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
cp .env.example .env
```

The app has development defaults for local PostgreSQL, Redis, and API auth. Add real integration keys only when you want to use OpenAI, Zoho, Slack, email, or external signal providers.

3. Start local infrastructure:

```bash
docker compose up -d
```

4. Run database migration and seed data:

```bash
npm run db:migrate
npm run db:seed
```

5. Start the app:

```bash
npm run dev
```

This starts the backend API and frontend dashboard together.

## Local URLs

- Frontend: http://localhost:3000
- API health check: http://localhost:4000/health
- API base URL: http://localhost:4000

All `/api/*` routes require the `x-api-key` header. The default local key is:

```text
dev-api-key
```

## Useful Scripts

```bash
npm run dev          # Run backend and frontend in development mode
npm run build        # Build shared, backend, and frontend packages
npm test             # Run backend tests
npm run db:migrate   # Run PostgreSQL migrations
npm run db:seed      # Seed local development data
npm run worker       # Start BullMQ workers
npm run scheduler    # Start scheduled pipeline runner
```

Workspace-specific scripts can also be run directly:

```bash
npm run dev -w backend
npm run dev -w frontend
npm run build -w shared
```

## Core API Routes

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/health` | API health check |
| GET | `/api/dashboard/summary` | Dashboard KPIs and signal summary |
| GET | `/api/companies` | Paginated scored company list |
| GET | `/api/companies/:id` | Company detail with related data |
| GET | `/api/signals` | Signal explorer |
| GET | `/api/sales-queue` | Prioritized sales queue |
| POST | `/api/scores/recalculate` | Recalculate company scores |
| POST | `/api/crm/sync` | Sync qualified leads to Zoho Bigin |
| POST | `/api/pipeline/run` | Run the pipeline manually |

See [docs/DATA_API.md](docs/DATA_API.md) for the full API reference.

## Scoring Model

Companies are scored from 0 to 100:

```text
overall_score = (fit_score * 0.40) + (intent_score * 0.40) + (timing_score * 0.20)
```

- Fit score: company size, location, and industry match
- Intent score: hiring, funding, social, and expansion signals
- Timing score: signal recency

Companies at or above the qualified score threshold, default `75`, are eligible for CRM sync.

## Environment Variables

Important variables are defined in `.env.example`.

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://away:away_dev@localhost:5432/away_intelligence` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `API_KEY` | Backend API key for `/api/*` routes | `dev-api-key` |
| `NEXT_PUBLIC_API_URL` | Frontend API URL | `http://localhost:4000` |
| `NEXT_PUBLIC_API_KEY` | Frontend API key | `dev-api-key` |
| `OPENAI_API_KEY` | Outreach generation | Optional |
| `ZOHO_CLIENT_ID` | Zoho Bigin integration | Optional |
| `ZOHO_REFRESH_TOKEN` | Zoho OAuth refresh token | Optional |
| `SLACK_WEBHOOK_URL` | Slack notifications | Optional |
| `QUALIFIED_SCORE_THRESHOLD` | Minimum score for qualified leads | `75` |
| `SIGNAL_COLLECTION_CRON` | Scheduler cadence | `0 */6 * * *` |

Do not commit `.env`. It is ignored by Git.

## Documentation

- [Product Requirements](docs/PRD.md)
- [Technical Specification](docs/SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [System Design](docs/System-design.md)
- [Application Flow](docs/APP_FLOW.md)
- [API Reference](docs/DATA_API.md)
- [Database Schema](docs/schema.md)
- [Workflow](docs/WORKFLOW.md)
- [UI Guide](docs/UI_GUIDE.md)
- [Test Cases](docs/TEST_CASES.md)

## Deployment Notes

The intended deployment targets are:

- Frontend: Vercel
- Backend: Railway or another Node.js host
- Database: Neon PostgreSQL
- Queue/cache: Redis-compatible provider

Set production environment variables in the hosting provider before deploying.


