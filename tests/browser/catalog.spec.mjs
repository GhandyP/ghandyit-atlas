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

async function firstRowKeys(page, limit = 5) {
  return firstRowAttributes(page, 'data-row-key', limit);
}

async function firstRowAttributes(page, attribute, limit) {
  const rows = page.locator('[data-asset-row]');
  return Promise.all(Array.from({ length: limit }, (_, index) => rows.nth(index).getAttribute(attribute)));
}

test('loads the catalog fallback and retains all rows', async ({ page }) => {
  await openCatalog(page);

  await expect(page.locator('.catalog-quality')).toBeVisible();
  await expect(page.locator('.catalog-quality__badge')).toHaveText(/Fallback de catálogo|Catálogo versionado/);
  await expect(page.locator('.catalog-quality__details')).not.toContainText('enriquecido');
  await expect(page.locator('.analytics-dashboard[data-analytics-mode="catalog-fallback"], .analytics-dashboard[data-analytics-mode="catalog"]')).toBeVisible();
  await expect(page.locator('.analytics-unavailable')).toContainText('métricas de proveedores');
  await expect(page.locator('.analytics-unavailable')).toContainText('evidencia de licencia');
  await expect(page.locator('.analytics-unavailable')).toContainText('As-of: unknown');
  await expect(page.locator('.analytics-unavailable__link')).toHaveAttribute('href', '#catalog-quality-title');
  await expect(page.locator('[data-asset-row]')).toHaveCount(TOTAL_ROWS);
  await expect(page.locator('.analytics-blocks')).toHaveCount(0);
  await expect(page.locator('.comparison')).toHaveCount(0);
  await expect(page.locator('.score-policy')).toHaveCount(0);
});

test('composes search and quality filters and resets them', async ({ page }) => {
  await openCatalog(page);

  const rows = page.locator('[data-asset-row]');
  const searchTerm = await rows.first().getAttribute('data-name');
  expect(searchTerm).toBeTruthy();

  await page.locator('#searchInput').fill(searchTerm);
  await expect(page.locator('#resultSummary')).not.toContainText(`Mostrando ${TOTAL_ROWS} de ${TOTAL_ROWS} activos`);

  await page.locator('#resetCatalogFilters').click();
  await expect(page.locator('#searchInput')).toHaveValue('');
  await expect(page.locator('#qualitySelect')).toHaveValue('all');
  await expect(page.locator('#sortSelect')).toHaveValue('rank-asc');
  await expect(page.locator('#resultSummary')).toContainText(`Mostrando ${TOTAL_ROWS} de ${TOTAL_ROWS} activos`);

  await page.locator('#qualitySelect').selectOption('unresolved-identity');
  await expect(page.locator('#resultSummary')).toContainText('Calidad: Identidad sin resolver');
  await expect(page.locator('#resultSummary')).toContainText(`Mostrando ${TOTAL_ROWS} de ${TOTAL_ROWS} activos`);
  await expect(rows.first()).toHaveAttribute('data-identity-state', 'unresolved');

  const name = await rows.first().getAttribute('data-name');
  await page.locator('#searchInput').fill(name);
  await expect(page.locator('#resultSummary')).not.toContainText(`Mostrando ${TOTAL_ROWS} de ${TOTAL_ROWS} activos`);
  await expect(page.locator('#resultSummary')).toContainText('Calidad: Identidad sin resolver');
  await expect(rows.first()).toHaveAttribute('data-identity-state', 'unresolved');

  await page.locator('#resetCatalogFilters').click();
  await expect(page.locator('#qualitySelect')).toHaveValue('all');
  await expect(page.locator('#resultSummary')).toContainText(`Mostrando ${TOTAL_ROWS} de ${TOTAL_ROWS} activos`);
});

test('sorts deterministically without dropping rows and exposes row evidence', async ({ page }) => {
  await openCatalog(page);

  const rows = page.locator('[data-asset-row]');
  const rankKeys = await firstRowKeys(page);
  await page.locator('#sortSelect').selectOption('name-asc');
  await expect(page.locator('#sortSelect')).toHaveValue('name-asc');
  const nameKeys = await firstRowKeys(page);
  const sortedNames = (await firstRowAttributes(page, 'data-name', 20)).map((name) => name ?? '');
  expect(sortedNames).toEqual([...sortedNames].sort((a, b) => a.localeCompare(b)));
  expect(nameKeys).not.toEqual(rankKeys);
  await expect(page.locator('#resultSummary')).toContainText(`Mostrando ${TOTAL_ROWS} de ${TOTAL_ROWS} activos`);

  await page.locator('#sortSelect').selectOption('rank-asc');
  await page.locator('#sortSelect').selectOption('name-asc');
  expect(await firstRowKeys(page)).toEqual(nameKeys);
  await expect(rows).toHaveCount(TOTAL_ROWS);

  const evidence = rows.first().locator('details.row-evidence');
  await evidence.locator('summary').click();
  await expect(evidence).toHaveAttribute('open', '');
  await expect(evidence.locator('.row-evidence__body')).toContainText('ontonew.md');
  await expect(evidence.locator('.row-evidence__body')).toContainText('línea');
  await expect(evidence.locator('.row-evidence__body')).toContainText('Identidad raw');
  await expect(evidence.locator('.row-evidence__body')).toContainText('Estado de identidad');
  await expect(evidence.locator('.row-evidence__body')).toContainText('As-of: unknown');
});

test('keyboard reaches every catalog control, reset returns focus, and evidence toggles', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#ondoTable')).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(page.locator('a.skip-link')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.locator('#searchInput')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.locator('#sortSelect')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.locator('#qualitySelect')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.locator('#resetCatalogFilters')).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page.locator('#searchInput')).toBeFocused();
  await expect(page.locator('#searchInput')).toHaveValue('');
  await expect(page.locator('#resultSummary')).toContainText(`Mostrando ${TOTAL_ROWS} de ${TOTAL_ROWS} activos`);

  const rowDetails = page.locator('[data-asset-row]').first().locator('details.row-evidence');
  const summary = rowDetails.locator('summary');
  await summary.focus();
  await expect(summary).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(rowDetails).toHaveAttribute('open', '');
  await page.keyboard.press('Enter');
  await expect(rowDetails).not.toHaveAttribute('open', '');

  await expect(page.locator('[data-asset-row] .website-link').first()).toContainText('se abre en una pestaña nueva');
});

test('navigates from a token row to its shareable detail page and back', async ({ page }) => {
  await openCatalog(page);

  const link = page.locator('[data-asset-row] .asset-link').first();
  await expect(link).toHaveAttribute('href', /^\/assets\/[a-z0-9-]+\/$/);
  await link.click();

  await expect(page).toHaveURL(/\/assets\/[a-z0-9-]+\/$/);
  await expect(page.locator('.asset-detail')).toBeVisible();
  await expect(page.locator('.asset-detail__head h1')).toBeVisible();
  await expect(page.locator('.asset-detail')).toContainText('Evidencia y estado');
  await expect(page.locator('.asset-detail')).toContainText('Contexto del snapshot');

  await page.locator('.asset-detail__back a').click();
  await expect(page.locator('#ondoTable')).toBeVisible();
});
