import { pool, query } from './pool';
import { signalCollector } from '../services/signals/signal-collector';
import { recalculateAllScores } from '../services/scoring/score-service';
import { generateOutreachForQualified } from '../services/outreach/outreach-service';
import { syncQualifiedLeadsToCRM } from '../services/crm/zoho-bigin';
import { logger } from '../utils/logger';

async function seed() {
  logger.info('Seeding database...');

  // Admin user
  await query(
    `INSERT INTO users (email, name, role, password_hash)
     VALUES ('admin@away.center', 'Admin User', 'admin', 'changeme')
     ON CONFLICT (email) DO NOTHING`
  );

  // Sales team
  const salesTeam = [
    ['priya@away.center', 'Priya Sharma', 'sales_manager'],
    ['rahul@away.center', 'Rahul Verma', 'sales_rep'],
    ['ananya@away.center', 'Ananya Das', 'sales_rep'],
  ];

  for (const [email, name, role] of salesTeam) {
    await query(
      `INSERT INTO users (email, name, role) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING`,
      [email, name, role]
    );
  }

  // Run signal collection pipeline to populate data
  logger.info('Collecting signals...');
  await signalCollector.collectAll();
  await signalCollector.processRawSignals();

  logger.info('Calculating scores...');
  await recalculateAllScores();

  logger.info('Generating outreach...');
  await generateOutreachForQualified();

  logger.info('Syncing CRM...');
  await syncQualifiedLeadsToCRM();

  // Sample contacts
  const { rows: companies } = await query<{ id: string; name: string }>(
    `SELECT id, name FROM companies LIMIT 5`
  );

  const contacts = [
    { name: 'Arjun Mehta', title: 'CEO', seniority: 'C-Level', decision_maker: true },
    { name: 'Sneha Reddy', title: 'Head of HR', seniority: 'VP', decision_maker: true },
    { name: 'Vikram Singh', title: 'Office Manager', seniority: 'Manager', decision_maker: false },
  ];

  for (const company of companies) {
    for (const contact of contacts) {
      await query(
        `INSERT INTO contacts (company_id, name, title, seniority, decision_maker, email)
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
        [
          company.id,
          contact.name,
          contact.title,
          contact.seniority,
          contact.decision_maker,
          `${contact.name.toLowerCase().replace(' ', '.')}@${company.name.toLowerCase().replace(/\s/g, '')}.com`,
        ]
      );
    }
  }

  // Sample conversion
  if (companies.length > 0) {
    await query(
      `INSERT INTO conversions (company_id, conversion_type, revenue, notes)
       VALUES ($1, 'closed_won', 250000, 'Managed office deal - Bangalore')`,
      [companies[0].id]
    );
  }

  const { rows: stats } = await query<{ companies: string; signals: string; qualified: string }>(
    `SELECT
       (SELECT COUNT(*) FROM companies) as companies,
       (SELECT COUNT(*) FROM signals) as signals,
       (SELECT COUNT(*) FROM scores WHERE overall_score >= 75) as qualified`
  );

  logger.info('Seed complete', stats[0]);
  await pool.end();
}

seed().catch((err) => {
  logger.error('Seed failed', { error: err.message });
  process.exit(1);
});
