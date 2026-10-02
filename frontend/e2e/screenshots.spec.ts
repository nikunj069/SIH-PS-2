import { test } from '@playwright/test';

const viewports = [
  { width: 1280, height: 720, name: '1280x720' },
  { width: 1440, height: 900, name: '1440x900' },
  { width: 1920, height: 1080, name: '1920x1080' },
  { width: 1024, height: 768, name: '1024x768' },
  { width: 390, height: 844, name: '390x844' },
];

const screens = [
  { id: 'command', name: 'Fleet overview', navText: 'Fleet Command Center' }, // We'll click sidebar by text
  { id: 'twin-map', name: 'Fleet map', navText: 'Digital Twin Map' },
  { id: 'fuels', name: 'Fuel options', navText: 'Fuel Intelligence' },
  { id: 'telemetry', name: 'Optimization progress', navText: 'Optimizer Telemetry' },
  { id: 'pareto', name: 'Compare plans', navText: 'Pareto Explorer' },
  { id: 'storm', name: 'What-if scenarios', navText: 'Storm Simulator' },
  { id: 'replay', name: 'Voyage review', navText: 'Voyage Replay' },
];

test('capture screenshots of all screens at all viewports', async ({ page }) => {
  await page.goto('/');

  // Exit demo if it's running automatically
  try {
    const exitDemoBtn = page.getByRole('button', { name: 'Exit demo' });
    if (await exitDemoBtn.isVisible({ timeout: 2000 })) {
      await exitDemoBtn.click();
    }
  } catch (e) {
    // Ignore if not found
  }

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(500); // Give layout time to adjust

    for (const screen of screens) {
      // Find the sidebar item by text and click it
      // Based on Sidebar.tsx which lists options
      let navFound = false;
      
      // On mobile, we might need to open the menu first, but for now assuming we can just click text
      if (vp.width < 1024) {
         // try opening mobile menu
         try {
             await page.getByRole('button', { name: 'Menu' }).click({ timeout: 1000 });
         } catch(e) {}
      }

      try {
        await page.getByText(screen.navText, { exact: false }).first().click({ timeout: 2000 });
        navFound = true;
      } catch (e) {
        console.log(`Could not click ${screen.navText}`);
      }

      if (navFound) {
        await page.waitForTimeout(500); // Wait for render
        await page.screenshot({ path: `screenshots/${screen.id}-${vp.name}.png`, fullPage: true });
      }
    }
  }
});
