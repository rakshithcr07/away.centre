import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dashboardRoutes from './routes/dashboard';
import companiesRoutes from './routes/companies';
import signalsRoutes from './routes/signals';
import salesQueueRoutes from './routes/sales-queue';
import actionsRoutes from './routes/actions';
import { apiKeyAuth } from './middleware/auth';
import { logger } from './utils/logger';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', apiKeyAuth);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/signals', signalsRoutes);
app.use('/api/sales-queue', salesQueueRoutes);
app.use('/api', actionsRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
