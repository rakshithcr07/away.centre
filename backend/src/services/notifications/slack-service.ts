import { query } from '../../db/pool';
import { config } from '../../config';
import { logger } from '../../utils/logger';

export async function notifySlackOfQualifiedLeads(): Promise<void> {
  const { rows: leads } = await query<{
    name: string;
    city: string | null;
    overall_score: number;
    recommended_product: string | null;
    signal_count: number;
  }>(
    `SELECT c.name, c.city, s.overall_score,
            o.recommended_product,
            (SELECT COUNT(*) FROM signals sig WHERE sig.company_id = c.id AND sig.is_active = true) as signal_count
     FROM companies c
     JOIN scores s ON s.company_id = c.id
     LEFT JOIN outreach_recommendations o ON o.company_id = c.id
     WHERE s.overall_score >= $1
       AND c.is_active = true
       AND s.updated_at > NOW() - INTERVAL '6 hours'`,
    [config.qualifiedScoreThreshold]
  );

  if (leads.length === 0) {
    logger.info('No new qualified leads to notify');
    return;
  }

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🎯 Away Intelligence — New Qualified Leads' },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${leads.length} new high-intent companies* identified in the last 6 hours.`,
      },
    },
    { type: 'divider' },
  ];

  for (const lead of leads.slice(0, 10)) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${lead.name}* (${lead.city ?? 'N/A'})\nScore: *${lead.overall_score}* | Signals: ${lead.signal_count} | Product: ${lead.recommended_product ?? 'TBD'}`,
      },
    } as typeof blocks[0]);
  }

  await sendSlackMessage({ blocks });
}

async function sendSlackMessage(payload: Record<string, unknown>): Promise<void> {
  if (!config.slack.webhookUrl) {
    logger.info('Slack webhook not configured, logging notification instead', {
      leadCount: (payload.blocks as unknown[])?.length,
    });
    return;
  }

  const response = await fetch(config.slack.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Slack notification failed: ${response.status}`);
  }

  logger.info('Slack notification sent');
}
