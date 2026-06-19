import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Send OTP Email ───────────────────────────────────────
const sendOTPEmail = async (email, name, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: #15803d; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">RecoSolution</h1>
      </div>
      <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px;">
        <h2 style="color: #0f172a; margin-bottom: 8px;">Hi ${name}!</h2>
        <p style="color: #64748b; margin-bottom: 24px;">
          Use the code below to verify your email address. It expires in 10 minutes.
        </p>
        <div style="background: white; border: 2px solid #15803d; border-radius: 12px;
                    padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="font-size: 36px; font-weight: 700; letter-spacing: 8px;
                    color: #15803d; margin: 0;">${otp}</p>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">
          If you didn't create an account, ignore this email.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `${otp} - Your RecoSolution verification code`,
    html,
  });
};

// ── Send Password Reset Email ────────────────────────────
const sendPasswordResetEmail = async (email, name, resetUrl) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: #15803d; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">RecoSolution</h1>
      </div>
      <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px;">
        <h2 style="color: #0f172a; margin-bottom: 8px;">Hi ${name}!</h2>
        <p style="color: #64748b; margin-bottom: 24px;">
          Click the button below to reset your password. Link expires in 15 minutes.
        </p>
        <a href="${resetUrl}"
           style="display: block; background: #15803d; color: white; text-decoration: none;
                  padding: 14px; border-radius: 10px; text-align: center;
                  font-weight: 600; font-size: 15px; margin-bottom: 24px;">
          Reset Password
        </a>
        <p style="color: #94a3b8; font-size: 13px;">
          If you didn't request this, ignore this email.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'RecoSolution - Password Reset Request',
    html,
  });
};

export { sendOTPEmail, sendPasswordResetEmail };
