import nodemailer from 'nodemailer';
import { config } from '../../config';
import { logger } from '../../utils/logger';

const transporter = config.email.user
  ? nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: false,
      auth: { user: config.email.user, pass: config.email.pass },
    })
  : null;

export async function sendEmailNotification(
  subject: string,
  html: string
): Promise<void> {
  if (!transporter) {
    logger.info('Email not configured, logging instead', { subject });
    return;
  }

  await transporter.sendMail({
    from: config.email.from,
    to: config.email.to,
    subject,
    html,
  });

  logger.info('Email notification sent', { subject });
}

export async function sendQualifiedLeadsEmail(
  leads: Array<{ name: string; score: number; city: string | null }>
): Promise<void> {
  const html = `
    <h2>Away Intelligence — Qualified Leads</h2>
    <p>${leads.length} new qualified leads identified:</p>
    <table border="1" cellpadding="8" cellspacing="0">
      <tr><th>Company</th><th>City</th><th>Score</th></tr>
      ${leads.map((l) => `<tr><td>${l.name}</td><td>${l.city ?? 'N/A'}</td><td>${l.score}</td></tr>`).join('')}
    </table>
  `;

  await sendEmailNotification('Away Intelligence — New Qualified Leads', html);
}
