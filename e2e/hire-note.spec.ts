import { test, expect } from './demo';
test('the fork does not show upstream recruitment messaging', async ({ demo: page }) => {
  await page.evaluate(() => window.dispatchEvent(new Event('enhanced:hire-note')));
  await expect(page.locator('.hirenote')).toHaveCount(0);
  await expect(page.locator('a[href*="alias-digital"]')).toHaveCount(0);
});
