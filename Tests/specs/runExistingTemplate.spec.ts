import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../pages/login.page';
import { PipelinePage } from '../pages/pipeline.page';
import { RunTemplatePage } from '../pages/runTemplate.page';

test('run an existing template from the dashboard', async ({ page }) => {
  const email = process.env.LOGIN_EMAIL;
  const password = process.env.LOGIN_PASSWORD;

  if (!email || !password) {
    throw new Error('LOGIN_EMAIL and LOGIN_PASSWORD must be available at test runtime.');
  }

  const templateRecordPath = path.join(process.cwd(), 'Tests', 'data', 'lastTemplate.json');
  if (!fs.existsSync(templateRecordPath)) {
    throw new Error(`No saved template found at ${templateRecordPath}. Run pipeline.spec.ts first.`);
  }
  const { templateName } = JSON.parse(fs.readFileSync(templateRecordPath, 'utf-8'));
  console.log(`Using template from previous run: ${templateName}`);

  const loginPage = new LoginPage(page);
  const pipelinePage = new PipelinePage(page);
  const runTemplatePage = new RunTemplatePage(page);

  console.log('Step 1: opening the dashboard login page');
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  if (await page.getByRole('button', { name: /accept|allow|consent/i }).first().isVisible().catch(() => false)) {
    console.log('Accepting cookie banner if it is visible');
    await page.getByRole('button', { name: /accept|allow|consent/i }).first().click();
  }

  await loginPage.expectVisible();
  console.log('Step 2: logging into the dashboard');
  await loginPage.login(email, password);
  await expect(page.getByRole('navigation', { name: 'Desktop' })).toBeVisible({ timeout: 30_000 });

  console.log('Step 3: navigating to the run pipeline screen');
  await pipelinePage.open();
  await pipelinePage.expectVisible();

  console.log('Step 4: opening the existing template picker');
  await runTemplatePage.openExistingTemplatePicker();

  console.log('Step 5: selecting the template');
  await runTemplatePage.selectTemplate(templateName);

  console.log('Step 6: running the selected pipeline');
  await runTemplatePage.runPipeline();
});