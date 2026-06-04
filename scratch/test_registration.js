import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:8000/api/v1';
const LOG_FILE_PATH = path.join(process.cwd(), 'logs', 'app.log');

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTest() {
  const email = `testuser_${Date.now()}@example.com`;
  const name = 'Test Verification User';
  const password = 'password123';

  console.log(`\n--- [1] REGISTERING USER: ${email} ---`);
  const regResponse = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  const regResult = await regResponse.json();
  console.log('Register status:', regResponse.status);
  console.log('Register body:', regResult);

  if (!regResult.success) {
    console.error('Registration failed');
    process.exit(1);
  }

  console.log('\nWaiting 2 seconds for logs to write and email OTP to generate...');
  await wait(2000);

  console.log(`\n--- [2] READING LOGS TO RETRIEVE OTP FOR: ${email} ---`);
  if (!fs.existsSync(LOG_FILE_PATH)) {
    console.error(`Log file not found at ${LOG_FILE_PATH}`);
    process.exit(1);
  }

  const logContent = fs.readFileSync(LOG_FILE_PATH, 'utf-8');
  const lines = logContent.split('\n');
  let otp = null;

  // Search lines from bottom up
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (line.includes('[DEBUG OTP] Email Verification OTP for') && line.includes(email)) {
      const match = line.match(/OTP for [^:]+:\s*(\d{6})/);
      if (match) {
        otp = match[1];
        break;
      }
    }
  }

  if (!otp) {
    console.error(`Could not find verification OTP in logs for ${email}`);
    process.exit(1);
  }

  console.log(`Found OTP code in logs: ${otp}`);

  console.log(`\n--- [3] VERIFYING EMAIL VIA OTP ---`);
  const verifyResponse = await fetch(`${API_BASE}/auth/email-verification/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });

  const verifyResult = await verifyResponse.json();
  console.log('Verify status:', verifyResponse.status);
  console.log('Verify body:', verifyResult);

  if (!verifyResult.success) {
    console.error('Email verification failed');
    process.exit(1);
  }

  console.log(`\n--- [4] TRYING TO LOG IN ---`);
  const loginResponse = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const loginResult = await loginResponse.json();
  console.log('Login status:', loginResponse.status);
  console.log('Login body:', loginResult);

  // Check for JWT cookies set in headers
  const setCookieHeader = loginResponse.headers.get('set-cookie');
  console.log('Set-Cookie Headers:', setCookieHeader);

  if (loginResult.success && loginResult.data.emailVerified) {
    console.log('\n🎉 SUCCESS: All steps passed! User registered, OTP verified, and logged in successfully.');
  } else {
    console.error('\n❌ FAILURE: Login response indicates user email was not verified or login failed.');
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('Unexpected error running integration test:', err);
  process.exit(1);
});
