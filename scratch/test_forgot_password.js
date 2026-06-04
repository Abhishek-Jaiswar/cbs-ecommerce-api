import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:8000/api/v1';
const LOG_FILE_PATH = path.join(process.cwd(), 'logs', 'app.log');

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTest() {
  const email = `resetuser_${Date.now()}@example.com`;
  const name = 'Test Reset User';
  const oldPassword = 'password123';
  const newPassword = 'newpassword789';

  console.log(`\n--- [1] REGISTERING USER: ${email} ---`);
  const regResponse = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password: oldPassword }),
  });
  const regResult = await regResponse.json();
  console.log('Register status:', regResponse.status);

  console.log('\nWaiting 2 seconds for logs to write and email OTP to generate...');
  await wait(2000);

  // Retrieve verification OTP
  const logContentBefore = fs.readFileSync(LOG_FILE_PATH, 'utf-8');
  let match = logContentBefore.match(new RegExp(`Email Verification OTP for ${email}:\\s*(\\d{6})`));
  if (!match) {
    console.error('Could not find verification OTP in logs');
    process.exit(1);
  }
  const verifyOtp = match[1];
  console.log('Verification OTP:', verifyOtp);

  // Verify email so account is active
  await fetch(`${API_BASE}/auth/email-verification/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp: verifyOtp }),
  });
  console.log('Email verified successfully.');

  console.log(`\n--- [2] REQUESTING PASSWORD RESET FOR: ${email} ---`);
  const requestResponse = await fetch(`${API_BASE}/auth/forgot-password/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const requestResult = await requestResponse.json();
  console.log('Request reset status:', requestResponse.status);
  console.log('Request reset body:', requestResult);

  console.log('\nWaiting 2 seconds for logs to write reset OTP...');
  await wait(2000);

  console.log(`\n--- [3] READING LOGS TO RETRIEVE RESET OTP ---`);
  const logContentAfter = fs.readFileSync(LOG_FILE_PATH, 'utf-8');
  const lines = logContentAfter.split('\n');
  let resetOtp = null;

  // Search lines from bottom up
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (line.includes('[DEBUG OTP] Password Reset OTP for') && line.includes(email)) {
      const matchReset = line.match(/OTP for [^:]+:\s*(\d{6})/);
      if (matchReset) {
        resetOtp = matchReset[1];
        break;
      }
    }
  }

  if (!resetOtp) {
    console.error(`Could not find password reset OTP in logs for ${email}`);
    process.exit(1);
  }
  console.log(`Found reset OTP code in logs: ${resetOtp}`);

  console.log(`\n--- [4] VERIFYING RESET OTP ---`);
  const verifyResetResponse = await fetch(`${API_BASE}/auth/forgot-password/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp: resetOtp }),
  });
  const verifyResetResult = await verifyResetResponse.json();
  console.log('Verify reset status:', verifyResetResponse.status);
  console.log('Verify reset body:', verifyResetResult);

  if (!verifyResetResult.success) {
    console.error('Reset OTP verification failed');
    process.exit(1);
  }

  console.log(`\n--- [5] RESETTING PASSWORD TO: ${newPassword} ---`);
  const resetResponse = await fetch(`${API_BASE}/auth/forgot-password/reset-password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, newPassword }),
  });
  const resetResult = await resetResponse.json();
  console.log('Reset password status:', resetResponse.status);
  console.log('Reset password body:', resetResult);

  if (!resetResult.success) {
    console.error('Password reset failed');
    process.exit(1);
  }

  console.log(`\n--- [6] TESTING LOGIN WITH NEW PASSWORD ---`);
  const loginResponse = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: newPassword }),
  });
  const loginResult = await loginResponse.json();
  console.log('Login status:', loginResponse.status);
  console.log('Login body:', loginResult);

  if (loginResult.success) {
    console.log('\n🎉 SUCCESS: Forgot Password workflow fully verified on the backend!');
  } else {
    console.error('\n❌ FAILURE: Could not log in with the reset password.');
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('Unexpected error during test execution:', err);
  process.exit(1);
});
