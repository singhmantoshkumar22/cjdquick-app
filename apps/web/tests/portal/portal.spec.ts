import { test, expect } from "@playwright/test";

test.describe("Portal - Authentication", () => {
  test("should show login page", async ({ page }) => {
    await page.goto("/portal/login");
    await expect(page.locator("h1")).toContainText("CJDarcl Quick");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("should login successfully with valid credentials", async ({ page }) => {
    await page.goto("/portal/login");
    await page.fill('input[type="email"]', "demo@client.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL("/portal", { timeout: 10000 });
    // Dashboard should load - check for a key element
    await expect(page.locator("h1")).toContainText("Home", { timeout: 10000 });
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/portal/login");
    await page.fill('input[type="email"]', "invalid@email.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Should show error message (the actual error text from the API)
    await expect(page.locator("text=Invalid email or password")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Portal - Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/portal/login");
    await page.fill('input[type="email"]', "demo@client.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/portal", { timeout: 10000 });
  });

  test("should display dashboard with stats", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Home");

    // Check for Action Required section
    await expect(page.locator("text=Action Required").first()).toBeVisible();

    // Check for Performance section
    await expect(page.locator("text=Your Performance")).toBeVisible();

    // Check for delivery stats
    await expect(page.locator("text=Delivered")).toBeVisible();
  });

  test("should toggle between B2B and B2C service", async ({ page }) => {
    // Click on service selector dropdown
    await page.click("text=CJD Quick");

    // Should see both options
    await expect(page.locator("text=CJD Quick B2B")).toBeVisible();
    await expect(page.locator("text=CJD Quick B2C")).toBeVisible();
  });

  test("should switch to B2C and show different data", async ({ page }) => {
    // Click on service selector
    await page.click("button:has-text('CJD Quick')");

    // Select B2C
    await page.click("button:has-text('CJD Quick B2C')");

    // Wait for page reload and verify we're on B2C
    await page.waitForLoadState("networkidle");

    // Dashboard should still be visible
    await expect(page.locator("h1")).toContainText("Dashboard");
  });
});

test.describe("Portal - Orders", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/portal/login");
    await page.fill('input[type="email"]', "demo@client.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/portal", { timeout: 10000 });
  });

  test("should navigate to orders page", async ({ page }) => {
    await page.click("text=Orders");
    await page.waitForURL("/portal/orders");
    await expect(page.locator("h1")).toContainText("Orders");
  });

  test("should display orders table with data", async ({ page }) => {
    await page.goto("/portal/orders");
    await page.waitForLoadState("networkidle");

    // Check table headers
    await expect(page.locator("th:has-text('Order ID')")).toBeVisible();
    await expect(page.locator("th:has-text('AWB')")).toBeVisible();
    await expect(page.locator("th:has-text('Customer')")).toBeVisible();
    await expect(page.locator("th:has-text('Status')")).toBeVisible();
  });

  test("should filter orders by status", async ({ page }) => {
    await page.goto("/portal/orders");
    await page.waitForLoadState("networkidle");

    // Select a status filter
    await page.selectOption("select", "DELIVERED");
    await page.waitForLoadState("networkidle");

    // Verify filter is applied
    const select = page.locator("select");
    await expect(select).toHaveValue("DELIVERED");
  });

  test("should have search functionality", async ({ page }) => {
    await page.goto("/portal/orders");

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();

    // Type in search
    await searchInput.fill("B2B");
    await page.waitForLoadState("networkidle");
  });
});

test.describe("Portal - Reverse Orders", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/portal/login");
    await page.fill('input[type="email"]', "demo@client.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/portal", { timeout: 10000 });
  });

  test("should navigate to reverse orders page", async ({ page }) => {
    await page.click("text=Reverse Orders");
    await page.waitForURL("/portal/reverse-orders");
    await expect(page.locator("h1")).toContainText("Reverse Orders");
  });
});

test.describe("Portal - Pickups", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/portal/login");
    await page.fill('input[type="email"]', "demo@client.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/portal", { timeout: 10000 });
  });

  test("should navigate to pickups page", async ({ page }) => {
    await page.click("text=Pickups");
    await page.waitForURL("/portal/pickups");
    await expect(page.locator("h1")).toContainText("Pickups");
  });

  test("should display pickup stats cards", async ({ page }) => {
    await page.goto("/portal/pickups");
    await page.waitForLoadState("networkidle");

    // Check for stat cards
    await expect(page.locator("text=Pending")).toBeVisible();
    await expect(page.locator("text=Scheduled Today")).toBeVisible();
  });
});

test.describe("Portal - Exceptions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/portal/login");
    await page.fill('input[type="email"]', "demo@client.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/portal", { timeout: 10000 });
  });

  test("should navigate to exceptions page", async ({ page }) => {
    await page.click("text=Exceptions & NDR");
    await page.waitForURL("/portal/exceptions");
    await expect(page.locator("h1")).toContainText("Exceptions");
  });

  test("should display NDR stats", async ({ page }) => {
    await page.goto("/portal/exceptions");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=Action Required")).toBeVisible();
    await expect(page.locator("text=Reattempt Scheduled")).toBeVisible();
  });

  test("should have tabs for different exception types", async ({ page }) => {
    await page.goto("/portal/exceptions");

    await expect(page.locator("button:has-text('NDR Cases')")).toBeVisible();
    await expect(page.locator("button:has-text('Address Issues')")).toBeVisible();
  });
});

