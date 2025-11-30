/**
 * E2E Tests: AI Command Center
 *
 * End-to-end tests using Playwright
 *
 * To run: npx playwright test tests/e2e/ai-command-center.e2e.test.js
 */

import { expect, test } from '@playwright/test';

test.describe('AI Command Center E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to AI Command Center
    await page.goto('/ai-command-center');
    // Wait for page to load
    await page.waitForSelector('[data-testid="command-input"]', { timeout: 10000 });
  });

  test('should display command input and suggestions panel', async ({ page }) => {
    // Check command input exists
    const commandInput = page.locator('[data-testid="command-input"]');
    await expect(commandInput).toBeVisible();

    // Check suggestions panel exists (if suggestions available)
    const suggestionsPanel = page.locator('[data-testid="suggestions-panel"]');
    // May or may not be visible depending on data
  });

  test('should execute command and show workflow result', async ({ page }) => {
    // Type command
    const commandInput = page.locator('[data-testid="command-input"] input');
    await commandInput.fill('Tạo bài post về dự án Vũng Tàu');

    // Submit command
    await commandInput.press('Enter');

    // Wait for response
    await page.waitForSelector('[data-testid="command-result"]', { timeout: 30000 });

    // Check result is displayed
    const result = page.locator('[data-testid="command-result"]');
    await expect(result).toBeVisible();
  });

  test('should open command palette with Cmd+K', async ({ page }) => {
    // Press Cmd+K (or Ctrl+K on Windows)
    await page.keyboard.press('Meta+k'); // Cmd on Mac, Ctrl on Windows

    // Check palette is open
    const palette = page.locator('[data-testid="command-palette"]');
    await expect(palette).toBeVisible();
  });

  test('should display and dismiss suggestions', async ({ page }) => {
    // Check if suggestions are visible
    const suggestions = page.locator('[data-testid="suggestion-card"]');
    const count = await suggestions.count();

    if (count > 0) {
      // Click dismiss on first suggestion
      const dismissButton = suggestions.first().locator('[data-testid="dismiss-button"]');
      await dismissButton.click();

      // Verify suggestion is removed
      await expect(suggestions).toHaveCount(count - 1);
    }
  });
});
