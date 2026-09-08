import nodemailer from 'nodemailer';

const getMailCredentials = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  
  let user = process.env.SMTP_USER || process.env.SMTP_USERNAME || process.env.MAIL_USER;
  let pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.MAIL_PASS;

  // Filter placeholder settings
  if (user === 'your_email@gmail.com') {
    user = process.env.MAIL_USER;
  }
  if (pass === 'your_app_password') {
    pass = process.env.MAIL_PASS;
  }

  return { host, port, user, pass };
};

const createTransporter = (host: string, port: number, user: string, pass: string) => {
  const config: any = {
    auth: {
      user,
      pass,
    },
  };

  // Optimize transport for Gmail servers using service configuration
  if (host.includes('gmail.com') || user.endsWith('@gmail.com')) {
    config.service = 'gmail';
  } else {
    config.host = host;
    config.port = port;
    config.secure = port === 465;
    config.tls = {
      rejectUnauthorized: false
    };
  }

  return nodemailer.createTransport(config);
};

export const sendVerificationEmail = async (email: string, code: string) => {
  const { host, port, user, pass } = getMailCredentials();

  console.log(`[MAILER] Preparing to send verification code to ${email} using account ${user}...`);

  if (!user || !pass) {
    console.log("=========================================");
    console.log(`[DEV MAILER] NO SMTP SETTINGS DETECTED.`);
    console.log(`[DEV MAILER] Email: ${email}`);
    console.log(`[DEV MAILER] Verification Code: ${code}`);
    console.log("=========================================");
    return { success: true, devMode: true };
  }

  try {
    const transporter = createTransporter(host, port, user, pass);

    const info = await transporter.sendMail({
      from: `"Cognito Authentication" <${user}>`,
      to: email,
      subject: 'Mã xác thực tài khoản Cognito của bạn',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eef2f3; border-radius: 10px;">
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
    return { success: false, error };
  }
};

export const sendPasswordResetEmail = async (email: string, resetLink: string) => {
  const { host, port, user, pass } = getMailCredentials();

  console.log(`[MAILER] Preparing to send password reset link to ${email}...`);

  if (!user || !pass) {
    console.log("=========================================");
    console.log(`[DEV MAILER] NO SMTP SETTINGS DETECTED.`);
    console.log(`[DEV MAILER] Email: ${email}`);
    console.log(`[DEV MAILER] Reset Link: ${resetLink}`);
    console.log("=========================================");
    return { success: true, devMode: true };
  }

  try {
    const transporter = createTransporter(host, port, user, pass);

    const info = await transporter.sendMail({
      from: `"Cognito" <${user}>`,
      to: email,
      subject: 'Đặt lại mật khẩu tài khoản Cognito của bạn',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eef2f3; border-radius: 10px;">
          <h2 style="color: #2d5a3d; text-align: center;">Đặt lại mật khẩu Cognito</h2>
          <p>Chào bạn,</p>
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn vào nút bên dưới để tiếp tục:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="display: inline-block; background-color: #2d5a3d; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;">
              Đặt lại mật khẩu
            </a>
          </div>
          <p style="color: #666; font-size: 13px;">Liên kết này sẽ hết hạn sau <strong>30 phút</strong>. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này — tài khoản của bạn vẫn an toàn.</p>
          <p style="color: #999; font-size: 12px; word-break: break-all;">Hoặc sao chép đường dẫn này vào trình duyệt: <br/>${resetLink}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="text-align: center; color: #999; font-size: 11px;">Cognito © 2026</p>
        </div>
      `,
    });

    console.log(`[MAILER] Password reset email sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[MAILER] Error sending password reset email:', error);
    return { success: false, error };
  }
};

export const sendWarningEmail = async (email: string, name: string, message: string) => {
  const { host, port, user, pass } = getMailCredentials();

  console.log(`[MAILER] Preparing to send warning to ${email} using account ${user}...`);

  if (!user || !pass) {
    console.log("=========================================");
    console.log(`[DEV MAILER] NO SMTP SETTINGS DETECTED.`);
    console.log(`[DEV MAILER] Warning Email: ${email}`);
    console.log(`[DEV MAILER] User Name: ${name}`);
    console.log(`[DEV MAILER] Warning Message: ${message}`);
    console.log("=========================================");
    return { success: true, devMode: true };
  }

  try {
    const transporter = createTransporter(host, port, user, pass);

    const info = await transporter.sendMail({
      from: `"Cognito Admin" <${user}>`,
      to: email,
      subject: '[CẢNH BÁO TÀI KHOẢN] Thông báo từ Quản trị viên Cognito',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #fecaca; border-radius: 12px; background-color: #fffafb;">
          <h2 style="color: #dc2626; text-align: center; margin-top: 0;">CẢNH BÁO HÀNH VI TÀI KHOẢN</h2>
          <p>Xin chào <strong>${name}</strong>,</p>
          <p>Hệ thống Cognito ghi nhận một số hành vi cần lưu ý hoặc vi phạm chính sách sử dụng liên quan đến tài khoản của bạn.</p>
          
          <div style="background-color: #fff5f5; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-weight: bold; color: #991b1b;">Nội dung cảnh báo từ Ban Quản Trị:</p>
            <p style="margin: 10px 0 0 0; color: #7f1d1d; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          
          <p>Vui lòng điều chỉnh hành vi sử dụng hoặc liên hệ lại với Ban quản trị để giải trình nếu đây là một sự nhầm lẫn. Trong trường hợp tiếp tục vi phạm, tài khoản của bạn có thể bị tạm khóa vĩnh viễn.</p>
          <p>Trân trọng,<br/><strong>Ban Quản Trị Hệ Thống Cognito</strong></p>
          <hr style="border: 0; border-top: 1px solid #fee2e2; margin: 25px 0;" />
          <p style="text-align: center; color: #b91c1c; font-size: 11px; font-weight: bold;">Đây là email cảnh báo chính thức từ hệ thống.</p>
        </div>
      `,
    });

    console.log(`[MAILER] Warning email sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[MAILER] Error sending warning email:', error);
    return { success: false, error };
  }
};
