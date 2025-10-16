import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3002';
const TEST_EMAIL = 'admin@pinnacle.com';
const TEST_PASSWORD = 'Admin12345';

test.describe('Wholesale CRM - Full Functionality Test', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('1. Login - Should successfully login with valid credentials', async () => {
    await page.goto(`${BASE_URL}/login`);

    // Wait for page to load
    await page.waitForSelector('input[type="email"]');

    // Fill in credentials
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);

    // Click sign in
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL(`${BASE_URL}/`, { timeout: 10000 });

    // Check for dashboard elements
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Wholesale CRM')).toBeVisible();

    console.log('✅ Login successful');
  });

  test('2. Dashboard - Should display dashboard metrics', async () => {
    // Should already be on dashboard from previous test
    await page.goto(`${BASE_URL}/`);

    // Check for metric cards
    await expect(page.locator('text=Total Sellers')).toBeVisible();
    await expect(page.locator('text=Properties')).toBeVisible();
    await expect(page.locator('text=Investors')).toBeVisible();
    await expect(page.locator('text=Active Deals')).toBeVisible();
    await expect(page.locator('text=Total Revenue')).toBeVisible();

    // Check for quick actions
    await expect(page.locator('text=Quick Actions')).toBeVisible();
    await expect(page.locator('text=Add New Seller')).toBeVisible();

    console.log('✅ Dashboard metrics displayed');
  });

  test('3. Sidebar Navigation - Should navigate to all pages', async () => {
    const pages = [
      { name: 'Sellers', path: '/sellers' },
      { name: 'Properties', path: '/properties' },
      { name: 'Investors', path: '/investors' },
      { name: 'Deals', path: '/deals' },
      { name: 'Tasks', path: '/tasks' },
      { name: 'Documents', path: '/documents' },
      { name: 'Settings', path: '/settings' }
    ];

    for (const pageItem of pages) {
      // Click on sidebar link
      await page.click(`a[href="${pageItem.path}"]`);

      // Wait for navigation
      await page.waitForURL(`${BASE_URL}${pageItem.path}`);

      // Check if page title is visible
      await expect(page.locator(`text=${pageItem.name}`).first()).toBeVisible();

      console.log(`✅ ${pageItem.name} page accessible`);
    }
  });

  test('4. Sellers Page - Check for Add Seller button', async () => {
    await page.goto(`${BASE_URL}/sellers`);

    // Check for page title
    await expect(page.locator('h1:has-text("Sellers")')).toBeVisible();

    // Check for Add Seller button
    const addButton = page.locator('button:has-text("Add Seller")');
    await expect(addButton).toBeVisible();

    // Click the button to see if there's a form or modal
    await addButton.click();

    // Wait a bit to see if anything happens
    await page.waitForTimeout(1000);

    console.log('✅ Sellers page has Add button (checking if functional...)');
  });

  test('5. Properties Page - Check functionality', async () => {
    await page.goto(`${BASE_URL}/properties`);

    await expect(page.locator('h1:has-text("Properties")')).toBeVisible();

    console.log('✅ Properties page accessible');
  });

  test('6. Investors Page - Check functionality', async () => {
    await page.goto(`${BASE_URL}/investors`);

    await expect(page.locator('h1:has-text("Investors")')).toBeVisible();

    console.log('✅ Investors page accessible');
  });

  test('7. Deals Page - Check functionality', async () => {
    await page.goto(`${BASE_URL}/deals`);

    await expect(page.locator('h1:has-text("Deals")')).toBeVisible();

    console.log('✅ Deals page accessible');
  });

  test('8. Tasks Page - Check functionality', async () => {
    await page.goto(`${BASE_URL}/tasks`);

    await expect(page.locator('h1:has-text("Tasks")')).toBeVisible();

    console.log('✅ Tasks page accessible');
  });

  test('9. Documents Page - Check functionality', async () => {
    await page.goto(`${BASE_URL}/documents`);

    await expect(page.locator('h1:has-text("Documents")')).toBeVisible();

    console.log('✅ Documents page accessible');
  });

  test('10. Settings Page - Check functionality', async () => {
    await page.goto(`${BASE_URL}/settings`);

    await expect(page.locator('h1:has-text("Settings")')).toBeVisible();

    console.log('✅ Settings page accessible');
  });

  test('11. Sign Out - Should successfully sign out', async () => {
    await page.goto(`${BASE_URL}/`);

    // Click sign out button
    await page.click('button:has-text("Sign Out")');

    // Should redirect to login
    await page.waitForURL(`${BASE_URL}/login`, { timeout: 5000 });

    await expect(page.locator('text=Sign in to access your dashboard')).toBeVisible();

    console.log('✅ Sign out successful');
  });

  test('12. Protected Routes - Should redirect to login when not authenticated', async () => {
    // Try to access dashboard without being logged in
    await page.goto(`${BASE_URL}/`);

    // Should be redirected to login
    await page.waitForURL(/\/login/, { timeout: 5000 });

    console.log('✅ Protected routes working correctly');
  });
});

test.describe('Feature Availability Report', () => {
  test('Generate feature report', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/`);

    console.log('\n========================================');
    console.log('FEATURE AVAILABILITY REPORT');
    console.log('========================================\n');

    const features = [
      { name: 'Dashboard', page: '/', check: 'text=Total Sellers' },
      { name: 'Sellers Management', page: '/sellers', check: 'button:has-text("Add Seller")' },
      { name: 'Properties Management', page: '/properties', check: 'h1:has-text("Properties")' },
      { name: 'Investors Management', page: '/investors', check: 'h1:has-text("Investors")' },
      { name: 'Deals Management', page: '/deals', check: 'h1:has-text("Deals")' },
      { name: 'Tasks Management', page: '/tasks', check: 'h1:has-text("Tasks")' },
      { name: 'Documents', page: '/documents', check: 'h1:has-text("Documents")' },
      { name: 'Settings', page: '/settings', check: 'h1:has-text("Settings")' }
    ];

    for (const feature of features) {
      await page.goto(`${BASE_URL}${feature.page}`);
      await page.waitForTimeout(500);

      const element = page.locator(feature.check);
      const isVisible = await element.isVisible().catch(() => false);

      // Check if it's a placeholder page
      const hasComingSoon = await page.locator('text=Coming soon').isVisible().catch(() => false);

      const status = isVisible ? (hasComingSoon ? '⚠️  PLACEHOLDER' : '✅ WORKING') : '❌ NOT FOUND';
      console.log(`${feature.name.padEnd(25)} ${status}`);
    }

    console.log('\n========================================\n');
  });
});
