import crypto from 'crypto';

export function hashContent(...parts: string[]): string {
  return crypto
    .createHash('sha256')
    .update(parts.join('|'))
    .digest('hex');
}
