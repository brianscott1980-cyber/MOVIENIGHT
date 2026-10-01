import { NextResponse } from 'next/server';
import { getMailTransporter, getAdminEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetEmail = searchParams.get('to') || getAdminEmail();

    if (!targetEmail) {
      return NextResponse.json({
        ok: false,
        error: 'No target email provided or ADMIN_NOTIFICATION_EMAIL not configured',
        config: {
          hasSmtpUser: Boolean(process.env.SMTP_USER || process.env.GMAIL_USER),
          hasSmtpPass: Boolean(process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD),
          smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
          smtpPort: process.env.SMTP_PORT || '465',
        },
      }, { status: 400 });
    }

    const transporter = getMailTransporter();
    if (!transporter) {
      return NextResponse.json({
        ok: false,
        error: 'SMTP credentials missing on server. Check SMTP_USER and SMTP_PASS environment variables.',
        config: {
          hasSmtpUser: Boolean(process.env.SMTP_USER || process.env.GMAIL_USER),
          hasSmtpPass: Boolean(process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD),
          smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
          smtpPort: process.env.SMTP_PORT || '465',
        },
      }, { status: 500 });
    }

    // Verify SMTP connection
    console.info(`[Email Diagnostic] Verifying SMTP connection to ${process.env.SMTP_HOST || 'smtp.gmail.com'}...`);
    await transporter.verify();
    console.info('[Email Diagnostic] SMTP connection verified successfully!');

    // Send a test email
    const sender = `"${process.env.SMTP_FROM_NAME || 'Movie Night'}" <${process.env.SMTP_USER || process.env.GMAIL_USER}>`;
    const nowStr = new Date().toISOString();

    const info = await transporter.sendMail({
      from: sender,
      to: targetEmail,
      subject: `🍿 Movie Night Test Email (${nowStr})`,
      html: `
        <div style="font-family: sans-serif; background-color: #080b12; color: #f8fafc; padding: 32px; border-radius: 16px;">
          <h2 style="color: #f59e0b;">🍿 Movie Night SMTP Test</h2>
          <p>This is a test notification confirming that Gmail SMTP is configured properly and delivering messages!</p>
          <ul style="color: #cbd5e1; font-size: 14px;">
            <li><strong>Timestamp:</strong> ${nowStr}</li>
            <li><strong>Recipient:</strong> ${targetEmail}</li>
            <li><strong>Sender:</strong> ${sender}</li>
          </ul>
          <p style="color: #10b981; font-weight: bold;">All systems operational! 🚀</p>
        </div>
      `,
    });

    console.info(`[Email Diagnostic] Test email sent successfully to ${targetEmail}. MessageId: ${info.messageId}`);

    return NextResponse.json({
      ok: true,
      message: `Test email sent successfully to ${targetEmail}`,
      messageId: info.messageId,
      accepted: info.accepted,
      response: info.response,
    });
  } catch (error: any) {
    console.error('[Email Diagnostic] Test email failed:', error);
    return NextResponse.json({
      ok: false,
      error: error?.message || 'Failed to send test email',
      code: error?.code,
      command: error?.command,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    }, { status: 500 });
  }
}
