import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../pages/login.page';
import { PipelinePage } from '../pages/pipeline.page';

test('configure a pipeline and save it as a new template', async ({ page }) => {
  const email = process.env.LOGIN_EMAIL;
  const password = process.env.LOGIN_PASSWORD;
  const uploadFilePath = process.env.UPLOAD_FILE_PATH;

  if (!email || !password || !uploadFilePath) {
    throw new Error('LOGIN_EMAIL, LOGIN_PASSWORD, and UPLOAD_FILE_PATH must be available at test runtime.');
  }

  const loginPage = new LoginPage(page);
  const pipelinePage = new PipelinePage(page);

  console.log('Step 1: opening the dashboard login page');
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await loginPage.expectVisible();

  console.log('Step 2: logging in');
  await loginPage.login(email, password);
  await expect(page.getByRole('navigation', { name: 'Desktop' })).toBeVisible();

  console.log('Step 3: navigating to Run Pipeline');
  await pipelinePage.open();
  await pipelinePage.expectVisible();

  console.log('Step 4: configuring basic pipeline details');
  await pipelinePage.configureBasicDetails();

  console.log('Step 5: selecting the preset configuration');
  await pipelinePage.selectPreset();

  console.log('Step 6: uploading the validation video');
  await pipelinePage.uploadFile(uploadFilePath);

  console.log('Step 7: selecting the first video data option');
  await pipelinePage.selectFirstVideoDataCheckbox();

  console.log('Step 8: saving as a new template');
  const templateName = await pipelinePage.saveAsTemplate();

  const templateRecordPath = path.join(process.cwd(), 'Tests', 'data', 'lastTemplate.json');
  fs.mkdirSync(path.dirname(templateRecordPath), { recursive: true });
  fs.writeFileSync(templateRecordPath, JSON.stringify({ templateName }), 'utf-8');
  console.log(`Saved template name for reuse: ${templateName}`);
});