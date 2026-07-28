import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const requiredEnvironmentKeys = [
  'BASE_URL',
  'LOGIN_EMAIL',
  'LOGIN_PASSWORD',
  'UPLOAD_FILE_PATH',
] as const;

for (const key of requiredEnvironmentKeys) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export default defineConfig({
  testDir: './Tests',
  timeout: 120_000,

  expect: {
    timeout: 15000,
  },

  fullyParallel: false,

  reporter: 'list',

  use: {
    baseURL: process.env.BASE_URL,

    // Local = headed, GitHub Actions = headless
    headless: !!process.env.CI,

    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});