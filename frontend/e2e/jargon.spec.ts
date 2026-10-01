import { test, expect } from '@playwright/test';

const FORBIDDEN_CLIENT_JARGON = [
  'digital twin',
  'heterogeneous',
  'telemetry',
  'pareto',
  'surrogate',
  'exponent',
  'qubo',
  'metaheuristic'
];

test.describe('Client Mode Forbidden Jargon & Linguistic Guardrails', () => {
  test('Fleet overview page in Client Mode contains zero forbidden engineering jargon', async ({ page }) => {
    await page.goto('/');

    // Wait for the fleet overview content to load
    await expect(page.locator('h2').first()).toBeVisible();

    // Verify Client Mode is active
    const clientModeBtn = page.getByRole('button', { name: 'Client' });
    await expect(clientModeBtn).toBeVisible();
    await expect(clientModeBtn).toHaveAttribute('aria-pressed', 'true');

    // Get all rendered text in the main content container and topbar
    const mainText = (await page.locator('main').innerText()).toLowerCase();
    const headerText = (await page.locator('header').innerText()).toLowerCase();
    const sidebarText = (await page.locator('aside').innerText()).toLowerCase();
    const fullClientText = `${headerText}\n${sidebarText}\n${mainText}`;

    // Verify each forbidden term is absent
    const foundViolations: string[] = [];
    for (const term of FORBIDDEN_CLIENT_JARGON) {
      if (fullClientText.includes(term.toLowerCase())) {
        foundViolations.push(term);
      }
    }

    expect(
      foundViolations,
      `Forbidden jargon detected in Client Mode UI: ${foundViolations.join(', ')}`
    ).toEqual([]);
  });

  test('Page header and summary cards adhere to plain-language requirements', async ({ page }) => {
    await page.goto('/');

    // Verify plain sentence header
    await expect(page.getByText('See how your vessels are performing and get a recommended plan.')).toBeVisible();

    // Verify primary and secondary action button labels
    await expect(page.getByRole('button', { name: 'Find the best plan' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Test a storm' })).toBeVisible();

    // Verify Shore power text complies with Rule 2: "Can connect to shore power at berth"
    await expect(page.getByText('Can connect to shore power at berth')).toBeVisible();

    // Verify that "operating normally" is NOT present (Rule 3)
    const bodyText = (await page.locator('body').innerText()).toLowerCase();
    expect(bodyText.includes('operating normally')).toBeFalsy();
  });
});
