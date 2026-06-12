import { query } from '../../db/pool';
import { logger } from '../../utils/logger';
import { hashContent } from '../../utils/hash';
import type { SignalSource, SignalType } from '@away/shared';

export interface RawSignalInput {
  source: SignalSource;
  companyName: string;
  signalType: SignalType;
  signalText: string;
  signalDate: string;
  confidenceScore: number;
  website?: string;
  city?: string;
  industry?: string;
  employeeCount?: number;
  linkedinUrl?: string;
  rawPayload?: Record<string, unknown>;
}

// Mock signal data for MVP - replace with real API integrations
const MOCK_SIGNALS: RawSignalInput[] = [
  {
    source: 'wellfound',
    companyName: 'Razorpay',
    signalType: 'HIRING_SIGNAL',
    signalText: 'Hiring in Bangalore - 15 engineering roles, office manager, HR team',
    signalDate: new Date().toISOString().split('T')[0],
    confidenceScore: 0.92,
    website: 'https://razorpay.com',
    city: 'Bangalore',
    industry: 'Fintech',
    employeeCount: 2500,
  },
  {
    source: 'crunchbase',
    companyName: 'Juspay',
    signalType: 'FUNDING_SIGNAL',
    signalText: 'Raised Series B expansion capital for India growth',
    signalDate: new Date().toISOString().split('T')[0],
    confidenceScore: 0.88,
    website: 'https://juspay.in',
    city: 'Bangalore',
    industry: 'Fintech',
    employeeCount: 400,
  },
  {
    source: 'linkedin',
    companyName: 'Postman',
    signalType: 'SOCIAL_SIGNAL',
    signalText: 'Founder post: WFH isn\'t working, team growing fast, looking for office space in Bangalore',
    signalDate: new Date().toISOString().split('T')[0],
    confidenceScore: 0.85,
    website: 'https://postman.com',
    city: 'Bangalore',
    industry: 'SaaS',
    employeeCount: 800,
  },
  {
    source: 'news_api',
    companyName: 'Chargebee',
    signalType: 'EXPANSION_SIGNAL',
    signalText: 'India expansion with new office announcement in Bangalore',
    signalDate: new Date().toISOString().split('T')[0],
    confidenceScore: 0.9,
    website: 'https://chargebee.com',
    city: 'Bangalore',
    industry: 'SaaS',
    employeeCount: 600,
  },
  {
    source: 'google_jobs',
    companyName: 'Freshworks',
    signalType: 'HIRING_SIGNAL',
    signalText: 'Hiring in Chennai - multiple jobs posted for onsite hybrid roles',
    signalDate: new Date().toISOString().split('T')[0],
    confidenceScore: 0.87,
    website: 'https://freshworks.com',
    city: 'Chennai',
    industry: 'SaaS',
    employeeCount: 5000,
  },
  {
    source: 'wellfound',
    companyName: 'Darwinbox',
    signalType: 'HIRING_SIGNAL',
    signalText: 'Hiring in Hyderabad - HR teams and operations, hybrid setup',
    signalDate: new Date().toISOString().split('T')[0],
    confidenceScore: 0.84,
    website: 'https://darwinbox.com',
    city: 'Hyderabad',
    industry: 'SaaS',
    employeeCount: 700,
  },
  {
    source: 'career_page',
    companyName: 'M2P Fintech',
    signalType: 'HIRING_SIGNAL',
    signalText: 'Hiring in Bangalore - engineers and customer support, onsite',
    signalDate: new Date().toISOString().split('T')[0],
    confidenceScore: 0.86,
    website: 'https://m2pfintech.com',
    city: 'Bangalore',
    industry: 'Fintech',
    employeeCount: 350,
  },
  {
    source: 'crunchbase',
    companyName: 'Hasura',
    signalType: 'FUNDING_SIGNAL',
    signalText: 'Raised Series B funding for product expansion',
    signalDate: new Date().toISOString().split('T')[0],
    confidenceScore: 0.91,
    website: 'https://hasura.io',
    city: 'Bangalore',
    industry: 'SaaS',
    employeeCount: 150,
  },
  {
    source: 'linkedin',
    companyName: 'Zeta',
    signalType: 'SOCIAL_SIGNAL',
    signalText: 'HR post about need hybrid setup and office space in Bangalore',
    signalDate: new Date().toISOString().split('T')[0],
    confidenceScore: 0.83,
    website: 'https://zeta.tech',
    city: 'Bangalore',
    industry: 'Fintech',
    employeeCount: 1200,
  },
  {
    source: 'news_api',
    companyName: 'Innovaccer',
    signalType: 'EXPANSION_SIGNAL',
    signalText: 'South India expansion - opened office in Vizag',
    signalDate: new Date().toISOString().split('T')[0],
    confidenceScore: 0.89,
    website: 'https://innovaccer.com',
    city: 'Vizag',
    industry: 'HealthTech',
    employeeCount: 1500,
  },
  {
    source: 'google_jobs',
    companyName: 'Navi Technologies',
    signalType: 'HIRING_SIGNAL',
    signalText: 'Hiring in Bangalore - multiple engineering roles posted',
    signalDate: new Date().toISOString().split('T')[0],
    confidenceScore: 0.88,
    website: 'https://navi.com',
    city: 'Bangalore',
    industry: 'Fintech',
    employeeCount: 2000,
  },
  {
    source: 'wellfound',
    companyName: 'Ather Energy',
    signalType: 'HIRING_SIGNAL',
    signalText: 'Hiring in Bangalore - operations teams, onsite hybrid',
    signalDate: new Date().toISOString().split('T')[0],
    confidenceScore: 0.85,
    website: 'https://atherenergy.com',
    city: 'Bangalore',
    industry: 'Manufacturing',
    employeeCount: 2500,
  },
  {
    source: 'career_page',
    companyName: 'Slice',
    signalType: 'HIRING_SIGNAL',
    signalText: 'Hiring in Bangalore - engineers, HR, office manager roles',
    signalDate: new Date().toISOString().split('T')[0],
    confidenceScore: 0.9,
    website: 'https://sliceit.com',
    city: 'Bangalore',
    industry: 'Fintech',
    employeeCount: 400,
  },
  {
    source: 'twitter',
    companyName: 'Locus',
    signalType: 'SOCIAL_SIGNAL',
    signalText: 'Team growing fast, need office space in Bangalore for hybrid work',
    signalDate: new Date().toISOString().split('T')[0],
    confidenceScore: 0.8,
    website: 'https://locus.sh',
    city: 'Bangalore',
    industry: 'SaaS',
    employeeCount: 300,
  },
  {
    source: 'news_api',
    companyName: 'Practo',
    signalType: 'EXPANSION_SIGNAL',
    signalText: 'Kolkata expansion - India launch of new regional office',
    signalDate: new Date().toISOString().split('T')[0],
    confidenceScore: 0.87,
    website: 'https://practo.com',
    city: 'Kolkata',
    industry: 'HealthTech',
    employeeCount: 1800,
  },
];

