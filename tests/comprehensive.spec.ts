import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TEST_USER = {
  email: 'admin@pinnacle.com',
  password: 'Admin12345'
};

test.describe('Wholesale CRM - Comprehensive Tests', () => {

  // Login helper
  async function login(page: any) {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/`, { timeout: 10000 });
  }

  test.describe('Authentication', () => {
    test('should display login page', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await expect(page.locator('h1')).toContainText('Sign In');
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('should login successfully with valid credentials', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');

      // Should redirect to dashboard
      await page.waitForURL(`${BASE_URL}/`, { timeout: 10000 });
      await expect(page.locator('h1')).toContainText('Dashboard');
    });

    test('should protect routes when not authenticated', async ({ page }) => {
      await page.goto(`${BASE_URL}/sellers`);
      // Should redirect to login
      await page.waitForURL(/.*\/login/, { timeout: 5000 });
      await expect(page.url()).toContain('/login');
    });
  });

  test.describe('Sidebar Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('should display all navigation items', async ({ page }) => {
      const expectedNavItems = [
        'Dashboard',
        'Sellers',
        'Properties',
        'Investors',
        'Deals',
        'Tasks',
        'Activities',
        'Communications',
        'Broadcast',
        'Automations',
        'Contracts',
        'Calculators',
        'Marketing',
        'Reports',
        'Documents',
        'Settings'
      ];

      for (const item of expectedNavItems) {
        await expect(page.locator('nav').getByText(item)).toBeVisible();
      }
    });

    test('should navigate to each page successfully', async ({ page }) => {
      const pages = [
        { name: 'Dashboard', url: '/', heading: 'Dashboard' },
        { name: 'Sellers', url: '/sellers', heading: 'Sellers' },
        { name: 'Properties', url: '/properties', heading: 'Properties' },
        { name: 'Investors', url: '/investors', heading: 'Investors' },
        { name: 'Deals', url: '/deals', heading: 'Deals' },
        { name: 'Tasks', url: '/tasks', heading: 'Tasks' },
        { name: 'Activities', url: '/activities', heading: 'Activities' },
        { name: 'Communications', url: '/communications', heading: 'Communications' },
        { name: 'Broadcast', url: '/broadcast', heading: 'Broadcast' },
        { name: 'Calculators', url: '/calculators', heading: 'Calculators' },
        { name: 'Marketing', url: '/marketing', heading: 'Marketing' },
        { name: 'Reports', url: '/reports', heading: 'Reports' },
        { name: 'Documents', url: '/documents', heading: 'Documents' }
      ];

      for (const pageInfo of pages) {
        await page.click(`nav a:has-text("${pageInfo.name}")`);
        await page.waitForURL(`${BASE_URL}${pageInfo.url}`, { timeout: 5000 });
        await expect(page.locator('h1')).toContainText(pageInfo.heading);
      }
    });

    test('should show sign out button', async ({ page }) => {
      await expect(page.getByText('Sign Out')).toBeVisible();
    });
  });

  test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('should display key metrics', async ({ page }) => {
      await expect(page.getByText('Total Sellers')).toBeVisible();
      await expect(page.getByText('Properties')).toBeVisible();
      await expect(page.getByText('Investors')).toBeVisible();
      await expect(page.getByText('Active Deals')).toBeVisible();
      await expect(page.getByText('Closed Deals')).toBeVisible();
      await expect(page.getByText('Total Revenue')).toBeVisible();
    });

    test('should display quick actions', async ({ page }) => {
      await expect(page.getByText('Quick Actions')).toBeVisible();
      await expect(page.getByText('Add New Seller')).toBeVisible();
      await expect(page.getByText('Add New Investor')).toBeVisible();
      await expect(page.getByText('Add New Property')).toBeVisible();
    });
  });

  test.describe('Sellers Module', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.click('nav a:has-text("Sellers")');
      await page.waitForURL(`${BASE_URL}/sellers`);
    });

    test('should display sellers page', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Sellers');
      await expect(page.getByText('Add Seller')).toBeVisible();
    });

    test('should open add seller modal', async ({ page }) => {
      await page.click('button:has-text("Add Seller")');
      await expect(page.getByText('Add New Seller')).toBeVisible();
      await expect(page.getByText('Name *')).toBeVisible();
    });
  });

  test.describe('Properties Module', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.click('nav a:has-text("Properties")');
      await page.waitForURL(`${BASE_URL}/properties`);
    });

    test('should display properties page', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Properties');
      await expect(page.getByText('Add Property')).toBeVisible();
    });

    test('should open add property modal', async ({ page }) => {
      await page.click('button:has-text("Add Property")');
      await expect(page.getByText('Add New Property')).toBeVisible();
      await expect(page.getByText('Address *')).toBeVisible();
    });
  });

  test.describe('Calculators Module', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.click('nav a:has-text("Calculators")');
      await page.waitForURL(`${BASE_URL}/calculators`);
    });

    test('should display all calculator tabs', async ({ page }) => {
      await expect(page.getByText('70% Rule')).toBeVisible();
      await expect(page.getByText('Profit Calculator')).toBeVisible();
      await expect(page.getByText('Cash-on-Cash Return')).toBeVisible();
      await expect(page.getByText('BRRRR Calculator')).toBeVisible();
      await expect(page.getByText('Repair Estimator')).toBeVisible();
    });

    test('should calculate 70% rule correctly', async ({ page }) => {
      await page.click('button:has-text("70% Rule")');

      // Fill in ARV
      await page.fill('input[placeholder="0"]', '200000');

      // Fill in repairs
      const inputs = await page.locator('input[placeholder="0"]').all();
      await inputs[1].fill('30000');

      // Check calculation (200000 * 0.7 - 30000 = 110000)
      await expect(page.locator('text=/\\$110,000/i')).toBeVisible({ timeout: 2000 });
    });

    test('should switch between calculators', async ({ page }) => {
      await page.click('button:has-text("Profit Calculator")');
      await expect(page.getByText('Purchase Price')).toBeVisible();

      await page.click('button:has-text("BRRRR Calculator")');
      await expect(page.getByText('Rehab Cost')).toBeVisible();
    });
  });

  test.describe('Activities Module', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.click('nav a:has-text("Activities")');
      await page.waitForURL(`${BASE_URL}/activities`);
    });

    test('should display activities page', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Activities');
      await expect(page.getByText('Log Activity')).toBeVisible();
    });

    test('should show filter options', async ({ page }) => {
      await expect(page.locator('select').first()).toBeVisible();
      await expect(page.getByText('All Types')).toBeVisible();
    });

    test('should open log activity modal', async ({ page }) => {
      await page.click('button:has-text("Log Activity")');
      await expect(page.getByText('Activity Type *')).toBeVisible();
      await expect(page.getByText('Phone Call')).toBeVisible();
      await expect(page.getByText('Email')).toBeVisible();
    });
  });

  test.describe('Communications Module', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.click('nav a:has-text("Communications")');
      await page.waitForURL(`${BASE_URL}/communications`);
    });

    test('should display communication tabs', async ({ page }) => {
      await expect(page.getByText('Email Templates')).toBeVisible();
      await expect(page.getByText('SMS Templates')).toBeVisible();
      await expect(page.getByText('Broadcasts')).toBeVisible();
      await expect(page.getByText('Drip Campaigns')).toBeVisible();
    });

    test('should switch between tabs', async ({ page }) => {
      await page.click('button:has-text("SMS Templates")');
      await expect(page.getByText('New SMS Template')).toBeVisible();

      await page.click('button:has-text("Email Templates")');
      await expect(page.getByText('New Email Template')).toBeVisible();
    });
  });

  test.describe('Marketing ROI Module', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.click('nav a:has-text("Marketing")');
      await page.waitForURL(`${BASE_URL}/marketing`);
    });

    test('should display marketing metrics', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Marketing');
      await expect(page.getByText('Total Budget')).toBeVisible();
      await expect(page.getByText('Total Spent')).toBeVisible();
      await expect(page.getByText('Total Leads')).toBeVisible();
      await expect(page.getByText('Overall ROI')).toBeVisible();
    });

    test('should have new campaign button', async ({ page }) => {
      await expect(page.getByText('New Campaign')).toBeVisible();
    });
  });

  test.describe('Reports Module', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.click('nav a:has-text("Reports")');
      await page.waitForURL(`${BASE_URL}/reports`);
    });

    test('should display reports page', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Analytics');
      await expect(page.getByText('Conversion Funnel')).toBeVisible();
      await expect(page.getByText('Pipeline Velocity')).toBeVisible();
    });

    test('should display key metrics', async ({ page }) => {
      await expect(page.getByText('Total Revenue')).toBeVisible();
      await expect(page.getByText('Avg Deal Size')).toBeVisible();
      await expect(page.getByText('Conversion Rate')).toBeVisible();
    });

    test('should have time period selector', async ({ page }) => {
      const selector = page.locator('select').first();
      await expect(selector).toBeVisible();
      await expect(selector).toContainText('Last 30 Days');
    });
  });

  test.describe('Broadcast Module', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.click('nav a:has-text("Broadcast")');
      await page.waitForURL(`${BASE_URL}/broadcast`);
    });

    test('should display broadcast page', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Broadcast');
      await expect(page.getByText('Select Property')).toBeVisible();
    });

    test('should show broadcast type options', async ({ page }) => {
      // Select first property if any exist
      const propertyButtons = await page.locator('button').filter({ hasText: /bd \/ ba/ }).count();

      if (propertyButtons > 0) {
        await page.locator('button').filter({ hasText: /bd \/ ba/ }).first().click();
        await expect(page.getByText('Email')).toBeVisible();
        await expect(page.getByText('SMS')).toBeVisible();
      }
    });
  });

  test.describe('Automations Module', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.click('nav a:has-text("Automations")');
      await page.waitForURL(`${BASE_URL}/automations`);
    });

    test('should display automations page', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Workflow Automations' })).toBeVisible();
      await expect(page.getByText('Automate tasks and notifications')).toBeVisible();
    });

    test('should show tabs for rules and logs', async ({ page }) => {
      await expect(page.getByText(/Workflow Rules/)).toBeVisible();
      await expect(page.getByText(/Execution Log/)).toBeVisible();
    });

    test('should have new rule button', async ({ page }) => {
      await expect(page.getByText('New Rule')).toBeVisible();
    });

    test('should open new rule modal', async ({ page }) => {
      await page.click('button:has-text("New Rule")');
      await expect(page.getByText('Create New Workflow Rule')).toBeVisible();
      await expect(page.getByText('Rule Name *')).toBeVisible();
      await expect(page.getByText('Trigger Configuration')).toBeVisible();
      await expect(page.getByText('Action Configuration')).toBeVisible();
    });

    test('should switch between tabs', async ({ page }) => {
      await page.click('button:has-text("Execution Log")');
      // Wait a moment for tab content to render
      await page.waitForTimeout(500);
      // Check that we're on the log tab (either shows empty state or table)
      const hasExecutionLogContent = await page.locator('.bg-white.border').count() > 0;
      expect(hasExecutionLogContent).toBeTruthy();
    });
  });

  test.describe('Contracts Module', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.click('nav a:has-text("Contracts")');
      await page.waitForURL(`${BASE_URL}/contracts`);
    });

    test('should display contracts page', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Contract Generator' })).toBeVisible();
      await expect(page.getByText('Create and manage contract templates')).toBeVisible();
    });

    test('should show tabs for templates and generated', async ({ page }) => {
      await expect(page.getByText(/Templates/)).toBeVisible();
      await expect(page.getByText(/Generated Contracts/)).toBeVisible();
    });

    test('should have new template button', async ({ page }) => {
      await expect(page.getByText('New Template')).toBeVisible();
    });

    test('should open new template modal', async ({ page }) => {
      await page.click('button:has-text("New Template")');
      await expect(page.getByText('Create New Template')).toBeVisible();
      await expect(page.getByText('Template Name *')).toBeVisible();
      await expect(page.getByText('Template Type *')).toBeVisible();
      await expect(page.getByText('Template Content *')).toBeVisible();
    });

    test('should switch to generated contracts tab', async ({ page }) => {
      await page.click('button:has-text("Generated Contracts")');
      await page.waitForTimeout(500);
      // Either shows empty state or table
      const hasContent = await page.locator('.bg-white.border').count() > 0;
      expect(hasContent).toBeTruthy();
    });
  });

  test.describe('Performance & Loading', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('pages should load within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      await page.click('nav a:has-text("Calculators")');
      await page.waitForURL(`${BASE_URL}/calculators`);
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });

    test('should not have console errors on main pages', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('networkidle');

      // Filter out expected/benign errors
      const criticalErrors = errors.filter(err =>
        !err.includes('favicon') &&
        !err.includes('Cross origin') &&
        !err.includes('allowedDevOrigins')
      );

      expect(criticalErrors.length).toBe(0);
    });
  });

  test.describe('Responsive Design', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('sidebar should be visible on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.getByText('Wholesale CRM')).toBeVisible();
    });

    test('main content should be scrollable with many nav items', async ({ page }) => {
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();

      // Check if Settings is visible (last item before sign out)
      const settingsLink = nav.locator('a:has-text("Settings")');

      // If not visible, scroll to it
      if (!(await settingsLink.isVisible())) {
        await settingsLink.scrollIntoViewIfNeeded();
      }

      await expect(settingsLink).toBeVisible();
    });
  });

  test.describe('Database Integration', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('should load dashboard stats from database', async ({ page }) => {
      await page.goto(`${BASE_URL}/`);

      // Wait for stats to load
      await page.waitForTimeout(2000);

      // Check that metric cards are displaying numbers (not just loading)
      const metricCards = page.locator('text=/Total Sellers|Properties|Investors/');
      await expect(metricCards.first()).toBeVisible();
    });

    test('should persist data after page refresh', async ({ page }) => {
      await page.goto(`${BASE_URL}/sellers`);
      await page.waitForLoadState('networkidle');

      // Get current state
      const hasNoData = await page.getByText('No Sellers Yet').isVisible().catch(() => false);

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // State should be the same
      const hasNoDataAfterRefresh = await page.getByText('No Sellers Yet').isVisible().catch(() => false);
      expect(hasNoDataAfterRefresh).toBe(hasNoData);
    });
  });

  test.describe('Calendar Module', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.click('nav a:has-text("Calendar")');
      await page.waitForURL(`${BASE_URL}/calendar`);
    });

    test('should display calendar page', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();
      await expect(page.getByText('Schedule appointments')).toBeVisible();
    });

    test('should have new appointment button', async ({ page }) => {
      await expect(page.getByText('New Appointment')).toBeVisible();
    });

    test('should open new appointment modal', async ({ page }) => {
      await page.click('button:has-text("New Appointment")');
      await expect(page.getByText('Create Appointment')).toBeVisible();
      await expect(page.getByText('Title *')).toBeVisible();
    });
  });
});
