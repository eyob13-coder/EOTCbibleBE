import { Resend } from 'resend';

// Lazy-initialized Resend client
let _resend: Resend | null = null;

const getResendClient = (): Resend => {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || 'test_key');
  }
  return _resend;
}

export const accountEmail: string = process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailPayload) => {
  try {
    const result = await getResendClient().emails.send({
      from: `${process.env.EMAIL_FROM_NAME || 'EOTCOpenSource'} <${process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev'}>`,
      to: [to],
      subject,
      html,
    });

    if (result.error) {
      console.error('❌ Resend API error:', result.error);
      throw new Error(`Resend API error: ${result.error.message}`);
    }

    console.log('✅ Email sent successfully:', result.data?.id);
    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to send email:', message);
    throw new Error('Email sending failed.');
  }
}
