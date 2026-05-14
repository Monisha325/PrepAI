import { chromium } from "playwright";

const BASE = "http://localhost:3002";

async function shot(page, url, filename, wait = 2000) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(wait);
  await page.screenshot({ path: filename, fullPage: true });
  console.log("✓", filename);
}

const browser = await chromium.launch({
  args: ["--ignore-certificate-errors", "--no-sandbox"],
});

// Dark mode
const dark = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "dark",
});
const dp = await dark.newPage();
await dp.addInitScript(() => localStorage.setItem("theme", "dark"));
await shot(dp, BASE + "/dashboard/practice", "ss-practice-form-dark.png");
await dark.close();

// Light mode
const light = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "light",
});
const lp = await light.newPage();
await lp.addInitScript(() => localStorage.setItem("theme", "light"));
await shot(lp, BASE + "/dashboard/practice", "ss-practice-form-light.png");
await light.close();

await browser.close();
console.log("Done.");
