import { Resend } from 'resend';

// Lazy-initialized Resend client — ensures process.env is read at call time,
// not at module-load time (before dotenv has run).
let _resend: Resend | null = null;

const getResendClient = (): Resend => {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('❌ RESEND_API_KEY is not set. Emails will fail.');
    }
    _resend = new Resend(apiKey || 'test_key');
  }
  return _resend;
}

const getFrom = (): string => {
  const fromEmail = process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev';
  const fromName = process.env.EMAIL_FROM_NAME || 'EOTC Bible';
  return `${fromName} <${fromEmail}>`;
}

// Send OTP email
const sendOTPEmail = async (email: string, otp: string, userName: string): Promise<void> => {
  try {
    const result = await getResendClient().emails.send({
      from: getFrom(),
      to: [email],
      subject: '🔐 Verify Your Email - EOTC Bible',
      html: generateOTPEmailHTML(otp, userName),
      text: generateOTPEmailText(otp, userName),
    });

    if (result.error) {
      console.error('❌ Resend API error sending OTP email:', result.error);
      throw new Error(`Resend API error: ${result.error.message}`);
    }
    console.log('✅ OTP email sent successfully to:', email);
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
}

// Send password reset email
const sendPasswordResetEmail = async (email: string, resetUrl: string, userName: string): Promise<void> => {
  try {
    const result = await getResendClient().emails.send({
      from: getFrom(),
      to: [email],
      subject: '🔒 Password Reset Request - EOTC Bible',
      html: generatePasswordResetEmailHTML(resetUrl, userName),
      text: generatePasswordResetEmailText(resetUrl, userName),
    });

    if (result.error) {
      console.error('❌ Resend API error sending password reset email:', result.error);
      throw new Error(`Resend API error: ${result.error.message}`);
    }
    console.log('✅ Password reset email sent successfully to:', email);
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

// Send generic email
const sendEmail = async (to: string, subject: string, html: string, text?: string): Promise<void> => {
  try {
    const result = await getResendClient().emails.send({
      from: getFrom(),
      to: [to],
      subject,
      html,
      ...(text ? { text } : {}),
    });

    if (result.error) {
      console.error('❌ Resend API error sending email:', result.error);
      throw new Error(`Resend API error: ${result.error.message}`);
    }
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

// Verify email configuration
const verifyConnection = async (): Promise<boolean> => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  RESEND_API_KEY not set. Email service unavailable.');
    return false;
  }
  console.log('✅ Email service (Resend) configured successfully');
  console.log(`   From address: ${getFrom()}`);
  return true;
}

// Get configuration type for debugging
const getConfigType = (): string => {
  return 'Resend';
}

// --- HTML Templates ---

const generateOTPEmailHTML = (otp: string, userName: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - EOTC Bible</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%); }
        .container { max-width: 620px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(98,27,31,0.15); }
        .header { background: linear-gradient(135deg, #621b1f 0%, #8b2635 100%); color: white; padding: 40px 30px; text-align: center; position: relative; overflow: hidden; }
        .header::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); animation: shimmer 3s infinite; }
        @keyframes shimmer { 0% { transform: translate(-50%, -50%); } 50% { transform: translate(-30%, -30%); } 100% { transform: translate(-50%, -50%); } }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; position: relative; z-index: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        .header-icon { font-size: 48px; margin-bottom: 10px; position: relative; z-index: 1; }
        .content { padding: 40px 35px; background: #ffffff; }
        .greeting { font-size: 20px; color: #333; margin-bottom: 20px; font-weight: 600; }
        .brand-name { color: #621b1f; font-weight: 700; }
        .otp-container { background: linear-gradient(135deg, #fdf7f7 0%, #fff5f5 100%); border: 3px dashed #621b1f; border-radius: 16px; padding: 35px; text-align: center; margin: 30px 0; box-shadow: inset 0 2px 8px rgba(98,27,31,0.1); }
        .otp-code { font-size: 42px; font-weight: 800; color: #621b1f; letter-spacing: 8px; font-family: 'Courier New', monospace; text-shadow: 0 2px 4px rgba(98,27,31,0.2); }
        .otp-label { font-size: 14px; color: #888; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
        .info-box { background: linear-gradient(135deg, #fff9f9 0%, #fff5f5 100%); border-left: 5px solid #621b1f; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 2px 8px rgba(98,27,31,0.08); }
        .info-box h3 { color: #621b1f; margin: 0 0 15px 0; font-size: 16px; }
        .info-box ul { margin: 0; padding-left: 25px; }
        .info-box li { margin: 10px 0; color: #555; font-size: 15px; }
        .footer { text-align: center; padding: 30px; color: #888; font-size: 13px; background: linear-gradient(180deg, #fafafa 0%, #f0f0f0 100%); border-top: 1px solid #e9ecef; }
        .footer a { color: #621b1f; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-icon">🔐</div>
          <h1>Verify Your Email</h1>
        </div>
        <div class="content">
          <div class="greeting">Hello ${userName},</div>
          <p>Welcome to <span class="brand-name">EOTC Bible</span>! To complete your registration and secure your account, please use the verification code below:</p>

          <div class="otp-container">
            <div class="otp-label">Your Verification Code</div>
            <div class="otp-code">${otp}</div>
          </div>

          <div class="info-box">
            <h3>⚠️ Important Security Notice</h3>
            <ul>
              <li>This code expires in <strong>10 minutes</strong></li>
              <li>Never share this code with anyone</li>
              <li>Our team will never ask for this code</li>
              <li>If you didn't request this, safely ignore this email</li>
            </ul>
          </div>

          <p style="text-align: center; color: #666; font-size: 14px;">
            Having trouble? Copy and paste this code directly into the verification field.
          </p>
        </div>
        <div class="footer">
          <p>This is an automated message from <span class="brand-name">EOTC Bible</span>.</p>
          <p style="margin: 10px 0;">Need help? <a href="mailto:support@eotcbible.com">Contact Support</a></p>
          <p>© 2026 EOTC Bible. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateOTPEmailText(otp: string, userName: string): string {
  return `Email Verification - EOTCOpenSource\n\nHello ${userName},\n\nYour OTP code: ${otp}\n\nThis code expires in 10 minutes. Do not share it.\n\nBest regards,\nThe EOTCOpenSource Team`;
}

function generatePasswordResetEmailHTML(resetUrl: string, userName: string): string {
  const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - EOTC Bible</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%); }
        .container { max-width: 620px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(98,27,31,0.15); }
        .header { background: linear-gradient(135deg, #621b1f 0%, #8b2635 100%); color: white; padding: 40px 30px; text-align: center; position: relative; overflow: hidden; }
        .header::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); animation: shimmer 3s infinite; }
        @keyframes shimmer { 0% { transform: translate(-50%, -50%); } 50% { transform: translate(-30%, -30%); } 100% { transform: translate(-50%, -50%); } }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; position: relative; z-index: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        .header-icon { font-size: 48px; margin-bottom: 10px; position: relative; z-index: 1; }
        .content { padding: 40px 35px; background: #ffffff; }
        .greeting { font-size: 20px; color: #333; margin-bottom: 20px; font-weight: 600; }
        .brand-name { color: #621b1f; font-weight: 700; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #621b1f 0%, #8b2635 100%); color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 20px 0; box-shadow: 0 4px 12px rgba(98,27,31,0.3); }
        .info-box { background: linear-gradient(135deg, #fff9f9 0%, #fff5f5 100%); border-left: 5px solid #621b1f; border-radius: 12px; padding: 25px; margin: 25px 0; }
        .info-box h3 { color: #621b1f; margin: 0 0 15px 0; font-size: 16px; }
        .info-box ul { margin: 0; padding-left: 25px; }
        .info-box li { margin: 10px 0; color: #555; }
        .security-box { background: linear-gradient(135deg, #fff8e1 0%, #fff3cd 100%); border: 2px solid #ffc107; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
        .security-box h3 { color: #856404; margin: 0 0 10px 0; font-size: 16px; }
        .security-box p { color: #856404; margin: 0; }
        .link-box { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin: 20px 0; word-break: break-all; font-size: 13px; color: #621b1f; }
        .footer { text-align: center; padding: 30px; color: #888; font-size: 13px; background: linear-gradient(180deg, #fafafa 0%, #f0f0f0 100%); border-top: 1px solid #e9ecef; }
        .footer a { color: #621b1f; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-icon">🔒</div>
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <div class="greeting">Hello ${userName},</div>
          <p>We received a request to reset the password for your <span class="brand-name">EOTC Bible</span> account.</p>

          <div style="text-align: center; margin: 35px 0;">
            <a href="${resetUrl}" class="cta-button">Reset My Password</a>
          </div>

          <div class="info-box">
            <h3>⏰ Link Expiration</h3>
            <ul>
              <li>This link expires in <strong>15 minutes</strong></li>
              <li>Can only be used <strong>once</strong></li>
              <li>Expires at: <strong>${expiryTime}</strong></li>
            </ul>
          </div>

          <div class="security-box">
            <h3>🛡️ Didn't request this?</h3>
            <p>If you didn't ask to reset your password, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>

          <div class="link-box">Or copy this link: ${resetUrl}</div>
        </div>
        <div class="footer">
          <p>© 2026 EOTC Bible. All rights reserved.</p>
          <p>For security, always check the sender email address.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generatePasswordResetEmailText(resetUrl: string, userName: string): string {
  return `Password Reset - EOTCOpenSource\n\nHello ${userName},\n\nReset your password: ${resetUrl}\n\nThis link expires in 15 minutes.\n\nBest regards,\nThe EOTCOpenSource Team`;
}

// Export as object to maintain backward compatibility with controllers
export const emailService = {
  sendOTPEmail,
  sendPasswordResetEmail,
  sendEmail,
  verifyConnection,
  getConfigType,
};

export default emailService;