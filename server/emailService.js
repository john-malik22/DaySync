import dotenv from 'dotenv';
dotenv.config();

/**
 * Brevo Transactional Email Service Utility
 * Safe, zero secret-logging email sender for DaySync
 */
export async function sendBrevoEmail({ to, subject, textContent }) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.MAIL_FROM || 'johnmalik057@gmail.com';

  console.log('[BREVO DIAGNOSTICS] BREVO_API_KEY configured:', !!brevoApiKey);
  console.log('[BREVO DIAGNOSTICS] MAIL_FROM configured:', !!process.env.MAIL_FROM);

  if (!brevoApiKey) {
    console.error('[BREVO EMAIL FAILURE] BREVO_API_KEY is missing in server environment variables.');
    return { success: false, error: 'BREVO_API_KEY is not configured in server environment.' };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey.trim(),
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: 'DaySync',
          email: senderEmail.trim()
        },
        to: [
          {
            email: to.trim()
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
