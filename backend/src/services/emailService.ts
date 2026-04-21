import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: Number(process.env.SMTP_PORT) || 2525,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send email notification
 */
export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: '"ARAS Platform" <no-reply@aras.ai>',
      to,
      subject,
      html,
    });
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Email send failure:', error);
    // Continue even if email fails to not block application logic in dev
  }
};

/**
 * Templates
 */
export const sendUpgradeRequestEmail = async (adminEmail: string, userEmail: string, message?: string) => {
  const subject = 'New Premium Upgrade Request';
  const html = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>New Upgrade Request</h2>
      <p><strong>User:</strong> ${userEmail}</p>
      <p><strong>Message:</strong> ${message || 'No additional note.'}</p>
      <p><a href="${process.env.FRONTEND_URL}/admin/notifications" style="padding: 10px 20px; background: #D4AF37; color: white; text-decoration: none; border-radius: 5px;">View Request</a></p>
    </div>
  `;
  return sendEmail(adminEmail, subject, html);
};

export const sendApprovalEmail = async (userEmail: string) => {
  const subject = 'Your ARAS Account has been Upgraded!';
  const html = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>Congratulations!</h2>
      <p>Your account has been upgraded to <strong>Premium</strong>.</p>
      <p>You now have unlimited access to all AI features, advanced insights, and research tools.</p>
      <p><a href="${process.env.FRONTEND_URL}/dashboard" style="padding: 10px 20px; background: #D4AF37; color: white; text-decoration: none; border-radius: 5px;">Go to Dashboard</a></p>
    </div>
  `;
  return sendEmail(userEmail, subject, html);
};

export const sendRejectionEmail = async (userEmail: string) => {
  const subject = 'Update on your Upgrade Request';
  const html = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>Upgrade Request Status</h2>
      <p>We have reviewed your request for a Premium upgrade.</p>
      <p>Unfortunately, we cannot process your upgrade at this time.</p>
      <p>If you have any questions, please contact our support team.</p>
    </div>
  `;
  return sendEmail(userEmail, subject, html);
};
