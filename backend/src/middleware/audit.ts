import { Response, NextFunction } from 'express';
import { query } from '../db/pool';
import { AuthRequest } from './auth';

export function auditLog(action: string, entityType: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);
    res.json = function (body: unknown) {
      query(
        `INSERT INTO audit_logs (action, entity_type, entity_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          action,
          entityType,
          req.params.id ?? null,
          JSON.stringify({ method: req.method, path: req.path }),
          req.ip,
        ]
      ).catch(() => {});
      return originalJson(body);
    };
    next();
  };
}
