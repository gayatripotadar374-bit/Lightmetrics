import { expect, type Locator, type Page } from '@playwright/test';

export class RunTemplatePage {
  private readonly page: Page;
  private readonly selectExistingTemplateCombobox: Locator;
  private readonly openTemplateButton: Locator;
  private readonly runPipelineButton: Locator;
  private readonly presetInput: Locator;
  private readonly buildTriggeredToast: Locator;

  public constructor(page: Page) {
    this.page = page;
    this.selectExistingTemplateCombobox = page.getByRole('combobox', { name: /select existing template/i }).first();
    this.openTemplateButton = page.getByRole('button', { name: /^Open$/i }).first();
    this.runPipelineButton = page.locator("button[value='runPipeline']");
    this.presetInput = page.getByLabel(/select preset configuration/i).first();
    this.buildTriggeredToast = page.getByText(/build triggered successfully/i);
  }

  public async openExistingTemplatePicker(): Promise<void> {
    console.log('Opening the existing template picker');
    await expect(this.selectExistingTemplateCombobox).toBeVisible();
    await this.selectExistingTemplateCombobox.click();

    if (await this.openTemplateButton.isVisible().catch(() => false)) {
      await this.openTemplateButton.click();
    }

    await this.page.waitForLoadState('networkidle');
  }

  public async selectTemplate(templateName: string): Promise<void> {
    console.log(`Selecting template: ${templateName}`);

    // Type the exact name to filter the Autocomplete options
    await this.selectExistingTemplateCombobox.click();
    await this.selectExistingTemplateCombobox.fill(templateName);

    // Use a "contains" match instead of exact — the option label may include extra
    // trailing text (e.g. "Saved for Reference") appended after the template name
    const targetOption = this.page.getByRole('option', {
      name: new RegExp(templateName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    });
    await expect(targetOption).toBeVisible({ timeout: 20_000 });
    await targetOption.click();

    await this.page.waitForLoadState('networkidle');

    // Wait for the form to finish auto-populating from the template before proceeding.
    // The preset field being non-empty is a reliable signal the template data has loaded.
    await expect(this.presetInput).not.toHaveValue('', { timeout: 15_000 });
    console.log('Template data has populated the form');
  }

  public async runPipeline(): Promise<void> {
    console.log('Clicking Run pipeline');
    await expect(this.runPipelineButton).toBeVisible();
    await expect(this.runPipelineButton).toBeEnabled({ timeout: 15_000 });
    await this.runPipelineButton.click();

    // Confirm the success toast appears — this is the real proof the run was triggered
    console.log('Waiting for "Build triggered successfully" confirmation');
    await expect(this.buildTriggeredToast).toBeVisible({ timeout: 15_000 });

    // Screenshot immediately to visually verify what was actually detected
    await this.page.screenshot({ path: 'test-results/build-triggered-toast.png' });
    console.log('Build triggered successfully toast confirmed — screenshot saved');

    await this.page.waitForLoadState('networkidle');
  }

}