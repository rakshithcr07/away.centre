import { Router, Request, Response } from 'express';
import { query } from '../db/pool';
import { config } from '../config';
import type { DashboardSummary } from '@away/shared';

const router = Router();

router.get('/summary', async (_req: Request, res: Response) => {
  const threshold = config.qualifiedScoreThreshold;

  const [highIntent, newSignals, qualified, crmSent, conversions] = await Promise.all([
    query<{ count: string }>(
      `SELECT COUNT(*) FROM scores WHERE overall_score >= $1`, [threshold]
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) FROM signals WHERE created_at > NOW() - INTERVAL '7 days'`
    ),
    query<{ count: string }>(
      `SELECT COUNT(DISTINCT company_id) FROM scores WHERE overall_score >= $1`, [threshold]
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) FROM crm_records WHERE status = 'synced'`
    ),
    query<{ total: string; won: string }>(
      `SELECT COUNT(*) as total,
              COUNT(*) FILTER (WHERE conversion_type = 'closed_won') as won
       FROM conversions`
    ),
  ]);

  const signalsByType = await query<{ signal_type: string; count: string }>(
    `SELECT signal_type, COUNT(*) as count FROM signals
     WHERE is_active = true GROUP BY signal_type`
  );

  const topCities = await query<{ city: string; count: string }>(
    `SELECT city, COUNT(*) as count FROM companies
     WHERE city IS NOT NULL AND is_active = true
     GROUP BY city ORDER BY count DESC LIMIT 5`
  );

  const totalConversions = parseInt(conversions.rows[0]?.total ?? '0', 10);
  const wonConversions = parseInt(conversions.rows[0]?.won ?? '0', 10);

  const summary: DashboardSummary = {
    high_intent_leads: parseInt(highIntent.rows[0].count, 10),
    new_signals: parseInt(newSignals.rows[0].count, 10),
    qualified_accounts: parseInt(qualified.rows[0].count, 10),
    leads_sent_to_crm: parseInt(crmSent.rows[0].count, 10),
    conversion_rate: totalConversions > 0 ? Math.round((wonConversions / totalConversions) * 100) : 0,
    signals_by_type: {
      HIRING_SIGNAL: 0,
      FUNDING_SIGNAL: 0,
      SOCIAL_SIGNAL: 0,
      EXPANSION_SIGNAL: 0,
    },
    top_cities: topCities.rows.map((r) => ({
      city: r.city,
      count: parseInt(r.count, 10),
    })),
  };

  for (const row of signalsByType.rows) {
    const type = row.signal_type as keyof typeof summary.signals_by_type;
    if (type in summary.signals_by_type) {
      summary.signals_by_type[type] = parseInt(row.count, 10);
    }
  }

  res.json(summary);
});

export default router;
