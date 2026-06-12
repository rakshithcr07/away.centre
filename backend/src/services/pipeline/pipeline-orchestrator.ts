import { signalCollector } from '../signals/signal-collector';
import { recalculateAllScores } from '../scoring/score-service';
import { generateOutreachForQualified } from '../outreach/outreach-service';
import { syncQualifiedLeadsToCRM } from '../crm/zoho-bigin';
import { notifySlackOfQualifiedLeads } from '../notifications/slack-service';
import { sendQualifiedLeadsEmail } from '../notifications/email-service';
import { query, getSettings, updateSettings } from '../../db/pool';
import { config } from '../../config';
import { logger } from '../../utils/logger';

/**
 * Full pipeline orchestration:
 * 1. Collect signals
 * 2. Process raw signals
 * 3. Normalize & enrich companies (during signal processing)
 * 4. Calculate scores
 * 5. Generate outreach recommendations
 * 6. Push qualified leads to CRM
 * 7. Notify Slack & Email
 */
export async function runPipeline(triggerType: 'automatic' | 'manual' = 'automatic'): Promise<void> {
  const startTime = Date.now();
  logger.info(`Pipeline started (${triggerType} trigger)`);

  updateSettings({
    last_run: new Date().toISOString(),
    last_run_status: 'running'
  });

  try {
    // Step 1 & 2: Collect and process signals
    const collected = await signalCollector.collectAll();
    const processed = await signalCollector.processRawSignals();
    logger.info(`Signals: ${collected} collected, ${processed} processed`);

    // Step 3: Enrichment happens during signal processing

    // Step 4: Calculate scores
    const scored = await recalculateAllScores();
    logger.info(`Scores recalculated for ${scored} companies`);

    // Step 5: Generate outreach
    const outreach = await generateOutreachForQualified();
    logger.info(`Outreach generated for ${outreach} companies`);

    // Step 6: CRM sync
    const synced = await syncQualifiedLeadsToCRM();
    logger.info(`CRM synced: ${synced} leads`);

    // Step 7: Notifications
    await notifySlackOfQualifiedLeads();

    const { rows: qualifiedLeads } = await query<{
      name: string;
      overall_score: number;
      city: string | null;
    }>(
      `SELECT c.name, s.overall_score, c.city
       FROM companies c JOIN scores s ON s.company_id = c.id
       WHERE s.overall_score >= $1 AND s.updated_at > NOW() - INTERVAL '6 hours'`,
      [config.qualifiedScoreThreshold]
    );

    if (qualifiedLeads.length > 0) {
      await sendQualifiedLeadsEmail(
        qualifiedLeads.map((l) => ({ name: l.name, score: l.overall_score, city: l.city }))
      );
    }

    const duration = Date.now() - startTime;
    logger.info(`Pipeline completed in ${duration}ms`);

    updateSettings({
      last_run_status: 'success'
    });

    // Write audit log
    await query(
      `INSERT INTO audit_logs (action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        'scheduler_trigger',
        'scheduler',
        null,
        JSON.stringify({ success: true, duration, trigger_type: triggerType }),
        null
      ]
    ).catch(() => {});

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Pipeline failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    updateSettings({
      last_run_status: 'failed'
    });

    // Write audit log
    await query(
      `INSERT INTO audit_logs (action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        'scheduler_trigger',
        'scheduler',
        null,
        JSON.stringify({
          success: false,
          duration,
          trigger_type: triggerType,
          error: error instanceof Error ? error.message : String(error)
        }),
        null
      ]
    ).catch(() => {});

    throw error;
  }
}
