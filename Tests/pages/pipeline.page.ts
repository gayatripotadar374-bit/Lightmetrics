import { expect, type Locator, type Page } from '@playwright/test';

export class PipelinePage {
  private readonly page: Page;
  private readonly runPipelineNav: Locator;
  private readonly pipelineForm: Locator;
  private readonly singleTypeOption: Locator;
  private readonly descriptionInput: Locator;
  private readonly sourceReferenceInput: Locator;
  private readonly sourceModelPathInput: Locator;
  private readonly presetInput: Locator;
  private readonly fileInput: Locator;
  private readonly videoDataSection: Locator;
  private readonly saveTemplateButton: Locator;

  public constructor(page: Page) {
    this.page = page;
    this.runPipelineNav = page.getByText('Run Pipeline', { exact: true }).first();
    this.pipelineForm = page.getByRole('main').getByText('Run Pipeline', { exact: true }).first();
    this.singleTypeOption = page.getByLabel(/single/i).first();
    this.descriptionInput = page.locator('textarea').first();
    this.sourceReferenceInput = page.getByLabel(/select source reference/i).first();
    this.sourceModelPathInput = page.locator('#gitSourceModelPath');
    this.presetInput = page.getByLabel(/select preset configuration/i).first();
    this.fileInput = page.locator('input[type="file"]').first();
    this.videoDataSection = page.getByText(/step 5:\s*video data selection \(trips & events\)/i).first();
    this.saveTemplateButton = page.getByRole('button', { name: /save as new template/i }).first();
  }

  public async open(): Promise<void> {
    await expect(this.runPipelineNav).toBeVisible();
    await this.runPipelineNav.click();
    await this.page.waitForLoadState('networkidle');
  }

  public async expectVisible(): Promise<void> {
    await expect(this.pipelineForm).toBeVisible();
  }

  public async configureBasicDetails(): Promise<void> {
    await expect(this.singleTypeOption).toBeVisible();
    await this.singleTypeOption.check();

    await expect(this.descriptionInput).toBeVisible();
    await this.descriptionInput.fill('Automated pipeline run created for validation purposes only.');

    await expect(this.sourceReferenceInput).toBeVisible();
    await this.sourceReferenceInput.click();
    await this.sourceReferenceInput.pressSequentially('main', { delay: 100 });
    await this.sourceReferenceInput.press('Tab');
    await expect(this.sourceReferenceInput).toHaveValue('main');

    await expect(this.sourceModelPathInput).toBeEnabled({ timeout: 15000 });
    await this.page.waitForTimeout(300);

    const modelPathContainer = this.sourceModelPathInput.locator(
      'xpath=ancestor::div[contains(@class, "MuiAutocomplete-root")]'
    );
    const modelPathToggle = modelPathContainer.getByRole('button', { name: 'Open' });
    const modelsOption = this.page.getByRole('option', { name: 'Models', exact: true });

    // Cold starts (first run after a gap) can make the options-fetch API slow —
    // wait for that response explicitly instead of guessing a fixed timeout.
    const optionsResponsePromise = this.page
      .waitForResponse(
        (res) => /model.*path|models/i.test(res.url()) && res.request().method() === 'GET',
        { timeout: 45000 }
      )
      .catch(() => null);

    await modelPathToggle.click();
    await optionsResponsePromise;

    await expect(modelsOption).toBeVisible({ timeout: 3000 });
    await modelsOption.click();
    await expect(this.sourceModelPathInput).toHaveValue('Models');
  }

  public async selectPreset(): Promise<void> {
    await expect(this.presetInput).toBeVisible();
    await this.presetInput.click();
    const presetOption = this.page.getByText('config_bld_cpu_mp4', { exact: true }).last();
    if (await presetOption.isVisible()) {
      await presetOption.click();
    } else {
      await this.presetInput.press('ArrowDown');
      await this.presetInput.press('Enter');
    }
    await expect(this.presetInput).toHaveValue('config_bld_cpu_mp4');
  }

  public async uploadFile(filePath: string): Promise<void> {
    await expect(this.fileInput).toBeVisible();
    await this.fileInput.setInputFiles(filePath);
    await expect(this.page.getByText(/DefaultC1_MP4 \(1\)/i).first()).toBeVisible();
  }

  public async selectFirstVideoDataCheckbox(): Promise<void> {
  await expect(this.videoDataSection).toBeVisible();

  const grid = this.page.getByRole('grid');
  const firstDataRow = grid.getByRole('rowgroup').getByRole('row').first();
  const checkbox = firstDataRow.getByRole('checkbox');

  await expect(checkbox).toBeVisible();
  await checkbox.check();
  await expect(checkbox).toBeChecked();
}

  public async saveAsTemplate(): Promise<string> {
  await expect(this.saveTemplateButton).toBeVisible();
  await this.saveTemplateButton.click();

  // A modal opens asking for a template name — must be unique each run
  const templateNameInput = this.page.locator('#templateName');
  await expect(templateNameInput).toBeVisible();
  const templateName = `Template_${Date.now()}`;
  await templateNameInput.fill(templateName);

  // Submit the template to the server
  const submitButton = this.page.getByRole('button', { name: /submit \(to server\)/i });
  await expect(submitButton).toBeVisible();
  await submitButton.click();

  // Confirm success — loosened to match common success phrasing
  await expect(
    this.page.getByText(/saved|success/i).first()
  ).toBeVisible({ timeout: 15000 });

  return templateName;
    }
}