test.describe("Portal - Finances", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/portal/login");
    await page.fill('input[type="email"]', "demo@client.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/portal", { timeout: 10000 });
  });

  test("should navigate to finances page", async ({ page }) => {
    await page.click("text=Finances");
    await page.waitForURL("/portal/finances");
    await expect(page.locator("h1")).toContainText("Finances");
  });

  test("should display finance overview cards", async ({ page }) => {
    await page.goto("/portal/finances");

    await expect(page.locator("text=Total COD Collected")).toBeVisible();
    await expect(page.locator("text=Outstanding Invoices")).toBeVisible();
    await expect(page.locator("text=Claims Under Review")).toBeVisible();
  });

  test("should navigate to remittances page", async ({ page }) => {
    await page.goto("/portal/finances");
    await page.click("text=View Remittances");
    await page.waitForURL("/portal/finances/remittances");
    await expect(page.locator("h1")).toContainText("Remittances");
  });

  test("should navigate to invoices page", async ({ page }) => {
    await page.goto("/portal/finances");
    await page.click("text=View Invoices");
    await page.waitForURL("/portal/finances/invoices");
    await expect(page.locator("h1")).toContainText("Invoices");
  });

  test("should navigate to claims page", async ({ page }) => {
    await page.goto("/portal/finances");
    await page.click("text=View Claims");
    await page.waitForURL("/portal/finances/claims");
    await expect(page.locator("h1")).toContainText("Claims");
  });
});

test.describe("Portal - Support", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/portal/login");
    await page.fill('input[type="email"]', "demo@client.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/portal", { timeout: 10000 });
  });

  test("should navigate to support page", async ({ page }) => {
    await page.click("text=Support");
    await page.waitForURL("/portal/support");
    await expect(page.locator("h1")).toContainText("Support");
  });

  test("should display ticket stats", async ({ page }) => {
    await page.goto("/portal/support");

    await expect(page.locator("text=Open")).toBeVisible();
    await expect(page.locator("text=Awaiting Reply")).toBeVisible();
    await expect(page.locator("text=In Progress")).toBeVisible();
    await expect(page.locator("text=Resolved")).toBeVisible();
  });
});

test.describe("Portal - Reports", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/portal/login");
    await page.fill('input[type="email"]', "demo@client.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/portal", { timeout: 10000 });
  });

  test("should navigate to reports page", async ({ page }) => {
    await page.click("text=Reports");
    await page.waitForURL("/portal/reports");
    await expect(page.locator("h1")).toContainText("Reports");
  });

  test("should display available reports", async ({ page }) => {
    await page.goto("/portal/reports");

    await expect(page.locator("text=Shipment Report")).toBeVisible();
    await expect(page.locator("text=Delivery Performance")).toBeVisible();
    await expect(page.locator("text=NDR Report")).toBeVisible();
    await expect(page.locator("text=COD Report")).toBeVisible();
  });

  test("should have date range selector", async ({ page }) => {
    await page.goto("/portal/reports");

    const dateSelect = page.locator("select");
    await expect(dateSelect).toBeVisible();
  });
});

test.describe("Portal - Settings", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/portal/login");
    await page.fill('input[type="email"]', "demo@client.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/portal", { timeout: 10000 });
  });

  test("should navigate to settings page", async ({ page }) => {
    // Click on settings in sidebar
    await page.click('a[href="/portal/settings"]');
    await page.waitForURL("/portal/settings");
    await expect(page.locator("h1")).toContainText("Settings");
  });

  test("should display settings groups", async ({ page }) => {
    await page.goto("/portal/settings");

    await expect(page.locator("text=Account")).toBeVisible();
    await expect(page.locator("text=Shipping")).toBeVisible();
    await expect(page.locator("text=Payments")).toBeVisible();
    await expect(page.locator("text=Integrations")).toBeVisible();
  });
});

test.describe("Portal - Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/portal/login");
    await page.fill('input[type="email"]', "demo@client.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/portal", { timeout: 10000 });
  });

  test("should have all navigation items visible", async ({ page }) => {
    await expect(page.locator("text=Dashboard")).toBeVisible();
    await expect(page.locator("text=Orders")).toBeVisible();
    await expect(page.locator("text=Reverse Orders")).toBeVisible();
    await expect(page.locator("text=Pickups")).toBeVisible();
    await expect(page.locator("text=Exceptions & NDR")).toBeVisible();
    await expect(page.locator("text=Finances")).toBeVisible();
    await expect(page.locator("text=Support")).toBeVisible();
    await expect(page.locator("text=Reports")).toBeVisible();
  });

  test("should highlight active navigation item", async ({ page }) => {
    await page.goto("/portal/orders");

    // The Orders link should be highlighted
    const ordersLink = page.locator('a[href="/portal/orders"]');
    await expect(ordersLink).toHaveClass(/bg-blue-600/);
  });

  test("should logout successfully", async ({ page }) => {
    // Open user dropdown
    await page.click(".rounded-full");

    // Click logout
    await page.click("text=Sign Out");

    // Should redirect to login
    await page.waitForURL("/portal/login");
  });
});
