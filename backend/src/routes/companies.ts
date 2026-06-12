import { Router, Request, Response } from 'express';
import { query } from '../db/pool';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const {
    city, industry, signal_type, funding_stage,
    min_score, max_score, recency_days,
    page = '1', limit = '20',
    sort = 'overall_score', order = 'desc',
  } = req.query;

  const conditions: string[] = ['c.is_active = true'];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (city) {
    conditions.push(`c.city ILIKE $${paramIdx++}`);
    params.push(`%${city}%`);
  }
  if (industry) {
    conditions.push(`c.industry ILIKE $${paramIdx++}`);
    params.push(`%${industry}%`);
  }
  if (funding_stage) {
    conditions.push(`c.funding_stage ILIKE $${paramIdx++}`);
    params.push(`%${funding_stage}%`);
  }
  if (min_score) {
    conditions.push(`s.overall_score >= $${paramIdx++}`);
    params.push(parseInt(min_score as string, 10));
  }
  if (max_score) {
    conditions.push(`s.overall_score <= $${paramIdx++}`);
    params.push(parseInt(max_score as string, 10));
  }
  if (recency_days) {
    conditions.push(`EXISTS (
      SELECT 1 FROM signals sig WHERE sig.company_id = c.id
      AND sig.signal_date > NOW() - ($${paramIdx++} || ' days')::INTERVAL
    )`);
    params.push(recency_days);
  }
  if (signal_type) {
    conditions.push(`EXISTS (
      SELECT 1 FROM signals sig WHERE sig.company_id = c.id
      AND sig.signal_type = $${paramIdx++} AND sig.is_active = true
    )`);
    params.push(signal_type);
  }

  const allowedSorts = ['overall_score', 'name', 'hiring_count', 'created_at'];
  const sortCol = allowedSorts.includes(sort as string) ? sort : 'overall_score';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(100, parseInt(limit as string, 10));
  const offset = (pageNum - 1) * limitNum;

  const whereClause = conditions.join(' AND ');

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(DISTINCT c.id) FROM companies c
     LEFT JOIN scores s ON s.company_id = c.id
     WHERE ${whereClause}`,
    params
  );

  params.push(limitNum, offset);
  const { rows } = await query(
    `SELECT c.*,
            s.fit_score, s.intent_score, s.timing_score, s.overall_score,
            o.recommended_product,
            cr.status as crm_status, cr.assigned_salesperson,
            ARRAY_AGG(DISTINCT sig.signal_type) FILTER (WHERE sig.id IS NOT NULL) as signal_types
     FROM companies c
     LEFT JOIN scores s ON s.company_id = c.id
     LEFT JOIN outreach_recommendations o ON o.company_id = c.id
     LEFT JOIN crm_records cr ON cr.company_id = c.id
     LEFT JOIN signals sig ON sig.company_id = c.id AND sig.is_active = true
     WHERE ${whereClause}
     GROUP BY c.id, s.fit_score, s.intent_score, s.timing_score, s.overall_score,
              o.recommended_product, cr.status, cr.assigned_salesperson
     ORDER BY ${sortCol === 'overall_score' ? 's.overall_score' : `c.${sortCol}`} ${sortOrder} NULLS LAST
     LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
    params
  );

  res.json({
    data: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: parseInt(countResult.rows[0].count, 10),
      total_pages: Math.ceil(parseInt(countResult.rows[0].count, 10) / limitNum),
    },
  });
});

router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const { rows: companies } = await query(
    `SELECT * FROM companies WHERE id = $1`, [id]
  );
  if (companies.length === 0) {
    res.status(404).json({ error: 'Company not found' });
    return;
  }

  const [signals, contacts, scores, crm, outreach] = await Promise.all([
    query(`SELECT * FROM signals WHERE company_id = $1 ORDER BY signal_date DESC`, [id]),
    query(`SELECT * FROM contacts WHERE company_id = $1`, [id]),
    query(`SELECT * FROM scores WHERE company_id = $1`, [id]),
    query(`SELECT * FROM crm_records WHERE company_id = $1`, [id]),
    query(`SELECT * FROM outreach_recommendations WHERE company_id = $1 ORDER BY created_at DESC LIMIT 1`, [id]),
  ]);

  res.json({
    ...companies[0],
    signals: signals.rows,
    contacts: contacts.rows,
    score: scores.rows[0] ?? null,
    crm_record: crm.rows[0] ?? null,
    outreach: outreach.rows[0] ?? null,
  });
});

router.post('/:id/contacts', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, title, email, linkedin_url, seniority, decision_maker } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Contact name is required' });
    return;
  }

  const { rows: companies } = await query(
    `SELECT id FROM companies WHERE id = $1`, [id]
  );
  if (companies.length === 0) {
    res.status(404).json({ error: 'Company not found' });
    return;
  }

  const { rows } = await query(
    `INSERT INTO contacts (company_id, name, title, seniority, decision_maker, email, linkedin_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [id, name.trim(), title ?? null, seniority ?? null, !!decision_maker, email ?? null, linkedin_url ?? null]
  );

  res.status(201).json(rows[0]);
});

export default router;
