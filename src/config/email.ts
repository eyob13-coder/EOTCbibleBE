import { Resend } from 'resend';

export const accountEmail: string = process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev';

// Lazy-initialized Resend client
let _resend: Resend | null = null;

const getResendClient = (): Resend => {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || 'test_key');
  }
  return _resend;
}

// Resend-compatible transporter wrapper for backward compatibility
const transporter = {
  sendMail: async (mailOptions: { from?: string; to: string; subject: string; html?: string; text?: string }) => {
    const result = await getResendClient().emails.send({
      from: mailOptions.from || `${process.env.EMAIL_FROM_NAME || 'EOTCOpenSource'} <${process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev'}>`,
      to: [mailOptions.to],
      subject: mailOptions.subject,
      html: mailOptions.html || '',
    });

    if (result.error) {
      console.error('❌ Resend API error:', result.error);
      throw new Error(`Resend API error: ${result.error.message}`);
    }

    return { messageId: result.data?.id || 'resend-message' };
  }
};

export default transporter;
