import { logger } from '../utils/logger';

export const pipelineQueue = {
  add: async (name: string, data: any) => {
    logger.info(`Mock pipelineQueue.add called: ${name}`);
    // Run pipeline task in-memory asynchronously
    setTimeout(async () => {
      try {
        logger.info('Starting async background pipeline execution (mock)...');
        const { runPipeline } = await import('../services/pipeline/pipeline-orchestrator');
        await runPipeline();
        logger.info('Async background pipeline execution complete (mock).');
      } catch (err: any) {
        logger.error('Mock pipeline failed', { error: err.message });
      }
    }, 100);
    return { id: 'mock-job-pipeline' };
  },
} as any;

export const crmRetryQueue = {
  add: async (name: string, data: any) => {
    logger.info(`Mock crmRetryQueue.add called: ${name}`);
    setTimeout(async () => {
      try {
        logger.info('Starting async background CRM sync (mock)...');
        const { syncQualifiedLeadsToCRM } = await import('../services/crm/zoho-bigin');
        await syncQualifiedLeadsToCRM();
        logger.info('Async background CRM sync complete (mock).');
      } catch (err: any) {
        logger.error('Mock CRM sync failed', { error: err.message });
      }
    }, 100);
    return { id: 'mock-job-crm' };
  },
} as any;

export function setupWorkers(): void {
  logger.info('Workers started (Mock Queue Mode)');
}

export async function enqueuePipeline(): Promise<void> {
  await pipelineQueue.add('run', {});
}

export async function enqueueCrmRetry(companyId: string): Promise<void> {
  await crmRetryQueue.add('retry', { companyId });
}
