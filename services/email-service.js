const postmark = require('postmark');

const POSTMARK_SERVER_TOKEN = String(process.env.POSTMARK_SERVER_TOKEN || '').trim();
const EMAIL_FROM = String(process.env.EMAIL_FROM || 'onboarding@progressstaffingagency.com').trim();
const EMAIL_REPLY_TO = String(process.env.EMAIL_REPLY_TO || 'onboarding@progressstaffingagency.com').trim();

const postmarkClient = POSTMARK_SERVER_TOKEN ? new postmark.ServerClient(POSTMARK_SERVER_TOKEN) : null;

function isEmailServiceConfigured() {
  return Boolean(postmarkClient && EMAIL_FROM && EMAIL_REPLY_TO);
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
  const replyTo = String(options.replyTo || EMAIL_REPLY_TO).trim();
  const logContext = String(options.logContext || '').trim() || 'transactional_email';
  const logDetails = {
    logContext,
    from: EMAIL_FROM,
    replyTo,
    to: toAddresses,
    subject,
  };

  if (!toAddresses.length) {
    return { skipped: true, reason: 'missing-recipient' };
  }

  if (!subject) {
    throw new Error('Postmark email send failed: missing subject');
  }

  if (!isEmailServiceConfigured()) {
    throw new Error('Postmark email service is not configured. Set POSTMARK_SERVER_TOKEN, EMAIL_FROM, and EMAIL_REPLY_TO.');
  }

  try {
    console.info('Postmark send attempted', logDetails);
    const result = await postmarkClient.sendEmail({
      From: EMAIL_FROM,
      To: toAddresses.join(','),
      ReplyTo: replyTo || undefined,
      Subject: subject,
      TextBody: text || html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
      HtmlBody: html || `<p>${text}</p>`,
      MessageStream: 'outbound',
    });
    const response = {
      sent: true,
      messageId: result && Object.prototype.hasOwnProperty.call(result, 'MessageID') ? result.MessageID : null,
      submittedAt: result && Object.prototype.hasOwnProperty.call(result, 'SubmittedAt') ? result.SubmittedAt : null,
      to: toAddresses,
    };
    console.info('Postmark response received', {
      ...logDetails,
      messageId: response.messageId,
      submittedAt: response.submittedAt,
    });
    return response;
  } catch (error) {
    console.error('Postmark send failed:', {
      ...logDetails,
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

async function sendPostmarkTestEmail(options = {}) {
  const toAddress = String(options.to || '').trim();
  const subject = String(options.subject || 'Progress Staffing Postmark Test Email').trim();
  const text = String(options.text || 'This is a test email sent via Postmark.').trim();
  const html = String(options.html || '<p>This is a test email sent via Postmark.</p>').trim();

  return sendNotificationEmail({
    to: toAddress,
    subject,
    text,
    html,
  });
}

module.exports = {
  isEmailServiceConfigured,
  sendPasswordResetEmail,
  sendOnboardingReminderEmail,
  sendNotificationEmail,
  sendPostmarkTestEmail,
};