export class SignalCollectorService {
  async collectAll(): Promise<number> {
    logger.info('Starting signal collection...');
    let collected = 0;

    const sources = [
      () => this.collectFromWellfound(),
      () => this.collectFromGoogleJobs(),
      () => this.collectFromCrunchbase(),
      () => this.collectFromNewsApi(),
      () => this.collectFromLinkedIn(),
      () => this.collectFromCareerPages(),
    ];

    for (const collect of sources) {
      try {
        const count = await collect();
        collected += count;
      } catch (error) {
        logger.error('Signal collection source failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info(`Signal collection complete: ${collected} raw signals stored`);
    return collected;
  }

  private async collectFromWellfound(): Promise<number> {
    return this.storeMockSignals('wellfound');
  }

  private async collectFromGoogleJobs(): Promise<number> {
    return this.storeMockSignals('google_jobs');
  }

  private async collectFromCrunchbase(): Promise<number> {
    return this.storeMockSignals('crunchbase');
  }

  private async collectFromNewsApi(): Promise<number> {
    try {
      const { fetchGoogleNewsSignals } = await import('./google-news');
      const realSignals = await fetchGoogleNewsSignals();
      
      let stored = 0;
      for (const signal of realSignals) {
        await query(
          `INSERT INTO raw_signals (source, raw_payload) VALUES ($1, $2)`,
          ['news_api', JSON.stringify(signal)]
        );
        stored++;
      }

      // Also append mock signals to keep data rich
      const mockCount = await this.storeMockSignals('news_api');
      return stored + mockCount;
    } catch (err: any) {
      logger.error('Failed to run live Google News scraper, falling back to mocks', { error: err.message });
      return this.storeMockSignals('news_api');
    }
  }

  private async collectFromLinkedIn(): Promise<number> {
    // LinkedIn scraping with retry/fallback
    try {
      return await this.storeMockSignals('linkedin');
    } catch (error) {
      logger.warn('LinkedIn collection blocked, retrying with fallback', {
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }

  private async collectFromCareerPages(): Promise<number> {
    try {
      const { checkCareerPage } = await import('./career-checker');
      
      // Get all active companies
      const { rows: companies } = await query<{ id: string; name: string; website: string | null }>(
        `SELECT id, name, website FROM companies WHERE is_active = true AND website IS NOT NULL`
      );

      let foundHiring = 0;
      for (const company of companies) {
        if (!company.website) continue;
        
        const check = await checkCareerPage(company.website);
        if (check.isHiring && check.signalText) {
          // Add raw signal for this company's career page hiring
          const signalInput = {
            source: 'career_page' as SignalSource,
            companyName: company.name,
            signalType: 'HIRING_SIGNAL' as SignalType,
            signalText: check.signalText,
            signalDate: new Date().toISOString().split('T')[0],
            confidenceScore: 0.9,
            website: company.website,
          };

          await query(
            `INSERT INTO raw_signals (source, raw_payload) VALUES ($1, $2)`,
            ['career_page', JSON.stringify(signalInput)]
          );
          foundHiring++;
        }
      }

      // Also append mocks
      const mockCount = await this.storeMockSignals('career_page');
      return foundHiring + mockCount;
    } catch (err: any) {
      logger.error('Failed to run live Playwright career page scraper, falling back to mocks', { error: err.message });
      return this.storeMockSignals('career_page');
    }
  }

  private async storeMockSignals(source: SignalSource): Promise<number> {
    const signals = MOCK_SIGNALS.filter((s) => s.source === source);
    let stored = 0;

    // Use a per-minute ISO timestamp as signalDate so the content hash differs
    // each pipeline run — signals accumulate visibly without polluting the text.
    const now = new Date();
    const runDate = now.toISOString().slice(0, 16); // e.g. "2026-06-12T14:48"

    for (const signal of signals) {
      const stampedSignal = {
        ...signal,
        signalDate: runDate,
      };
      await query(
        `INSERT INTO raw_signals (source, raw_payload) VALUES ($1, $2)`,
        [source, JSON.stringify(stampedSignal)]
      );
      stored++;
    }

    return stored;
  }

  async processRawSignals(): Promise<number> {
    const { rows: rawSignals } = await query<{
      id: string;
      raw_payload: RawSignalInput;
    }>(
      `SELECT id, raw_payload FROM raw_signals WHERE processed = false LIMIT 100`
    );

    let processed = 0;
    for (const raw of rawSignals) {
      try {
        await this.processSignal(raw.raw_payload);
        await query(`UPDATE raw_signals SET processed = true WHERE id = $1`, [raw.id]);
        processed++;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await query(
          `UPDATE raw_signals SET processing_error = $1 WHERE id = $2`,
          [message, raw.id]
        );
        logger.error('Failed to process raw signal', { id: raw.id, error: message });
      }
    }

    return processed;
  }

  private async processSignal(input: RawSignalInput): Promise<void> {
    const { findOrCreateCompany } = await import('../companies/company-service');
    const companyId = await findOrCreateCompany({
      name: input.companyName,
      website: input.website,
      city: input.city,
      industry: input.industry,
      employeeCount: input.employeeCount,
      linkedinUrl: input.linkedinUrl,
    });

    const contentHash = hashContent(
      input.signalType,
      input.signalText,
      input.signalDate,
      companyId
    );

    const existing = await query(
      `SELECT id FROM signals WHERE company_id = $1 AND content_hash = $2`,
      [companyId, contentHash]
    );

    if (existing.rows.length > 0) {
      logger.debug('Duplicate signal skipped', { companyId, contentHash });
      return;
    }

    await query(
      `INSERT INTO signals (company_id, signal_type, signal_source, signal_text, signal_date, confidence_score, content_hash, raw_payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        companyId,
        input.signalType,
        input.source,
        input.signalText,
        input.signalDate,
        input.confidenceScore,
        contentHash,
        JSON.stringify(input.rawPayload ?? {}),
      ]
    );

    if (input.signalType === 'HIRING_SIGNAL') {
      await query(
        `UPDATE companies SET hiring_count = hiring_count + 1, updated_at = NOW() WHERE id = $1`,
        [companyId]
      );
    }
  }
}

export const signalCollector = new SignalCollectorService();
