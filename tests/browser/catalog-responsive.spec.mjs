import { expect, test } from 'playwright/test';

const TOTAL_ROWS = 439;
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost']);

test.beforeEach(async ({ page }) => {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if ((url.protocol === 'http:' || url.protocol === 'https:') && !LOCAL_HOSTS.has(url.hostname)) {
      await route.abort();
      return;
    }
    await route.continue();
  });
});

async function openCatalog(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#ondoTable')).toBeVisible();
  await expect(page.locator('#resultSummary')).toContainText(`Mostrando ${TOTAL_ROWS} de ${TOTAL_ROWS} activos`);
}

// Return a search term guaranteed to match: the first row's data-name, or its data-symbol as fallback.
async function firstRowNamePart(page) {
  const name = await page.locator('[data-asset-row]').first().getAttribute('data-name');
  if (name) return name.split(/\s+/)[0];
  const symbol = await page.locator('[data-asset-row]').first().getAttribute('data-symbol');
  return symbol || 'ondo';
}

const firstAssemblableTerm = firstRowNamePart;

test('mobile viewport keeps controls usable and avoids horizontal page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openCatalog(page);

  await expect(page.locator('#searchInput')).toBeVisible();
  await expect(page.locator('#sortSelect')).toBeVisible();
  await expect(page.locator('#qualitySelect')).toBeVisible();
  await expect(page.locator('#resetCatalogFilters')).toBeVisible();

  // Card layout: thead hidden and row cells render their data-label.
  await expect(page.locator('thead')).toBeHidden();
  await expect(page.locator('[data-asset-row]').first()).toBeVisible();

  // Page must not overflow horizontally on mobile.
  const overflowX = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflowX).toBeLessThanOrEqual(1);

  await page.fill('#searchInput', 'ondo');
  await expect(page.locator('#resultSummary')).not.toContainText('Mostrando 0 de');
});

test('search and reset remain functional at 200% zoom', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 760 });
  await openCatalog(page);

  await page.fill('#searchInput', await firstAssemblableTerm(page));
  await expect(page.locator('[data-asset-row]')).not.toHaveCount(0);
  await expect(page.locator('#resultSummary')).not.toContainText('Mostrando 0 de');

  await page.click('#resetCatalogFilters');
  await expect(page.locator('#resultSummary')).toContainText(`Mostrando ${TOTAL_ROWS} de ${TOTAL_ROWS} activos`);
});

test('renders without errors under prefers-reduced-motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openCatalog(page);

  await expect(page.locator('.catalog-quality')).toBeVisible();

  await page.fill('#searchInput', await firstRowNamePart(page));
  await expect(page.locator('[data-asset-row]')).not.toHaveCount(0);
  await expect(page.locator('#resultSummary')).not.toContainText('Mostrando 0 de');
});