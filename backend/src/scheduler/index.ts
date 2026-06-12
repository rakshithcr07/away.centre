import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { enqueuePipeline } from '../workers/queues';
import { getSettings } from '../db/pool';

const DB_FILE = path.join(__dirname, '..', '..', '.mock_db.json');

let scheduledJob: any = null;
let currentCron = '';

async function runTask() {
  logger.info('Scheduled pipeline triggered');
  try {
    await enqueuePipeline();
  } catch (error) {
    logger.error('Failed to enqueue pipeline', {
      error: error instanceof Error ? error.message : String(error),
    });
    // Fallback: run directly if queue unavailable
    try {
      const { runPipeline } = await import('../services/pipeline/pipeline-orchestrator');
      await runPipeline();
    } catch (fallbackError) {
      logger.error('Pipeline fallback also failed', {
        error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
      });
    }
  }
}

function startScheduler() {
  const settings = getSettings();
  const cronExpr = settings.signal_collection_cron || '0 */6 * * *';

  if (currentCron === cronExpr && scheduledJob) {
    return;
  }

  if (scheduledJob) {
    logger.info(`Stopping existing scheduler job (old cron: ${currentCron})`);
    scheduledJob.stop();
  }

  currentCron = cronExpr;
  logger.info(`Starting scheduler job with cron: "${cronExpr}"`);
  scheduledJob = cron.schedule(cronExpr, runTask);
}

// Start immediately
startScheduler();

// Watch for mock db settings changes
if (fs.existsSync(DB_FILE)) {
  fs.watchFile(DB_FILE, () => {
    try {
      logger.info('Mock database change detected, checking for schedule updates...');
      startScheduler();
    } catch (err: any) {
      logger.error('Failed to reload scheduler on db change', { error: err.message });
    }
  });
}

logger.info('Dynamic scheduler running. Watching settings for modifications.');
