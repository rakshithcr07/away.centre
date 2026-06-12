import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    if (process.env.NODE_ENV === 'test') return fallback ?? '';
    console.warn(`Warning: ${key} is not set`);
    return '';
  }
  return value;
}

export const config = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: requireEnv('DATABASE_URL', 'postgresql://away:away_dev@localhost:5432/away_intelligence'),
  redisUrl: requireEnv('REDIS_URL', 'redis://localhost:6379'),
  jwtSecret: requireEnv('JWT_SECRET', 'dev-secret-change-me'),
  apiKey: requireEnv('API_KEY', 'dev-api-key'),
  qualifiedScoreThreshold: parseInt(process.env.QUALIFIED_SCORE_THRESHOLD ?? '75', 10),
  signalCollectionCron: process.env.SIGNAL_COLLECTION_CRON ?? '0 */6 * * *',

  openai: {
    apiKey: requireEnv('OPENAI_API_KEY'),
    model: process.env.OPENAI_MODEL ?? 'gpt-4o',
  },

  zoho: {
    clientId: requireEnv('ZOHO_CLIENT_ID'),
    clientSecret: requireEnv('ZOHO_CLIENT_SECRET'),
    refreshToken: requireEnv('ZOHO_REFRESH_TOKEN'),
    apiDomain: process.env.ZOHO_API_DOMAIN ?? 'https://www.zohoapis.com',
  },

  slack: {
    webhookUrl: requireEnv('SLACK_WEBHOOK_URL'),
    botToken: requireEnv('SLACK_BOT_TOKEN'),
  },

  firecrawl: {
    apiKey: requireEnv('FIRECRAWL_API_KEY'),
  },

  newsApi: {
    apiKey: requireEnv('NEWS_API_KEY'),
  },

  email: {
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    user: requireEnv('SMTP_USER'),
    pass: requireEnv('SMTP_PASS'),
    from: process.env.NOTIFICATION_EMAIL_FROM ?? 'alerts@away.center',
    to: process.env.NOTIFICATION_EMAIL_TO ?? 'sales@away.center',
  },

  supportedCities: ['Bangalore', 'Bengaluru', 'Vizag', 'Visakhapatnam', 'Kolkata'],
  supportedCountries: ['India', 'IN'],
  scoring: {
    fitWeight: parseFloat(process.env.SCORING_FIT_WEIGHT ?? '0.4'),
    intentWeight: parseFloat(process.env.SCORING_INTENT_WEIGHT ?? '0.4'),
    timingWeight: parseFloat(process.env.SCORING_TIMING_WEIGHT ?? '0.2'),
  },
} as const;
