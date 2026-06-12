import { QueryResult, QueryResultRow } from 'pg';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

// File-based DB to share state between seed and server processes
const DB_FILE = path.join(__dirname, '..', '..', '.mock_db.json');

interface MockDb {
  users: any[];
  companies: any[];
  company_aliases: any[];
  raw_signals: any[];
  signals: any[];
  contacts: any[];
  scores: any[];
  crm_records: any[];
  outreach_recommendations: any[];
  conversions: any[];
  audit_logs: any[];
  settings?: any;
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function loadDb(): MockDb {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }
  } catch (err) {
    logger.error('Failed to load mock DB file, initializing empty', { error: err });
  }
  return {
    users: [],
    companies: [],
    company_aliases: [],
    raw_signals: [],
    signals: [],
    contacts: [],
    scores: [],
    crm_records: [],
    outreach_recommendations: [],
    conversions: [],
    audit_logs: [],
  };
}

function saveDb(db: MockDb) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    logger.error('Failed to write mock DB file', { error: err });
  }
}

// Ensure the db starts initialized
if (!fs.existsSync(DB_FILE)) {
  saveDb({
    users: [],
    companies: [],
    company_aliases: [],
    raw_signals: [],
    signals: [],
    contacts: [],
    scores: [],
    crm_records: [],
    outreach_recommendations: [],
    conversions: [],
    audit_logs: [],
  });
}

