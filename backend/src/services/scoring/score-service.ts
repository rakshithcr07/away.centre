import { query } from '../../db/pool';
import { calculateScores } from './scoring-engine';
import { isValidWebsite } from '../../utils/company-normalizer';
import { logger } from '../../utils/logger';
import type { SignalType } from '@away/shared';

export async function recalculateAllScores(): Promise<number> {
  const { rows: companies } = await query<{
    id: string;
    employee_count: number | null;
    city: string | null;
    country: string | null;
    industry: string | null;
    website: string | null;
    is_active: boolean;
    is_remote_only: boolean;
    is_staffing_agency: boolean;
  }>(`SELECT id, employee_count, city, country, industry, website,
      is_active, is_remote_only, is_staffing_agency
      FROM companies WHERE is_active = true`);

  let updated = 0;

  for (const company of companies) {
    const { rows: signals } = await query<{
      signal_type: SignalType;
      signal_text: string;
      signal_date: string;
      confidence_score: number;
    }>(
      `SELECT signal_type, signal_text, signal_date, confidence_score
       FROM signals WHERE company_id = $1 AND is_active = true AND is_duplicate = false`,
      [company.id]
    );

    const { rows: crmRows } = await query<{ status: string }>(
      `SELECT status FROM crm_records WHERE company_id = $1`,
      [company.id]
    );

    const result = calculateScores({
      employeeCount: company.employee_count,
      city: company.city,
      country: company.country,
      industry: company.industry,
      signals: signals.map((s) => ({
        signal_type: s.signal_type,
        signal_text: s.signal_text,
        signal_date: s.signal_date,
        confidence_score: Number(s.confidence_score),
      })),
      isRemoteOnly: company.is_remote_only,
      isStaffingAgency: company.is_staffing_agency,
      isActive: company.is_active,
      hasValidWebsite: isValidWebsite(company.website),
      crmStatus: crmRows[0]?.status ?? null,
    });

    await query(
      `INSERT INTO scores (company_id, fit_score, intent_score, timing_score, overall_score, score_reasoning, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (company_id) DO UPDATE SET
         fit_score = EXCLUDED.fit_score,
         intent_score = EXCLUDED.intent_score,
         timing_score = EXCLUDED.timing_score,
         overall_score = EXCLUDED.overall_score,
         score_reasoning = EXCLUDED.score_reasoning,
         updated_at = NOW()`,
      [
        company.id,
        result.fit_score,
        result.intent_score,
        result.timing_score,
        result.overall_score,
        result.score_reasoning,
      ]
    );

    updated++;
  }

  logger.info(`Recalculated scores for ${updated} companies`);
  return updated;
}

export async function recalculateCompanyScore(companyId: string): Promise<void> {
  const { rows } = await query(`SELECT id FROM companies WHERE id = $1`, [companyId]);
  if (rows.length === 0) throw new Error('Company not found');

  await recalculateAllScores();
}
