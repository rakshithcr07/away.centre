import { setupWorkers } from './queues';
import { logger } from '../utils/logger';

logger.info('Starting Away Intelligence workers...');
setupWorkers();