export const pool = {
  query: async (text: string, params: any[] = []): Promise<QueryResult<any>> => {
    return query(text, params);
  },
  connect: async () => {
    return {
      query: async (text: string, params: any[] = []) => {
        return query(text, params);
      },
      release: () => {},
    };
  },
  end: async () => {
    logger.info('Mock pool closed');
  },
};

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  const sql = text.trim().replace(/\s+/g, ' ');
  const db = loadDb();
  let rows: any[] = [];

  try {
    // 1. Migrations (No-op)
    if (
      sql.startsWith('CREATE TABLE') ||
      sql.startsWith('CREATE TYPE') ||
      sql.startsWith('CREATE EXTENSION') ||
      sql.startsWith('CREATE INDEX') ||
      sql.startsWith('CREATE TRIGGER') ||
      sql.startsWith('CREATE OR REPLACE FUNCTION') ||
      sql.startsWith('DROP TABLE') ||
      sql.startsWith('--')
    ) {
      // Return empty successful query
      return { rows: [], rowCount: 0, command: 'CREATE', oid: 0, fields: [] };
    }

    // 2. Select 1
    if (sql === 'SELECT 1') {
      return { rows: [{ '?column?': 1 }] as any, rowCount: 1, command: 'SELECT', oid: 0, fields: [] };
    }

    // 3. BEGIN / COMMIT / ROLLBACK
    if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') {
      return { rows: [], rowCount: 0, command: sql, oid: 0, fields: [] };
    }

    // Helper to extract param mapping index: "$1" -> 0
    const getParam = (sqlStr: string, regex: RegExp, paramsList: unknown[]): any => {
      const match = sqlStr.match(regex);
      if (match) {
        const idx = parseInt(match[1], 10) - 1;
        return paramsList[idx];
      }
      return null;
    };

    // 4. INSERT INTO users literal (Admin User)
    if (sql.includes('INSERT INTO users') && sql.includes("'admin@away.center'")) {
      const email = 'admin@away.center';
      if (!db.users.some((u) => u.email === email)) {
        db.users.push({
          id: uuid(),
          email,
          name: 'Admin User',
          role: 'admin',
          password_hash: 'changeme',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        saveDb(db);
      }
      return { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
    }

    // 5. INSERT INTO users parameterized (Sales Team)
    if (sql.includes('INSERT INTO users') && sql.includes('$1')) {
      const email = params[0] as string;
      if (!db.users.some((u) => u.email === email)) {
        db.users.push({
          id: uuid(),
          email,
          name: params[1] as string,
          role: params[2] as string,
          password_hash: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        saveDb(db);
      }
      return { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
    }

    // 6. INSERT INTO raw_signals
    if (sql.startsWith('INSERT INTO raw_signals')) {
      db.raw_signals.push({
        id: uuid(),
        source: params[0] as string,
        raw_payload: typeof params[1] === 'string' ? JSON.parse(params[1]) : params[1],
        processed: false,
        created_at: new Date().toISOString(),
      });
      saveDb(db);
      return { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
    }

    // 7. SELECT raw_signals
    if (sql.includes('SELECT id, raw_payload FROM raw_signals')) {
      rows = db.raw_signals.filter((r) => !r.processed).slice(0, 100);
      return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
    }

    // 8. UPDATE raw_signals processed
    if (sql.startsWith('UPDATE raw_signals SET processed = true')) {
      const id = params[0] as string;
      const raw = db.raw_signals.find((r) => r.id === id);
      if (raw) {
        raw.processed = true;
        saveDb(db);
      }
      return { rows: [], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] };
    }

    // 9. UPDATE raw_signals processing_error
    if (sql.startsWith('UPDATE raw_signals SET processing_error =')) {
      const err = params[0] as string;
      const id = params[1] as string;
      const raw = db.raw_signals.find((r) => r.id === id);
      if (raw) {
        raw.processing_error = err;
        saveDb(db);
      }
      return { rows: [], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] };
    }

    // 10. SELECT company_aliases match
    if (sql.includes('SELECT company_id FROM company_aliases WHERE normalized_alias =')) {
      const normalized = params[0] as string;
      rows = db.company_aliases.filter((a) => a.normalized_alias === normalized);
      return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
    }

    // 11. SELECT companies website ILIKE
    if (sql.includes('SELECT id FROM companies WHERE website ILIKE')) {
      const cleanWebsite = (params[0] as string).replace(/%/g, '').toLowerCase();
      rows = db.companies.filter((c) => c.website && c.website.toLowerCase().includes(cleanWebsite));
      return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
    }

    // 12. SELECT companies normalized_name
    if (sql.includes('SELECT id, name FROM companies WHERE normalized_name =')) {
      const normalized = params[0] as string;
      rows = db.companies.filter((c) => c.normalized_name === normalized);
      return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
    }

    // 13. SELECT companies is_active true limit 500 (fuzzy matches)
    if (sql.includes('SELECT id, name FROM companies WHERE is_active = true LIMIT 500')) {
      rows = db.companies.filter((c) => c.is_active).slice(0, 500);
      return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
    }

    // 14. INSERT INTO company_aliases
    if (sql.startsWith('INSERT INTO company_aliases')) {
      const company_id = params[0] as string;
      const alias_name = params[1] as string;
      const normalized_alias = params[2] as string;
      if (!db.company_aliases.some((a) => a.normalized_alias === normalized_alias)) {
        db.company_aliases.push({
          id: uuid(),
          company_id,
          alias_name,
          normalized_alias,
          created_at: new Date().toISOString(),
        });
        saveDb(db);
      }
      return { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
    }

    // 15. INSERT INTO companies RETURNING id
    if (sql.startsWith('INSERT INTO companies') && sql.includes('RETURNING id')) {
      const newId = uuid();
      db.companies.push({
        id: newId,
        name: params[0] as string,
        normalized_name: params[1] as string,
        website: params[2] as string | null,
        city: params[3] as string | null,
        industry: params[4] as string | null,
        employee_count: params[5] as number | null,
        linkedin_url: params[6] as string | null,
        country: params[7] as string || 'India',
        hiring_count: 0,
        is_active: true,
        is_remote_only: false,
        is_staffing_agency: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      saveDb(db);
      return { rows: [{ id: newId }] as any, rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
    }

    // 16. SELECT signals duplicate
    if (sql.includes('SELECT id FROM signals WHERE company_id = $1 AND content_hash = $2')) {
      const companyId = params[0] as string;
      const hash = params[1] as string;
      rows = db.signals.filter((s) => s.company_id === companyId && s.content_hash === hash);
      return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
    }

    // 17. INSERT INTO signals
    if (sql.startsWith('INSERT INTO signals')) {
      db.signals.push({
        id: uuid(),
        company_id: params[0] as string,
        signal_type: params[1] as string,
        signal_source: params[2] as string,
        signal_text: params[3] as string,
        signal_date: params[4] as string,
        confidence_score: params[5] as number,
        content_hash: params[6] as string,
        raw_payload: typeof params[7] === 'string' ? JSON.parse(params[7]) : params[7],
        is_active: true,
        is_duplicate: false,
        created_at: new Date().toISOString(),
      });
      saveDb(db);
      return { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
    }

    // 18. UPDATE companies SET (generic dynamic enrich update)
    if (sql.startsWith('UPDATE companies SET') && !sql.includes('hiring_count')) {
      const idMatch = sql.match(/id\s*=\s*\$(\d+)/i);
      if (idMatch) {
        const idParamIdx = parseInt(idMatch[1], 10) - 1;
        const companyId = params[idParamIdx] as string;
        const company = db.companies.find((c) => c.id === companyId);
        if (company) {
          const matches = sql.matchAll(/(\w+)\s*=\s*COALESCE\(companies\.\1,\s*\$(\d+)\)/g);
          for (const m of matches) {
            const fieldName = m[1];
            const paramIdx = parseInt(m[2], 10) - 1;
            const val = params[paramIdx];
            if (val !== undefined && val !== null) {
              if (company[fieldName] === undefined || company[fieldName] === null) {
                company[fieldName] = val;
              }
            }
          }
          company.updated_at = new Date().toISOString();
          saveDb(db);
        }
      }
      return { rows: [], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] };
    }

    // 18b. UPDATE companies hiring_count
    if (sql.startsWith('UPDATE companies SET hiring_count = hiring_count + 1')) {
      const companyId = params[0] as string;
      const company = db.companies.find((c) => c.id === companyId);
      if (company) {
        company.hiring_count += 1;
        company.updated_at = new Date().toISOString();
        saveDb(db);
      }
      return { rows: [], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] };
    }

    // 19. SELECT companies active
    if (sql.includes('FROM companies WHERE is_active = true')) {
      rows = db.companies.filter((c) => c.is_active);
      return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
    }

    // 20. SELECT signals for company scoring
    if (sql.includes('FROM signals WHERE company_id = $1 AND is_active = true')) {
      const companyId = params[0] as string;
      rows = db.signals.filter((s) => s.company_id === companyId && s.is_active && !s.is_duplicate);
      return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
    }

    // 21. SELECT status FROM crm_records WHERE company_id = $1
    if (sql.includes('FROM crm_records WHERE company_id = $1')) {
      const companyId = params[0] as string;
      rows = db.crm_records.filter((c) => c.company_id === companyId);
      return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
    }

    // 22. INSERT INTO scores ON CONFLICT DO UPDATE
    if (sql.startsWith('INSERT INTO scores')) {
      const company_id = params[0] as string;
      const fit_score = params[1] as number;
      const intent_score = params[2] as number;
      const timing_score = params[3] as number;
      const overall_score = params[4] as number;
      const score_reasoning = params[5] as string;

      const existingIndex = db.scores.findIndex((s) => s.company_id === company_id);
      if (existingIndex >= 0) {
        db.scores[existingIndex] = {
          ...db.scores[existingIndex],
          fit_score,
          intent_score,
          timing_score,
          overall_score,
          score_reasoning,
          updated_at: new Date().toISOString(),
        };
      } else {
        db.scores.push({
          id: uuid(),
          company_id,
          fit_score,
          intent_score,
          timing_score,
          overall_score,
          score_reasoning,
          updated_at: new Date().toISOString(),
        });
      }
      saveDb(db);
      return { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
    }

    // 23. SELECT qualified companies for outreach
    if (sql.includes('FROM companies c JOIN scores s ON s.company_id = c.id LEFT JOIN outreach_recommendations o') && sql.includes('s.overall_score >= $1')) {
      const threshold = params[0] as number;
      rows = db.companies
        .filter((c) => c.is_active)
        .map((c) => {
          const score = db.scores.find((s) => s.company_id === c.id);
          const outreach = db.outreach_recommendations.find((o) => o.company_id === c.id);
          return { c, score, outreach };
        })
        .filter(({ score, outreach }) => score && score.overall_score >= threshold && !outreach)
        .map(({ c, score }) => ({
          id: c.id,
          name: c.name,
          industry: c.industry,
          city: c.city,
          employee_count: c.employee_count,
          overall_score: score!.overall_score,
          score_reasoning: score!.score_reasoning,
        }));
      return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
    }

    // 24. SELECT signals for outreach
    if (sql.includes('SELECT signal_text, signal_type FROM signals WHERE company_id = $1 AND is_active = true ORDER BY signal_date DESC LIMIT 5')) {
      const companyId = params[0] as string;
      rows = db.signals
        .filter((s) => s.company_id === companyId && s.is_active)
        .sort((a, b) => b.signal_date.localeCompare(a.signal_date))
        .slice(0, 5)
        .map((s) => ({
          signal_text: s.signal_text,
          signal_type: s.signal_type,
        }));
      return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
    }

    // 25. INSERT INTO outreach_recommendations
    if (sql.startsWith('INSERT INTO outreach_recommendations')) {
      db.outreach_recommendations.push({
        id: uuid(),
        company_id: params[0] as string,
        recommended_product: params[1] as string,
        outreach_angle: params[2] as string,
        generated_message: params[3] as string,
        subject: params[4] as string,
        personalization: params[5] as string,
        pain_point: params[6] as string,
        cta: params[7] as string,
        ai_confidence: params[8] as number,
        requires_human_review: params[9] as boolean,
        created_at: new Date().toISOString(),
      });
      saveDb(db);
      return { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
    }

    // 26. SELECT qualified leads for CRM sync
    if (sql.includes('FROM companies c JOIN scores s') && sql.includes('LEFT JOIN crm_records cr') && sql.includes('s.overall_score >= $1')) {
      const threshold = params[0] as number;
      rows = db.companies
        .filter((c) => c.is_active)
        .map((c) => {
          const score = db.scores.find((s) => s.company_id === c.id);
          const crm = db.crm_records.find((cr) => cr.company_id === c.id);
          return { c, score, crm };
        })
        .filter(({ score, crm }) => {
          if (!score || score.overall_score < threshold) return false;
          if (!crm) return true;
          return (crm.status === 'pending' || crm.status === 'failed') && crm.retry_count < 5;
        })
        .map(({ c, score, crm }) => ({
          company_id: c.id,
          name: c.name,
          website: c.website,
          city: c.city,
          industry: c.industry,
          employee_count: c.employee_count,
          overall_score: score!.overall_score,
          crm_id: crm?.id || null,
          crm_status: crm?.status || null,
          retry_count: crm?.retry_count || 0,
        }));
      return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
    }

    // 27. INSERT INTO crm_records
    if (sql.startsWith('INSERT INTO crm_records') && sql.includes('ON CONFLICT (company_id)')) {
      const company_id = params[0] as string;
      const zoho_lead_id = params[1] as string;
      const status = params[2] as string;

      const existingIndex = db.crm_records.findIndex((c) => c.company_id === company_id);
      if (existingIndex >= 0) {
        db.crm_records[existingIndex] = {
          ...db.crm_records[existingIndex],
          zoho_lead_id,
          status,
          last_updated: new Date().toISOString(),
          retry_count: 0,
          last_error: null,
        };
      } else {
        db.crm_records.push({
          id: uuid(),
          company_id,
          zoho_lead_id,
          status,
          last_updated: new Date().toISOString(),
          retry_count: 0,
          last_error: null,
        });
      }
      saveDb(db);
      return { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
    }

    // 28. SELECT companies limit 5
    if (sql === 'SELECT id, name FROM companies LIMIT 5') {
      rows = db.companies.slice(0, 5).map((c) => ({ id: c.id, name: c.name }));
      return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
    }

    // 29. INSERT INTO contacts (seed: 6 params) OR manual entry (7 params with linkedin_url)
    if (sql.startsWith('INSERT INTO contacts')) {
      const newContact: any = {
        id: uuid(),
        company_id: params[0] as string,
        name: params[1] as string,
        title: params[2] as string,
        seniority: params[3] as string,
        decision_maker: params[4] as boolean,
        email: params[5] as string,
        linkedin_url: params[6] as string ?? null,
        created_at: new Date().toISOString(),
      };
      db.contacts.push(newContact);
      saveDb(db);
      // RETURNING * — return the new row so the frontend gets it immediately
      if (sql.includes('RETURNING')) {
        return { rows: [newContact], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
    }

    // 30. INSERT INTO conversions
    if (sql.startsWith('INSERT INTO conversions')) {
      db.conversions.push({
        id: uuid(),
        company_id: params[0] as string,
        conversion_type: params[1] as string,
        revenue: params[2] as number,
        notes: params[3] as string,
        conversion_date: new Date().toISOString(),
      });
      saveDb(db);
      return { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
    }

    // 31. Seed completed statistics
    if (sql.includes('(SELECT COUNT(*) FROM companies) as companies')) {
      const companiesCount = db.companies.length;
      const signalsCount = db.signals.length;
      const qualifiedCount = db.scores.filter((s) => s.overall_score >= 75).length;
      rows = [{ companies: String(companiesCount), signals: String(signalsCount), qualified: String(qualifiedCount) }];
      return { rows, rowCount: 1, command: 'SELECT', oid: 0, fields: [] };
    }

    // 32. UPDATE crm_records failure
    if (sql.startsWith('UPDATE crm_records SET status = $1, retry_count = $2, last_error = $3')) {
      const status = params[0] as string;
      const retry_count = params[1] as number;
      const last_error = params[2] as string;
      const company_id = params[3] as string;

      const crm = db.crm_records.find((c) => c.company_id === company_id);
      if (crm) {
        crm.status = status;
        crm.retry_count = retry_count;
        crm.last_error = last_error;
        crm.last_updated = new Date().toISOString();
        saveDb(db);
      }
      return { rows: [], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] };
    }

    // 33. INSERT INTO crm_records failure
    if (sql.startsWith('INSERT INTO crm_records (company_id, status, retry_count, last_error, last_updated)')) {
      db.crm_records.push({
        id: uuid(),
        company_id: params[0] as string,
        status: params[1] as string,
        retry_count: params[2] as number,
        last_error: params[3] as string,
        last_updated: new Date().toISOString(),
      });
      saveDb(db);
      return { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
    }

    // 34. INSERT INTO audit_logs
    if (sql.startsWith('INSERT INTO audit_logs')) {
      db.audit_logs.push({
        id: uuid(),
        action: params[0] as string,
        entity_type: params[1] as string,
        entity_id: params[2] as string | null,
        details: typeof params[3] === 'string' ? JSON.parse(params[3]) : params[3],
        ip_address: params[4] as string | null,
        created_at: new Date().toISOString(),
      });
      saveDb(db);
      return { rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
    }

    // 34b. SELECT FROM audit_logs
    if (sql.includes('FROM audit_logs')) {
      let filteredLogs = db.audit_logs || [];
      // Only show scheduler_trigger entries — one per pipeline run, with trigger_type + duration
      if (sql.includes("action = 'scheduler_trigger'")) {
        filteredLogs = filteredLogs.filter((log) => log.action === 'scheduler_trigger');
      }
      // Sort descending by created_at
      const sortedLogs = [...filteredLogs].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return { rows: sortedLogs, rowCount: sortedLogs.length, command: 'SELECT', oid: 0, fields: [] };
    }

    // 35. Dashboard: SELECT COUNT(*) FROM scores WHERE overall_score >= $1
    if (sql === 'SELECT COUNT(*) FROM scores WHERE overall_score >= $1') {
      const scoreThreshold = params[0] as number;
      const count = db.scores.filter((s) => s.overall_score >= scoreThreshold).length;
      rows = [{ count: String(count) }];
      return { rows, rowCount: 1, command: 'SELECT', oid: 0, fields: [] };
    }

    // 36. Dashboard: SELECT COUNT(*) FROM signals WHERE created_at > NOW() - INTERVAL '7 days'
    if (sql === "SELECT COUNT(*) FROM signals WHERE created_at > NOW() - INTERVAL '7 days'") {
      const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
      const count = db.signals.filter((s) => new Date(s.created_at).getTime() > sevenDaysAgo).length;
      rows = [{ count: String(count) }];
      return { rows, rowCount: 1, command: 'SELECT', oid: 0, fields: [] };
    }

    // 37. Dashboard: SELECT COUNT(DISTINCT company_id) FROM scores WHERE overall_score >= $1
    if (sql === 'SELECT COUNT(DISTINCT company_id) FROM scores WHERE overall_score >= $1') {
      const scoreThreshold = params[0] as number;
      const ids = new Set(
        db.scores.filter((s) => s.overall_score >= scoreThreshold).map((s) => s.company_id)
      );
      rows = [{ count: String(ids.size) }];
      return { rows, rowCount: 1, command: 'SELECT', oid: 0, fields: [] };
    }

    // 38. Dashboard: SELECT COUNT(*) FROM crm_records WHERE status = 'synced'
    if (sql === "SELECT COUNT(*) FROM crm_records WHERE status = 'synced'") {
      const count = db.crm_records.filter((c) => c.status === 'synced').length;
      rows = [{ count: String(count) }];
      return { rows, rowCount: 1, command: 'SELECT', oid: 0, fields: [] };
    }

    // 39. Dashboard: SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE conversion_type = 'closed_won') as won FROM conversions
    if (sql.includes('COUNT(*) as total') && sql.includes('conversion_type = \'closed_won\'') && sql.includes('FROM conversions')) {
      const total = db.conversions.length;
      const won = db.conversions.filter((c) => c.conversion_type === 'closed_won').length;
      rows = [{ total: String(total), won: String(won) }];
      return { rows, rowCount: 1, command: 'SELECT', oid: 0, fields: [] };
    }

    // 40. Dashboard: SELECT signal_type, COUNT(*) as count FROM signals WHERE is_active = true GROUP BY signal_type
    if (sql === 'SELECT signal_type, COUNT(*) as count FROM signals WHERE is_active = true GROUP BY signal_type') {
      const counts: Record<string, number> = {};
      db.signals.filter((s) => s.is_active).forEach((s) => {
        counts[s.signal_type] = (counts[s.signal_type] || 0) + 1;
      });
      rows = Object.entries(counts).map(([signal_type, count]) => ({ signal_type, count: String(count) }));
      return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
    }

    // 41. Dashboard: SELECT city, COUNT(*) as count FROM companies WHERE city IS NOT NULL AND is_active = true GROUP BY city ORDER BY count DESC LIMIT 5
    if (sql === 'SELECT city, COUNT(*) as count FROM companies WHERE city IS NOT NULL AND is_active = true GROUP BY city ORDER BY count DESC LIMIT 5') {
      const counts: Record<string, number> = {};
      db.companies.filter((c) => c.city && c.is_active).forEach((c) => {
        counts[c.city] = (counts[c.city] || 0) + 1;
      });
      rows = Object.entries(counts)
        .map(([city, count]) => ({ city, count: String(count) }))
        .sort((a, b) => parseInt(b.count, 10) - parseInt(a.count, 10))
        .slice(0, 5);
      return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
    }

    // 42. Companies List count: SELECT COUNT(DISTINCT c.id) FROM companies c LEFT JOIN scores s ON s.company_id = c.id
    if (sql.includes('SELECT COUNT(DISTINCT c.id) FROM companies c')) {
      const city = getParam(sql, /c\.city\s+ilike\s+\$(\d+)/i, params);
      const industry = getParam(sql, /c\.industry\s+ilike\s+\$(\d+)/i, params);
      const funding_stage = getParam(sql, /c\.funding_stage\s+ilike\s+\$(\d+)/i, params);
      const min_score = getParam(sql, /s\.overall_score\s*>=\s*\$(\d+)/i, params);
      const max_score = getParam(sql, /s\.overall_score\s*<=\s*\$(\d+)/i, params);
      const signal_type = getParam(sql, /sig\.signal_type\s*=\s*\$(\d+)/i, params);

      const filtered = db.companies.filter((c) => {
        if (!c.is_active) return false;
        if (city && (!c.city || !c.city.toLowerCase().includes(city.replace(/%/g, '').toLowerCase()))) return false;
        if (industry && (!c.industry || !c.industry.toLowerCase().includes(industry.replace(/%/g, '').toLowerCase()))) return false;
        if (funding_stage && (!c.funding_stage || !c.funding_stage.toLowerCase().includes(funding_stage.replace(/%/g, '').toLowerCase()))) return false;

        const score = db.scores.find((s) => s.company_id === c.id);
        const overall = score?.overall_score || 0;
        if (min_score !== null && min_score !== undefined && overall < min_score) return false;
        if (max_score !== null && max_score !== undefined && overall > max_score) return false;

        if (signal_type) {
          const hasSig = db.signals.some((s) => s.company_id === c.id && s.signal_type === signal_type && s.is_active);
          if (!hasSig) return false;
        }
        return true;
      });

      rows = [{ count: String(filtered.length) }];
      return { rows, rowCount: 1, command: 'SELECT', oid: 0, fields: [] };
    }

    // 43. Companies List data: SELECT c.*, s.fit_score ... FROM companies c
    if (sql.includes('SELECT c.*') && sql.includes('ARRAY_AGG(DISTINCT sig.signal_type)') && sql.includes('FROM companies c')) {
      const city = getParam(sql, /c\.city\s+ilike\s+\$(\d+)/i, params);
      const industry = getParam(sql, /c\.industry\s+ilike\s+\$(\d+)/i, params);
      const funding_stage = getParam(sql, /c\.funding_stage\s+ilike\s+\$(\d+)/i, params);
      const min_score = getParam(sql, /s\.overall_score\s*>=\s*\$(\d+)/i, params);
      const max_score = getParam(sql, /s\.overall_score\s*<=\s*\$(\d+)/i, params);
      const signal_type = getParam(sql, /sig\.signal_type\s*=\s*\$(\d+)/i, params);

      const limitOffsetMatch = sql.match(/limit\s+\$(\d+)\s+offset\s+\$(\d+)/i);
      let limit = 20;
      let offset = 0;
      if (limitOffsetMatch) {
        limit = params[parseInt(limitOffsetMatch[1], 10) - 1] as number;
        offset = params[parseInt(limitOffsetMatch[2], 10) - 1] as number;
      }

      const filtered = db.companies.filter((c) => {
        if (!c.is_active) return false;
        if (city && (!c.city || !c.city.toLowerCase().includes(city.replace(/%/g, '').toLowerCase()))) return false;
        if (industry && (!c.industry || !c.industry.toLowerCase().includes(industry.replace(/%/g, '').toLowerCase()))) return false;
        if (funding_stage && (!c.funding_stage || !c.funding_stage.toLowerCase().includes(funding_stage.replace(/%/g, '').toLowerCase()))) return false;

        const score = db.scores.find((s) => s.company_id === c.id);
        const overall = score?.overall_score || 0;
        if (min_score !== null && min_score !== undefined && overall < min_score) return false;
        if (max_score !== null && max_score !== undefined && overall > max_score) return false;

        if (signal_type) {
          const hasSig = db.signals.some((s) => s.company_id === c.id && s.signal_type === signal_type && s.is_active);
          if (!hasSig) return false;
        }
        return true;
      });

      // Join calculations
      const joined = filtered.map((c) => {
        const score = db.scores.find((s) => s.company_id === c.id) || { fit_score: 0, intent_score: 0, timing_score: 0, overall_score: 0 };
        const outreach = db.outreach_recommendations.find((o) => o.company_id === c.id);
        const crm = db.crm_records.find((cr) => cr.company_id === c.id);
        const companySignals = db.signals.filter((s) => s.company_id === c.id && s.is_active);
        const signal_types = Array.from(new Set(companySignals.map((s) => s.signal_type)));

        return {
          ...c,
          fit_score: score.fit_score,
          intent_score: score.intent_score,
          timing_score: score.timing_score,
          overall_score: score.overall_score,
          recommended_product: outreach?.recommended_product || null,
          crm_status: crm?.status || null,
          assigned_salesperson: crm?.assigned_salesperson || null,
          signal_types,
        };
      });

      // Simple sort: assume descending overall_score unless stated otherwise
      joined.sort((a, b) => b.overall_score - a.overall_score);

      rows = joined.slice(offset, offset + limit);
      return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
    }

    // 44. Company detail: SELECT * FROM companies WHERE id = $1
    if (sql === 'SELECT * FROM companies WHERE id = $1') {
      const companyId = params[0] as string;
      rows = db.companies.filter((c) => c.id === companyId);
      return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
    }

    // 45. Company detail signals: SELECT * FROM signals WHERE company_id = $1 ORDER BY signal_date DESC
    if (sql === 'SELECT * FROM signals WHERE company_id = $1 ORDER BY signal_date DESC') {
      const companyId = params[0] as string;
      rows = db.signals
        .filter((s) => s.company_id === companyId)
        .sort((a, b) => b.signal_date.localeCompare(a.signal_date));
      return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
    }

    // 46. Company detail contacts: SELECT * FROM contacts WHERE company_id = $1
    if (sql === 'SELECT * FROM contacts WHERE company_id = $1') {
      const companyId = params[0] as string;
      rows = db.contacts.filter((c) => c.company_id === companyId);
      return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
    }

    // 47. Company detail scores: SELECT * FROM scores WHERE company_id = $1
    if (sql === 'SELECT * FROM scores WHERE company_id = $1') {
      const companyId = params[0] as string;
      rows = db.scores.filter((s) => s.company_id === companyId);
      return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
    }

    // 48. Company detail crm: SELECT * FROM crm_records WHERE company_id = $1
    if (sql === 'SELECT * FROM crm_records WHERE company_id = $1') {
      const companyId = params[0] as string;
      rows = db.crm_records.filter((cr) => cr.company_id === companyId);
      return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
    }

    // 49. Company detail outreach: SELECT * FROM outreach_recommendations WHERE company_id = $1 ORDER BY created_at DESC LIMIT 1
    if (sql === 'SELECT * FROM outreach_recommendations WHERE company_id = $1 ORDER BY created_at DESC LIMIT 1') {
      const companyId = params[0] as string;
      rows = db.outreach_recommendations
        .filter((o) => o.company_id === companyId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 1);
      return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
    }

    // 50. Signals List query: SELECT sig.*, c.name as company_name, c.city, c.industry, c.website FROM signals sig JOIN companies c ON c.id = sig.company_id
    if (sql.includes('SELECT sig.*') && sql.includes('FROM signals sig') && sql.includes('JOIN companies c ON c.id = sig.company_id')) {
      const signal_type = getParam(sql, /sig\.signal_type\s*=\s*\$(\d+)/i, params);
      const signal_source = getParam(sql, /sig\.signal_source\s*=\s*\$(\d+)/i, params);
      const city = getParam(sql, /c\.city\s+ilike\s+\$(\d+)/i, params);
      const industry = getParam(sql, /c\.industry\s+ilike\s+\$(\d+)/i, params);
      const min_confidence = getParam(sql, /sig\.confidence_score\s*>=\s*\$(\d+)/i, params);

      const limitOffsetMatch = sql.match(/limit\s+\$(\d+)\s+offset\s+\$(\d+)/i);
      let limit = 50;
      let offset = 0;
      if (limitOffsetMatch) {
        limit = params[parseInt(limitOffsetMatch[1], 10) - 1] as number;
        offset = params[parseInt(limitOffsetMatch[2], 10) - 1] as number;
      }

      const filtered = db.signals
        .filter((sig) => {
          if (!sig.is_active) return false;
          const comp = db.companies.find((c) => c.id === sig.company_id);
          if (!comp) return false;

          if (signal_type && sig.signal_type !== signal_type) return false;
          if (signal_source && sig.signal_source !== signal_source) return false;
          if (city && (!comp.city || !comp.city.toLowerCase().includes(city.replace(/%/g, '').toLowerCase()))) return false;
          if (industry && (!comp.industry || !comp.industry.toLowerCase().includes(industry.replace(/%/g, '').toLowerCase()))) return false;
          if (min_confidence !== null && min_confidence !== undefined && sig.confidence_score < min_confidence) return false;

          return true;
        })
        .map((sig) => {
          const comp = db.companies.find((c) => c.id === sig.company_id)!;
          return {
            ...sig,
            company_name: comp.name,
            city: comp.city,
            industry: comp.industry,
            website: comp.website,
          };
        });

      // Sort: newest by created_at if requested, otherwise by signal_date + confidence
      if (sql.includes('sig.created_at DESC')) {
        filtered.sort((a, b) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bTime - aTime;
        });
      } else {
        filtered.sort((a, b) => b.signal_date.localeCompare(a.signal_date) || b.confidence_score - a.confidence_score);
      }

      rows = filtered.slice(offset, offset + limit);
      return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
    }

    // 51. Sales Queue: SELECT c.id as company_id, c.name as company_name, s.overall_score ...
    if (sql.includes('SELECT c.id as company_id') && sql.includes('s.overall_score') && sql.includes('GROUP BY c.id, c.name, s.overall_score')) {
      const queueRows = db.companies
        .filter((c) => c.is_active)
        .map((c) => {
          const score = db.scores.find((s) => s.company_id === c.id) || { overall_score: 0 };
          const outreach = db.outreach_recommendations.find((o) => o.company_id === c.id);
          const compSignals = db.signals.filter((s) => s.company_id === c.id && s.is_active);

          let latest_signal_date = null;
          if (compSignals.length > 0) {
            latest_signal_date = compSignals.reduce(
              (max, s) => (s.signal_date > max ? s.signal_date : max),
              compSignals[0].signal_date
            );
          }

          return {
            company_id: c.id,
            company_name: c.name,
            overall_score: score.overall_score,
            recommended_product: outreach?.recommended_product || null,
            signal_count: String(compSignals.length),
            latest_signal_date,
            requires_review: outreach?.requires_human_review || false,
          };
        });

      queueRows.sort((a, b) => b.overall_score - a.overall_score);
      rows = queueRows;
      return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
    }

    // 52. CRM Lead sync status update
    if (sql.startsWith('UPDATE crm_records SET status = $1, last_updated = NOW() WHERE company_id = $2')) {
      const status = params[0] as string;
      const companyId = params[1] as string;
      const crm = db.crm_records.find((c) => c.company_id === companyId);
      if (crm) {
        crm.status = status;
        crm.last_updated = new Date().toISOString();
        saveDb(db);
      }
      return { rows: [], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] };
    }

    // 53. UPDATE signals is_active (mark inactive jobs)
    if (sql.startsWith('UPDATE signals SET is_active = false WHERE company_id = $1 AND signal_type = \'HIRING_SIGNAL\'')) {
      const companyId = params[0] as string;
      // Filter signals for company and set is_active false if older than 60 days
      const thresholdDate = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString().split('T')[0];
      db.signals.forEach((s) => {
        if (s.company_id === companyId && s.signal_type === 'HIRING_SIGNAL' && s.signal_date < thresholdDate) {
          s.is_active = false;
        }
      });
      saveDb(db);
      return { rows: [], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] };
    }

    // Default Fallback
    logger.warn('Unhandled SQL query in mock database', { sql, params });
    return { rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] };
  } catch (error: any) {
    logger.error('Mock query execution failed', { sql, error: error.message });
    throw error;
  }
}

export async function withTransaction<T>(
  fn: (client: any) => Promise<T>
): Promise<T> {
  const client = {
    query: async (text: string, params: any[] = []) => {
      return query(text, params);
    },
    release: () => {},
  };
  try {
    await query('BEGIN');
    const result = await fn(client);
    await query('COMMIT');
    return result;
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}

export function getSettings() {
  const db = loadDb();
  if (!db.settings) {
    db.settings = {
      signal_collection_cron: '0 */6 * * *',
      last_run: null,
      last_run_status: 'idle',
      fit_weight: 0.4,
      intent_weight: 0.4,
      timing_weight: 0.2
    };
    saveDb(db);
  }
  return db.settings;
}

export function updateSettings(newSettings: any) {
  const db = loadDb();
  db.settings = {
    ...getSettings(),
    ...newSettings
  };
  saveDb(db);
  return db.settings;
}
