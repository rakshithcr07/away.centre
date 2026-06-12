import { query } from '../../db/pool';
import { normalizeCompanyName, namesLikelyMatch, extractDomain } from '../../utils/company-normalizer';
import { logger } from '../../utils/logger';

interface CompanyInput {
  name: string;
  website?: string;
  city?: string;
  industry?: string;
  employeeCount?: number;
  linkedinUrl?: string;
  country?: string;
}

export async function findOrCreateCompany(input: CompanyInput): Promise<string> {
  const normalized = normalizeCompanyName(input.name);
  const domain = extractDomain(input.website ?? null);

  // Check alias table
  const aliasMatch = await query<{ company_id: string }>(
    `SELECT company_id FROM company_aliases WHERE normalized_alias = $1`,
    [normalized]
  );
  if (aliasMatch.rows.length > 0) {
    await enrichCompany(aliasMatch.rows[0].company_id, input);
    return aliasMatch.rows[0].company_id;
  }

  // Check by domain
  if (domain) {
    const domainMatch = await query<{ id: string }>(
      `SELECT id FROM companies WHERE website ILIKE $1`,
      [`%${domain}%`]
    );
    if (domainMatch.rows.length > 0) {
      await enrichCompany(domainMatch.rows[0].id, input);
      return domainMatch.rows[0].id;
    }
  }

  // Check by normalized name
  const nameMatch = await query<{ id: string; name: string }>(
    `SELECT id, name FROM companies WHERE normalized_name = $1`,
    [normalized]
  );
  if (nameMatch.rows.length > 0) {
    await enrichCompany(nameMatch.rows[0].id, input);
    return nameMatch.rows[0].id;
  }

  // Fuzzy match against existing companies
  const allCompanies = await query<{ id: string; name: string }>(
    `SELECT id, name FROM companies WHERE is_active = true LIMIT 500`
  );
  for (const company of allCompanies.rows) {
    if (namesLikelyMatch(input.name, company.name)) {
      await query(
        `INSERT INTO company_aliases (company_id, alias_name, normalized_alias)
         VALUES ($1, $2, $3) ON CONFLICT (normalized_alias) DO NOTHING`,
        [company.id, input.name, normalized]
      );
      await enrichCompany(company.id, input);
      logger.info('Merged company via alias', { existing: company.name, alias: input.name });
      return company.id;
    }
  }

  // Create new company
  const result = await query<{ id: string }>(
    `INSERT INTO companies (name, normalized_name, website, city, industry, employee_count, linkedin_url, country)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      input.name,
      normalized,
      input.website ?? null,
      input.city ?? null,
      input.industry ?? null,
      input.employeeCount ?? null,
      input.linkedinUrl ?? null,
      input.country ?? 'India',
    ]
  );

  return result.rows[0].id;
}

async function enrichCompany(companyId: string, input: CompanyInput): Promise<void> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const fields: Array<[string, unknown]> = [
    ['website', input.website],
    ['city', input.city],
    ['industry', input.industry],
    ['employee_count', input.employeeCount],
    ['linkedin_url', input.linkedinUrl],
    ['country', input.country],
  ];

  for (const [field, value] of fields) {
    if (value !== undefined && value !== null) {
      updates.push(`${field} = COALESCE(companies.${field}, $${paramIndex})`);
      values.push(value);
      paramIndex++;
    }
  }

  if (updates.length === 0) return;

  values.push(companyId);
  await query(
    `UPDATE companies SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
    values
  );
}

export async function markInactiveJobs(companyId: string): Promise<void> {
  await query(
    `UPDATE signals SET is_active = false
     WHERE company_id = $1 AND signal_type = 'HIRING_SIGNAL'
     AND signal_date < NOW() - INTERVAL '60 days'`,
    [companyId]
  );
}
