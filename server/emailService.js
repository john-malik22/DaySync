import dotenv from 'dotenv';
dotenv.config();

/**
 * Brevo Transactional Email Service Utility
 * Safe, zero secret-logging email sender for DaySync
 */
function extractCleanEmail(raw) {
  if (!raw) return '';
  const match = String(raw).match(/<([^>]+)>/);
  const emailCandidate = match ? match[1] : String(raw);
  return emailCandidate.replace(/["']/g, '').trim().toLowerCase();
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

export async function sendBrevoEmail({ to, subject, textContent }) {
  const rawApiKey = process.env.BREVO_API_KEY;
  const rawMailFrom = process.env.MAIL_FROM;

  console.log('[BREVO DIAGNOSTICS] BREVO_API_KEY configured:', !!rawApiKey);
  console.log('[BREVO DIAGNOSTICS] MAIL_FROM configured:', !!rawMailFrom);

  if (!rawApiKey) {
    console.error('[BREVO EMAIL FAILURE] BREVO_API_KEY is missing in server environment variables.');
    return { success: false, error: 'BREVO_API_KEY is not configured in server environment.' };
  }

  const cleanApiKey = String(rawApiKey).trim();
  const extractedSender = extractCleanEmail(rawMailFrom) || 'johnmalik057@gmail.com';

  if (!isValidEmail(extractedSender)) {
    console.error(`[BREVO EMAIL FAILURE] Invalid MAIL_FROM email format: "${extractedSender}"`);
    return { success: false, error: `Invalid MAIL_FROM sender email: ${extractedSender}` };
  }

  const cleanRecipient = extractCleanEmail(to);
  if (!isValidEmail(cleanRecipient)) {
    console.error(`[BREVO EMAIL FAILURE] Invalid recipient email format: "${cleanRecipient}"`);
    return { success: false, error: `Invalid recipient email: ${cleanRecipient}` };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': cleanApiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: 'DaySync',
          email: extractedSender
        },
        to: [
          {
            email: cleanRecipient
          }
        ],
        subject: subject,
        textContent: textContent
      })
    });

    const resData = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(`[BREVO EMAIL FAILURE] HTTP Status: ${response.status}`);
      console.error(`[BREVO EMAIL FAILURE] Response Details:`, resData.code || resData.message || JSON.stringify(resData));
      return { success: false, status: response.status, error: resData.message || 'Brevo API rejected email request.' };
    }

    console.log(`[BREVO EMAIL ACCEPTED] Message ID:`, resData.messageId || 'Success');
    return { success: true, messageId: resData.messageId };
  } catch (err) {
    console.error('[BREVO EMAIL EXCEPTION] Request failed:', err.message);
    return { success: false, error: err.message };
  }
}

export async function sendVerificationEmail({ to, otp }) {
  const textContent = `Your DaySync verification code is:\n\n${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not create this account, you can ignore this email.`;
  return await sendBrevoEmail({
    to,
    subject: 'Verify your DaySync account',
    textContent
  });
}

export async function sendPasswordResetEmail({ to, otp }) {
  const textContent = `Your DaySync password reset code is:\n\n${otp}\n\nThis code expires in 10 minutes.`;
  return await sendBrevoEmail({
    to,
    subject: 'Reset your DaySync password',
    textContent
  });
}
