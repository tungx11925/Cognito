import nodemailer from 'nodemailer';

export const sendVerificationEmail = async (email: string, code: string) => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER || process.env.MAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.MAIL_PASS;

  console.log(`[MAILER] Preparing to send code ${code} to ${email} using account ${user}...`);

  if (!host || !user || !pass) {
    console.log("=========================================");
    console.log(`[DEV MAILER] NO SMTP SETTINGS DETECTED.`);
    console.log(`[DEV MAILER] Email: ${email}`);
    console.log(`[DEV MAILER] Verification Code: ${code}`);
    console.log("=========================================");
    return { success: true, devMode: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"Cognito Authentication" <${user}>`,
      to: email,
      subject: 'Mã xác thực tài khoản Cognito của bạn',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eef2f3; rounded: 10px;">
          <h2 style="color: #2d5a3d; text-align: center;">Xác thực tài khoản Cognito</h2>
          <p>Chào bạn,</p>
          <p>Bạn vừa thực hiện đăng nhập hoặc kích hoạt xác thực 2 bước. Dưới đây là mã xác thực của bạn:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2d5a3d; background: #eef8f0; padding: 10px 20px; border-radius: 8px; border: 1px dashed #2d5a3d;">
              ${code}
            </span>
          </div>
          <p style="color: #666; font-size: 13px;">Mã xác thực này sẽ hết hạn trong vòng 10 phút. Nếu bạn không thực hiện hành động này, vui lòng bỏ qua email này.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="text-align: center; color: #999; font-size: 11px;">Cognito © 2026</p>
        </div>
      `,
    });

    console.log(`[MAILER] Email sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[MAILER] Error sending email:', error);
    // Even if sending fails, we don't throw to prevent crashing the server
    return { success: false, error };
  }
};
