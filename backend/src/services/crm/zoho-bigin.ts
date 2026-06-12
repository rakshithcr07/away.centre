import { query } from '../../db/pool';
import { config } from '../../config';
import { logger } from '../../utils/logger';

interface ZohoTokenResponse {
  access_token: string;
  expires_in: number;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  if (!config.zoho.clientId || !config.zoho.refreshToken) {
    throw new Error('Zoho credentials not configured');
  }

  const params = new URLSearchParams({
    refresh_token: config.zoho.refreshToken,
    client_id: config.zoho.clientId,
    client_secret: config.zoho.clientSecret,
    grant_type: 'refresh_token',
  });

  const response = await fetch(
    `https://accounts.zoho.com/oauth/v2/token?${params}`,
    { method: 'POST' }
  );

  if (!response.ok) {
    throw new Error(`Zoho token refresh failed: ${response.status}`);
  }

  const data = (await response.json()) as ZohoTokenResponse;
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

export async function syncQualifiedLeadsToCRM(): Promise<number> {
  const { rows: leads } = await query<{
    company_id: string;
    name: string;
    website: string | null;
    city: string | null;
    industry: string | null;
    employee_count: number | null;
    overall_score: number;
    crm_id: string | null;
    crm_status: string | null;
    retry_count: number;
  }>(
    `SELECT c.id as company_id, c.name, c.website, c.city, c.industry, c.employee_count,
            s.overall_score, cr.id as crm_id, cr.status as crm_status, COALESCE(cr.retry_count, 0) as retry_count
     FROM companies c
     JOIN scores s ON s.company_id = c.id
     LEFT JOIN crm_records cr ON cr.company_id = c.id
     WHERE s.overall_score >= $1
       AND c.is_active = true
       AND (cr.id IS NULL OR cr.status IN ('pending', 'failed'))
       AND (cr.retry_count IS NULL OR cr.retry_count < 5)`,
    [config.qualifiedScoreThreshold]
  );

  let synced = 0;

  for (const lead of leads) {
    if (lead.crm_status === 'closed_lost') continue;

    try {
      const zohoLeadId = await createZohoLead(lead);
      await upsertCrmRecord(lead.company_id, zohoLeadId, 'synced');
      synced++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await handleCrmFailure(lead.company_id, lead.crm_id, lead.retry_count, message);
    }
  }

  return synced;
}

async function createZohoLead(lead: {
  name: string;
  website: string | null;
  city: string | null;
  industry: string | null;
  employee_count: number | null;
  overall_score: number;
}): Promise<string> {
  // Mock CRM sync when credentials not configured
  if (!config.zoho.clientId) {
    const mockId = `ZOHO-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    logger.info('Mock Zoho lead created', { name: lead.name, mockId });
    return mockId;
  }

  const token = await getAccessToken();

  const payload = {
    data: [
      {
        Company: lead.name,
        Website: lead.website,
        City: lead.city,
        Industry: lead.industry,
        No_of_Employees: lead.employee_count,
        Description: `Away Intelligence lead. Score: ${lead.overall_score}`,
        Lead_Source: 'Away Intelligence',
      },
    ],
  };

  const response = await fetch(`${config.zoho.apiDomain}/bigin/v2/Leads`, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Zoho API error ${response.status}: ${body}`);
  }

  const result = await response.json() as { data: Array<{ details: { id: string } }> };
  return result.data[0].details.id;
}

async function upsertCrmRecord(
  companyId: string,
  zohoLeadId: string,
  status: string
): Promise<void> {
  await query(
    `INSERT INTO crm_records (company_id, zoho_lead_id, status, last_updated, retry_count)
     VALUES ($1, $2, $3, NOW(), 0)
     ON CONFLICT (company_id) DO UPDATE SET
       zoho_lead_id = EXCLUDED.zoho_lead_id,
       status = EXCLUDED.status,
       last_updated = NOW(),
       retry_count = 0,
       last_error = NULL`,
    [companyId, zohoLeadId, status]
  );
}

async function handleCrmFailure(
  companyId: string,
  crmId: string | null,
  retryCount: number,
  error: string
): Promise<void> {
  const newRetryCount = retryCount + 1;
  const status = newRetryCount >= 5 ? 'dead_letter' : 'failed';

  if (crmId) {
    await query(
      `UPDATE crm_records SET status = $1, retry_count = $2, last_error = $3, last_updated = NOW()
       WHERE company_id = $4`,
      [status, newRetryCount, error, companyId]
    );
  } else {
    await query(
      `INSERT INTO crm_records (company_id, status, retry_count, last_error, last_updated)
       VALUES ($1, $2, $3, $4, NOW())`,
      [companyId, status, newRetryCount, error]
    );
  }

  logger.error('CRM sync failed', { companyId, retryCount: newRetryCount, error });
}
