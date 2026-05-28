export const verifyEmailOtpTemplate = (otp: string) => {
  return `
<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; line-height: 1.5; color: #333;">
  <h2 style="color: #1565c0;">Verify Your Email</h2>
  <p>Hello,</p>
  <p>Use the code below to verify your email address:</p>
  <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1565c0; margin: 20px 0;">
    ${otp}
  </div>
  <p style="color: #666; font-size: 14px;">This code expires soon. If you didn't create an account, you can safely ignore this email.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
  <p style="font-size: 12px; color: #999;">&copy; ${new Date().getFullYear()} Zenvoraa India</p>
</div>
`;
};
