# AI Guidelines

Guidelines for AI usage in Away Intelligence — outreach generation, embeddings, and future features.

---

## 1. AI Use Cases

| Use Case | Model | Status |
|----------|-------|--------|
| Outreach message generation | OpenAI GPT-4o | ✅ MVP |
| Outreach confidence scoring | GPT self-reported + rules | ✅ MVP |
| Human review flagging | Rule: confidence < 0.70 | ✅ MVP |
| Signal embedding (semantic search) | OpenAI embeddings | 🔜 Phase 3 |
| Company enrichment | External APIs (not LLM) | 🔜 Phase 2 |

---

## 2. Outreach Generation

### 2.1 When AI Runs

AI outreach is generated only when:

1. Company `overall_score >= 75` (qualified threshold)
2. No existing `outreach_recommendations` record for the company
3. Pipeline step 5 executes after scoring

### 2.2 Prompt Structure

Located in: `backend/src/services/outreach/outreach-service.ts`

```
System context: away.center sales intelligence assistant
Input:
  - Company name, industry, city
  - Recommended product (from scoring engine, not GPT)
  - Recent signals (last 5, with type labels)

Output format: JSON only
  {
    "subject": "...",
    "personalization": "...",
    "pain_point": "...",
    "recommended_product": "...",
    "cta": "...",
    "confidence": 0.0-1.0
  }
```

### 2.3 Prompt Rules

**Always include in prompt:**
- away.center brand context (premium coworking in India)
- Supported cities: Bangalore, Vizag, Kolkata
- Reference actual signals (no invented facts)
- JSON-only response format

**Never ask GPT to:**
- Invent funding amounts or employee counts
- Claim away.center has met the company before
- Generate aggressive or pushy language
- Send emails directly (generation only)

### 2.4 Fallback (No API Key)

When `OPENAI_API_KEY` is not set:

```typescript
{
  subject: "{company} — workspace solution for {city} team",
  personalization: "I noticed {signal}...",
  pain_point: "Growing teams need flexible workspace...",
  confidence: 0.65  // always below review threshold
}
```

Fallback always triggers `requires_human_review = true` (confidence 0.65 < 0.70).

---

## 3. Confidence & Human Review

### 3.1 Confidence Sources

| Source | Confidence | Review Required |
|--------|------------|-----------------|
| GPT response | Model self-reported (0-1) | If < 0.70 |
| Template fallback | Fixed 0.65 | Always |
| Manual override (future) | Set by sales rep | No |

### 3.2 Review Workflow

```
AI generates outreach
    │
    ├─ confidence >= 0.70 → sales queue: immediate_outreach
    │
    └─ confidence < 0.70  → sales queue: manual_review
                              └─ rep reviews before sending
```

### 3.3 Hallucination Prevention

1. **Signal grounding** — prompt includes actual signal text
2. **Product lock** — recommended product comes from scoring engine, injected into prompt
3. **Confidence flag** — low confidence forces human review
4. **No auto-send** — MVP only generates suggestions, never sends emails
5. **Audit trail** — full JSON stored in `generated_message` column

---

## 4. Model Configuration

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
```

| Setting | Value | Rationale |
|---------|-------|-----------|
| Model | gpt-4o | Best JSON adherence + quality |
| Temperature | 0.7 | Balance creativity and consistency |
| Response format | `json_object` | Structured output guarantee |

To change model, update `OPENAI_MODEL` in `.env`. Test outreach quality after any model change.

---

## 5. Data Sent to OpenAI

**Sent:**
- Company name, industry, city
- Signal text and types (last 5)
- Recommended product name

**Not sent:**
- Contact emails or personal data
- Full company database records
- CRM status or internal scores
- API keys or system configuration

---

## 6. Signal Embeddings (Phase 3)

### Planned Usage

```sql
-- signal_embeddings table (schema ready)
signal_id → embedding vector(1536)
```

**Use cases:**
- Find semantically similar signals across companies
- Detect duplicate signals with different phrasing
- Power "similar companies" recommendations

### Embedding Guidelines

- Embed `signal_text` only (not metadata)
- Use `text-embedding-3-small` (1536 dimensions)
- Batch embed during pipeline step 2
- Store in pgvector with IVFFlat index

---

## 7. What NOT to Use AI For

| Task | Use Instead |
|------|-------------|
| Scoring calculation | Deterministic scoring engine |
| Company deduplication | Hash + fuzzy name matching |
| CRM sync decisions | Rule: score >= 75 |
| Exclusion decisions | Rule-based checks |
| Employee count | Signal data / enrichment API |
| Funding dates | Signal date from source |

**Scoring must remain deterministic and auditable.** AI is for language generation only in MVP.

---

## 8. Monitoring AI Quality

Track these metrics post-launch:

| Metric | Target |
|--------|--------|
| Outreach approval rate (manual review) | > 80% approved |
| Rep edit distance (edited vs generated) | < 30% change |
| Response rate on AI outreach | > baseline manual |
| Hallucination reports | 0 per month |

Log all GPT requests with:
- Company ID
- Model used
- Token count (from API response)
- Confidence score
- Whether human review was required

---

## 9. Cost Management

| Operation | Est. Cost | Frequency |
|-----------|-----------|-----------|
| Outreach generation | ~$0.01/company | Per qualified company, once |
| Embedding (future) | ~$0.0001/signal | Per new signal |

**Cost controls:**
- Only generate outreach for score >= 75
- Skip if outreach already exists
- Cache embeddings (never re-embed same signal)
- Set OpenAI usage limits in dashboard

---

## 10. Updating AI Behavior

To change outreach tone or structure:

1. Edit prompt in `outreach-service.ts`
2. Run pipeline on test companies
3. Review output in `outreach_recommendations` table
4. Check `requires_human_review` rate
5. Update [TEST_CASES.md](./TEST_CASES.md) if adding validation
6. Document changes in this file

**Never deploy prompt changes without reviewing 5+ sample outputs.**
