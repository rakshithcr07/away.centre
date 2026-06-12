import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export interface AuthRequest extends Request {
  userRole?: string;
}

export function apiKeyAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey || apiKey !== config.apiKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

export function roleAuth(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const role = (req.headers['x-user-role'] as string) ?? 'viewer';
    if (!roles.includes(role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    req.userRole = role;
    next();
  };
}
