import OpenAI from 'openai';
import { query } from '../../db/pool';
import { config } from '../../config';
import { recommendProduct } from '../scoring/scoring-engine';
import { logger } from '../../utils/logger';
import type { OutreachMessageJson } from '@away/shared';

const openai = config.openai.apiKey
  ? new OpenAI({ apiKey: config.openai.apiKey })
  : null;

export async function generateOutreachForQualified(): Promise<number> {
  const { rows: qualified } = await query<{
    id: string;
    name: string;
    industry: string | null;
    city: string | null;
    employee_count: number | null;
    overall_score: number;
    score_reasoning: string | null;
  }>(
    `SELECT c.id, c.name, c.industry, c.city, c.employee_count, s.overall_score, s.score_reasoning
     FROM companies c
     JOIN scores s ON s.company_id = c.id
     LEFT JOIN outreach_recommendations o ON o.company_id = c.id
     WHERE s.overall_score >= $1 AND o.id IS NULL AND c.is_active = true`,
    [config.qualifiedScoreThreshold]
  );

  let generated = 0;

  for (const company of qualified) {
    try {
      await generateOutreach(company);
      generated++;
    } catch (error) {
      logger.error('Outreach generation failed', {
        companyId: company.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return generated;
}

async function generateOutreach(company: {
  id: string;
  name: string;
  industry: string | null;
  city: string | null;
  employee_count: number | null;
  overall_score: number;
  score_reasoning: string | null;
}): Promise<void> {
  const { rows: signals } = await query<{ signal_text: string; signal_type: string }>(
    `SELECT signal_text, signal_type FROM signals
     WHERE company_id = $1 AND is_active = true ORDER BY signal_date DESC LIMIT 5`,
    [company.id]
  );

  const product = recommendProduct(company.employee_count);
  let outreach: OutreachMessageJson;

  if (openai) {
    outreach = await generateWithGPT(company, signals, product);
  } else {
    outreach = generateFallback(company, signals, product);
  }

  const requiresReview = outreach.confidence < 0.7;

  await query(
    `INSERT INTO outreach_recommendations
     (company_id, recommended_product, outreach_angle, generated_message, subject, personalization, pain_point, cta, ai_confidence, requires_human_review)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      company.id,
      outreach.recommended_product,
      outreach.pain_point,
      JSON.stringify(outreach),
      outreach.subject,
      outreach.personalization,
      outreach.pain_point,
      outreach.cta,
      outreach.confidence,
      requiresReview,
    ]
  );
}

async function generateWithGPT(
  company: { name: string; industry: string | null; city: string | null },
  signals: Array<{ signal_text: string; signal_type: string }>,
  product: string
): Promise<OutreachMessageJson> {
  const prompt = `You are a sales intelligence assistant for away.center, a premium coworking and workspace provider in India (Bangalore, Vizag, Kolkata).

Generate outreach for this company:
- Company: ${company.name}
- Industry: ${company.industry ?? 'Unknown'}
- City: ${company.city ?? 'Unknown'}
- Recommended Product: ${product}
- Recent Signals: ${signals.map((s) => `[${s.signal_type}] ${s.signal_text}`).join('; ')}

Return JSON only with these fields:
{
  "subject": "email subject line",
  "personalization": "1-2 sentence personalization referencing their signals",
  "pain_point": "identified workspace pain point",
  "recommended_product": "${product.split(',')[0].trim()}",
  "cta": "call to action",
  "confidence": 0.0-1.0
}`;

  const response = await openai!.chat.completions.create({
    model: config.openai.model,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content) as OutreachMessageJson;
  parsed.confidence = parsed.confidence ?? 0.75;
  return parsed;
}

function generateFallback(
  company: { name: string; city: string | null },
  signals: Array<{ signal_text: string }>,
  product: string
): OutreachMessageJson {
  const primaryProduct = product.split(',')[0].trim();
  const signalRef = signals[0]?.signal_text ?? 'your recent growth';

  return {
    subject: `${company.name} — workspace solution for your ${company.city ?? 'India'} team`,
    personalization: `I noticed ${signalRef} and thought away.center could support ${company.name}'s workspace needs.`,
    pain_point: 'Growing teams need flexible workspace without long-term lease commitments',
    recommended_product: primaryProduct as OutreachMessageJson['recommended_product'],
    cta: 'Would you be open to a 15-minute call to explore workspace options?',
    confidence: 0.65,
  };
}
