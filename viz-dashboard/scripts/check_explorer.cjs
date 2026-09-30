// Run against a built site: BASE_URL=... PLAYWRIGHT_MODULE=... CHROME_BIN=... node scripts/check_explorer.cjs
// Uses an existing Playwright installation; no game API calls or test dependencies are installed.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const snapshot = require('../src/data/meta_snapshot.json');
const history = require('../src/data/meta_history.json');

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const base = process.env.BASE_URL || 'http://localhost:3100';
    if (process.env.VERCEL_OIDC_TOKEN) await page.route(base + '/**', route => route.continue({ headers: { ...route.request().headers(), 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN } }));
    const errors = [], apiCalls = [], prefetches = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      if (new URL(request.url()).pathname.startsWith('/api/')) apiCalls.push(request.url());
      if (request.headers()['next-router-prefetch']) prefetches.push(request.url());
    });
    const card = snapshot.cards.find(card => card.name === 'Hog Rider');
    const response = await page.goto(`${base}/explore?card=${card.id}`, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    assert.equal(await page.locator('#selected-card-heading').innerText(), card.name);
    assert.ok((await page.locator('dl').innerText()).includes(card.wins.toLocaleString('en-US')));
    if (history.snapshots.length === 1) assert.ok((await page.locator('body').innerText()).includes('First-day baseline saved'));
    await page.getByLabel('Search cards', { exact: true }).fill('no-such-card');
    await page.getByText('No cards match that search.', { exact: true }).waitFor();
    await page.getByLabel('Search cards', { exact: true }).fill('Knight');
    await page.getByRole('button', { name: 'Knight', exact: true }).click();
    const knight = snapshot.cards.find(card => card.name === 'Knight');
    await page.waitForFunction(name => document.getElementById('selected-card-heading')?.textContent === name, knight.name);
    assert.equal(new URL(page.url()).searchParams.get('card'), String(knight.id));
    await page.getByLabel('Search cards', { exact: true }).fill('');
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      const layout = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, dark: getComputedStyle(document.documentElement).colorScheme, broken: [...document.images].filter(image => image.complete && !image.naturalWidth).map(image => image.src) }));
      assert.ok(layout.scroll <= width, JSON.stringify(layout));
      assert.equal(layout.dark, 'dark');
      assert.deepEqual(layout.broken, []);
      if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/explorer-${width}.png`, fullPage: true });
    }
    await page.goto(`${base}/explore?card=invalid`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#selected-card-heading').innerText(), snapshot.cards[0].name);
    await page.goto(`${base}/data`, { waitUntil: 'networkidle' });
    await page.locator('#card-stats').getByRole('link', { name: 'Hog Rider', exact: true }).click();
    await page.waitForFunction(name => document.getElementById('selected-card-heading')?.textContent === name, card.name);
    assert.deepEqual(errors, []);
    assert.deepEqual(apiCalls, []);
    assert.deepEqual(prefetches, []);
    console.log('Explorer checks passed: deep links, selection, empty search, exact wins, history baseline, responsive layout, no API calls or prefetch.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
