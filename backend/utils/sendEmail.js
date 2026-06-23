import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

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
  `

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      email,
    subject: `${otp} - Your RecoSolution verification code`,
    html,
  })
}

// ── Send Password Reset OTP Email (matches Forgot Password design) ──
const sendResetOTPEmail = async (email, name, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: #15803d; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">RecoSolution</h1>
      </div>
      <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px;">
        <h2 style="color: #0f172a; margin-bottom: 8px;">Hi ${name}!</h2>
        <p style="color: #64748b; margin-bottom: 24px;">
          Use the code below to reset your password. It expires in 10 minutes.
        </p>
        <div style="background: white; border: 2px solid #15803d; border-radius: 12px;
                    padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="font-size: 36px; font-weight: 700; letter-spacing: 8px;
                    color: #15803d; margin: 0;">${otp}</p>
        </div>
        <p style="color: #94a3b8; font-size: 13px;">
          If you didn't request this, ignore this email — your password will not change.
        </p>
      </div>
    </div>
  `

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      email,
    subject: `${otp} - Reset your RecoSolution password`,
    html,
  })
}

export { sendOTPEmail, sendResetOTPEmail };
