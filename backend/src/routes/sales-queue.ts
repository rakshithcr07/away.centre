import { Router, Request, Response } from 'express';
import { query } from '../db/pool';
import { categorizeSalesQueue } from '../services/scoring/scoring-engine';
import type { SalesQueueCategory } from '@away/shared';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { category } = req.query;

  const { rows } = await query<{
    company_id: string;
    company_name: string;
    overall_score: number;
    recommended_product: string | null;
    signal_count: string;
    latest_signal_date: string | null;
    requires_review: boolean;
  }>(
    `SELECT c.id as company_id, c.name as company_name,
            s.overall_score, o.recommended_product,
            COUNT(sig.id) as signal_count,
            MAX(sig.signal_date) as latest_signal_date,
            COALESCE(o.requires_human_review, false) as requires_review
     FROM companies c
     JOIN scores s ON s.company_id = c.id
     LEFT JOIN outreach_recommendations o ON o.company_id = c.id
     LEFT JOIN signals sig ON sig.company_id = c.id AND sig.is_active = true
     WHERE c.is_active = true
     GROUP BY c.id, c.name, s.overall_score, o.recommended_product, o.requires_human_review
     ORDER BY s.overall_score DESC`
  );

  const queue = rows.map((row) => {
    const cat = categorizeSalesQueue(
      Number(row.overall_score),
      row.requires_review
    ) as SalesQueueCategory;

    const nextAction =
      cat === 'immediate_outreach' ? 'Contact within 24h' :
      cat === 'nurture' ? 'Add to nurture sequence' :
      cat === 'manual_review' ? 'Review AI outreach before sending' :
      'No action needed';

    return {
      company_id: row.company_id,
      company_name: row.company_name,
      overall_score: Number(row.overall_score),
      category: cat,
      recommended_product: row.recommended_product,
      next_action: nextAction,
      signal_count: parseInt(row.signal_count, 10),
      latest_signal_date: row.latest_signal_date,
    };
  });

  const filtered = category
    ? queue.filter((item) => item.category === category)
    : queue;

  const grouped = {
    immediate_outreach: queue.filter((q) => q.category === 'immediate_outreach'),
    nurture: queue.filter((q) => q.category === 'nurture'),
    manual_review: queue.filter((q) => q.category === 'manual_review'),
    ignored: queue.filter((q) => q.category === 'ignored'),
  };

  res.json({ data: filtered, grouped });
});

export default router;
