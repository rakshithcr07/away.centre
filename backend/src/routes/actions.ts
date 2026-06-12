import { Router, Request, Response } from 'express';
import { recalculateAllScores } from '../services/scoring/score-service';
import { syncQualifiedLeadsToCRM } from '../services/crm/zoho-bigin';
import { notifySlackOfQualifiedLeads } from '../services/notifications/slack-service';
import { sendQualifiedLeadsEmail } from '../services/notifications/email-service';
import { runPipeline } from '../services/pipeline/pipeline-orchestrator';
import { roleAuth } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { getSettings, updateSettings, query } from '../db/pool';
import cron from 'node-cron';

const router = Router();

router.post('/scores/recalculate', roleAuth('admin', 'sales_manager'), auditLog('recalculate_scores', 'scores'), async (_req: Request, res: Response) => {
  const count = await recalculateAllScores();
  res.json({ message: `Recalculated scores for ${count} companies`, count });
});

router.post('/crm/sync', roleAuth('admin', 'sales_manager'), auditLog('crm_sync', 'crm_records'), async (_req: Request, res: Response) => {
  const synced = await syncQualifiedLeadsToCRM();
  res.json({ message: `Synced ${synced} leads to CRM`, synced });
});

router.post('/notifications/send', roleAuth('admin', 'sales_manager'), auditLog('send_notifications', 'notifications'), async (_req: Request, res: Response) => {
  await notifySlackOfQualifiedLeads();
  res.json({ message: 'Notifications sent' });
});

// Note: no auditLog middleware here — runPipeline('manual') writes its own
// scheduler_trigger audit log entry with trigger_type, duration and success/failure.
router.post('/pipeline/run', roleAuth('admin'), async (_req: Request, res: Response) => {
  await runPipeline('manual');
  res.json({ message: 'Pipeline completed' });
});

router.get('/settings', async (_req: Request, res: Response) => {
  const settings = getSettings();
  res.json(settings);
});

router.get('/scheduler/history', async (_req: Request, res: Response) => {
  try {
    // Only fetch 'scheduler_trigger' entries — these are written exclusively by
    // runPipeline() with a proper trigger_type ('automatic' or 'manual'), duration,
    // and success/failure. The old 'run_pipeline' action (from auditLog middleware)
    // has been removed from the pipeline/run route to eliminate duplicate entries.
    const { rows } = await query(
      `SELECT * FROM audit_logs
       WHERE action = 'scheduler_trigger'
       ORDER BY created_at DESC`
    );
    const parsedRows = rows.map((r: any) => ({
      ...r,
      details: typeof r.details === 'string' ? JSON.parse(r.details) : r.details
    }));
    res.json(parsedRows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/settings', roleAuth('admin', 'sales_manager'), auditLog('update_settings', 'settings'), async (req: Request, res: Response) => {
  const { signal_collection_cron, fit_weight, intent_weight, timing_weight } = req.body;

  if (signal_collection_cron && !cron.validate(signal_collection_cron)) {
    res.status(400).json({ error: 'Invalid cron expression format' });
    return;
  }

  const updated = updateSettings({
    signal_collection_cron,
    fit_weight: fit_weight !== undefined ? parseFloat(fit_weight) : undefined,
    intent_weight: intent_weight !== undefined ? parseFloat(intent_weight) : undefined,
    timing_weight: timing_weight !== undefined ? parseFloat(timing_weight) : undefined
  });

  res.json({ message: 'Settings updated successfully', settings: updated });
});

export default router;
