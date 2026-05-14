import { chromium } from "playwright";

const BASE = "http://localhost:3001";

const pages = [
  { path: "/dashboard", name: "overview" },
  { path: "/dashboard/practice", name: "practice" },
  { path: "/dashboard/mock", name: "mock" },
  { path: "/dashboard/resume", name: "resume" },
  { path: "/dashboard/analytics", name: "analytics" },
  { path: "/dashboard/settings", name: "settings" },
];

async function shot(page, url, filename, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(1800);
      await page.screenshot({ path: filename, fullPage: true });
      console.log("✓", filename);
      return;
    } catch (e) {
      if (i === retries - 1) throw e;
      console.log(`  retry ${i + 1} for ${url}`);
      await page.waitForTimeout(2000);
    }
  }
}

const browser = await chromium.launch({
  args: ["--ignore-certificate-errors", "--no-sandbox"],
});

// Dark mode
const dark = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "dark",
});
const darkPage = await dark.newPage();
await darkPage.addInitScript(() => {
  localStorage.setItem("theme", "dark");
});

for (const p of pages) {
  await shot(darkPage, BASE + p.path, `ss-${p.name}-dark.png`);
}
await dark.close();

// Light mode
const light = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "light",
});
const lightPage = await light.newPage();
await lightPage.addInitScript(() => {
  localStorage.setItem("theme", "light");
});

for (const p of pages) {
  await shot(lightPage, BASE + p.path, `ss-${p.name}-light.png`);
}
await light.close();

await browser.close();
console.log("All screenshots done.");
