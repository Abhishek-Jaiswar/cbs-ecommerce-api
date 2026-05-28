export const resetPasswordOtpTemplate = (otp: string) => `
<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; line-height: 1.5; color: #333;">
  <h2 style="color: #1565c0;">Password Reset</h2>
  <p>Hello,</p>
  <p>We received a request to reset your password. Use the code below to proceed:</p>
  <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1565c0; margin: 20px 0;">
    ${otp}
  </div>
  <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
  <p style="font-size: 12px; color: #999;">&copy; ${new Date().getFullYear()} Zenvoraa India</p>
</div>
`;
