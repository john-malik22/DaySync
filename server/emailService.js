import dotenv from 'dotenv';
dotenv.config();

/**
 * Brevo Transactional Email Service Utility
 * Safe, zero secret-logging email sender for DaySync
 */
export async function sendBrevoEmail({ to, subject, textContent }) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (!brevoApiKey) {
    console.error('[BREVO EMAIL SERVICE ERROR] BREVO_API_KEY is missing in server environment.');
    return { success: false, error: 'BREVO_API_KEY is not configured.' };
  }

  const senderEmail = process.env.MAIL_FROM || 'johnmalik057@gmail.com';

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: 'DaySync',
          email: senderEmail
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

    if (!response.ok) {
      console.error('[BREVO EMAIL SERVICE ERROR] HTTP status:', response.status);
      return { success: false, error: 'Failed to deliver email through Brevo API.' };
    }

    return { success: true };
  } catch (err) {
    console.error('[BREVO EMAIL SERVICE ERROR] Exception during fetch request.');
    return { success: false, error: 'Failed to send email. Network or server error.' };
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
