import { test, expect } from './demo';

test('the fork identifies itself, preserves the full disclaimer and uses its own project links', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('The Tech Shed for Todoist');
  await expect(page.locator('.tech-shed-brand')).toContainText('The Tech Shed');
  await expect(page.locator('.connect-legal')).toContainText('not created by, affiliated with, or supported by Todoist');
  await expect(page.locator('.connect-privacy a')).toHaveAttribute('href', 'https://github.com/willcurtis/todoist-enhanced');
  await expect(page.locator('a[href*="tally.so"], a[href*="buymeacoffee"], a[href$=".dmg"]')).toHaveCount(0);
  expect(await page.locator('.tech-shed-brand img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
});

test('About credits the original author and the distribution includes the MIT notice', async ({ demo: page }) => {
  await page.goto('/#/settings');
  await expect(page.locator('.setlegal').first()).toContainText('Jules-Valentin Bertolino');
  const licence = await page.request.get('/LICENSE');
  expect(licence.ok()).toBe(true);
  expect(await licence.text()).toContain('Copyright (c) 2026 Jules-Valentin Bertolino');
  const notice = await page.request.get('/NOTICE.txt');
  expect(await notice.text()).toContain('The Tech Shed');
});
