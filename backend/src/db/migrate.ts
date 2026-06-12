import fs from 'fs';
import path from 'path';
import { pool } from './pool';
import { logger } from '../utils/logger';

async function migrate() {
  const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  logger.info('Running database migration...');
  await pool.query(sql);
  logger.info('Migration completed successfully');
  await pool.end();
}

migrate().catch((err) => {
  logger.error('Migration failed', { error: err.message });
  process.exit(1);
});
