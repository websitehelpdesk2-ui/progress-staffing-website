const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const SES_REGION = String(process.env.AWS_SES_REGION || process.env.AWS_REGION || 'us-east-2').trim() || 'us-east-2';
const SES_FROM_EMAIL = String(process.env.SES_FROM_EMAIL || 'onboarding@progressstaffingagency.com').trim();
const AWS_ACCESS_KEY_ID = String(process.env.AWS_ACCESS_KEY_ID || '').trim();
const AWS_SECRET_ACCESS_KEY = String(process.env.AWS_SECRET_ACCESS_KEY || '').trim();
const AWS_SESSION_TOKEN = String(process.env.AWS_SESSION_TOKEN || '').trim();

const sesClient = new SESClient({
  region: SES_REGION,
  credentials: AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
        sessionToken: AWS_SESSION_TOKEN || undefined,
      }
    : undefined,
});

function isEmailServiceConfigured() {
  return Boolean(SES_FROM_EMAIL && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY);
}

function normalizeAddresses(to) {
  if (Array.isArray(to)) {
    return to.map((item) => String(item || '').trim()).filter(Boolean);
  }
  const single = String(to || '').trim();
  return single ? [single] : [];
}

async function sendNotificationEmail(options = {}) {
  const toAddresses = normalizeAddresses(options.to);
  const subject = String(options.subject || '').trim();
  const text = String(options.text || '').trim();
  const html = String(options.html || '').trim();

  if (!toAddresses.length) {
    return { skipped: true, reason: 'missing-recipient' };
  }

  if (!subject) {
    throw new Error('SES email send failed: missing subject');
  }

  if (!isEmailServiceConfigured()) {
    throw new Error('SES email service is not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and SES_FROM_EMAIL.');
  }

  const command = new SendEmailCommand({
    Source: SES_FROM_EMAIL,
    Destination: { ToAddresses: toAddresses },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: {
        Text: { Data: text || html.replace(/<[^>]*>/g, ' '), Charset: 'UTF-8' },
        Html: { Data: html || `<p>${text}</p>`, Charset: 'UTF-8' },
      },
    },
  });

  try {
    const result = await sesClient.send(command);
    return { sent: true, messageId: result && result.MessageId ? result.MessageId : null };
  } catch (error) {
    console.error('SES send failed:', {
      region: SES_REGION,
      source: SES_FROM_EMAIL,
      to: toAddresses,
      subject,
      error: error && error.message ? error.message : String(error),
    });
    throw error;
  }
}

async function sendPasswordResetEmail(options = {}) {
  return sendNotificationEmail(options);
}

async function sendOnboardingReminderEmail(options = {}) {
  return sendNotificationEmail(options);
}

async function sendSesTestEmail(toAddress) {
  return sendNotificationEmail({
    to: toAddress,
    subject: 'Progress Staffing SES Test Email',
    text: 'This is a test email sent via Amazon SES (us-east-2).',
    html: '<p>This is a test email sent via Amazon SES (us-east-2).</p>',
  });
}

module.exports = {
  isEmailServiceConfigured,
  sendPasswordResetEmail,
  sendOnboardingReminderEmail,
  sendNotificationEmail,
  sendSesTestEmail,
};
