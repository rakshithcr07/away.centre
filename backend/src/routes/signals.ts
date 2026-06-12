import { Router, Request, Response } from 'express';
import { query } from '../db/pool';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const {
    signal_type, signal_source, city, industry,
    min_confidence, recency_days, sort,
    page = '1', limit = '50',
  } = req.query;

  const conditions: string[] = ['sig.is_active = true'];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (signal_type) {
    conditions.push(`sig.signal_type = $${paramIdx++}`);
    params.push(signal_type);
  }
  if (signal_source) {
    conditions.push(`sig.signal_source = $${paramIdx++}`);
    params.push(signal_source);
  }
  if (city) {
    conditions.push(`c.city ILIKE $${paramIdx++}`);
    params.push(`%${city}%`);
  }
  if (industry) {
    conditions.push(`c.industry ILIKE $${paramIdx++}`);
    params.push(`%${industry}%`);
  }
  if (min_confidence) {
    conditions.push(`sig.confidence_score >= $${paramIdx++}`);
    params.push(parseFloat(min_confidence as string));
  }
  if (recency_days) {
    conditions.push(`sig.signal_date > NOW() - ($${paramIdx++} || ' days')::INTERVAL`);
    params.push(recency_days);
  }

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(100, parseInt(limit as string, 10));
  const offset = (pageNum - 1) * limitNum;

  const whereClause = conditions.join(' AND ');
  params.push(limitNum, offset);

  // sort=newest  → ORDER BY when signal was discovered (created_at)
  // default      → ORDER BY signal event date + confidence score
  const orderBy = sort === 'newest'
    ? 'sig.created_at DESC'
    : 'sig.signal_date DESC, sig.confidence_score DESC';

  const { rows } = await query(
    `SELECT sig.*, c.name as company_name, c.city, c.industry, c.website
     FROM signals sig
     JOIN companies c ON c.id = sig.company_id
     WHERE ${whereClause}
     ORDER BY ${orderBy}
     LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
    params
  );

  res.json({ data: rows });
});

export default router;
