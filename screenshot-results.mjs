import { chromium } from "playwright";

const BASE = "http://localhost:3002";

const fakeSession = {
  sessionId: "demo_session_1",
  role: "Senior Frontend Engineer",
  experience: "Mid-Level (3-5 yrs)",
  skills: ["React", "TypeScript", "Next.js", "Node.js"],
  interviewTypes: ["technical", "behavioral"],
  questions: [
    { id: "q_0", type: "technical", difficulty: "Medium", order: 0,
      text: "Explain the difference between controlled and uncontrolled components in React. When would you prefer one over the other?",
      hint: "Discuss state management, use cases for uncontrolled (file inputs, third-party DOM libraries), performance implications, and refs." },
    { id: "q_1", type: "technical", difficulty: "Hard", order: 1,
      text: "How does React's reconciliation algorithm (the diffing algorithm) work? What optimizations does it apply?",
      hint: "Explain same-level element comparison, key prop importance, component type comparison, and the O(n) heuristic approach." },
    { id: "q_2", type: "technical", difficulty: "Medium", order: 2,
      text: "What are the key differences between useMemo and useCallback hooks? Provide specific examples of when to use each.",
      hint: "useMemo for memoizing values, useCallback for memoizing functions, dependency arrays, performance trade-offs." },
    { id: "q_3", type: "technical", difficulty: "Hard", order: 3,
      text: "How would you implement code splitting and lazy loading in a large Next.js application to optimize bundle size?",
      hint: "Dynamic imports, React.lazy, Suspense, route-based splitting, component-level splitting, bundle analysis." },
    { id: "q_4", type: "technical", difficulty: "Easy", order: 4,
      text: "Explain the concept of closures in JavaScript and give an example of how they can cause unexpected behavior.",
      hint: "Lexical scope, variable capture, common pitfall with loops and async callbacks, solutions using let or IIFE." },
    { id: "q_5", type: "behavioral", difficulty: "Medium", order: 5,
      text: "Tell me about a time when you had to make a critical technical decision with incomplete information. How did you approach it?",
      hint: "Use STAR method. Emphasize risk assessment, gathering available data, consulting stakeholders, iterating quickly, and learning from outcome." },
    { id: "q_6", type: "behavioral", difficulty: "Medium", order: 6,
      text: "Describe a situation where you disagreed with your team lead's technical approach. How did you handle it?",
      hint: "Show professionalism, data-driven arguments, willingness to compromise, and respect for hierarchy while advocating for quality." },
    { id: "q_7", type: "behavioral", difficulty: "Easy", order: 7,
      text: "Walk me through how you stay current with new frontend technologies and decide which ones to adopt in your projects.",
      hint: "Mention specific resources (blogs, conferences, GitHub), evaluation criteria, proof-of-concept approach, and team knowledge sharing." },
    { id: "q_8", type: "behavioral", difficulty: "Hard", order: 8,
      text: "Tell me about a time a project you were leading was significantly delayed or failed. What happened and what did you learn?",
      hint: "Own the failure, show accountability, specific root cause analysis, concrete changes made afterwards, emphasize growth." },
    { id: "q_9", type: "behavioral", difficulty: "Medium", order: 9,
      text: "Describe how you approach mentoring junior developers while still maintaining your own productivity.",
      hint: "Structured 1:1s, code reviews as teaching moments, pair programming, documentation culture, time management." },
  ],
  createdAt: new Date().toISOString(),
};

async function shotResults(page, theme, outFile) {
  // 1. Set localStorage with theme and fake session
  await page.goto(`${BASE}/dashboard/practice`, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(800);
  await page.evaluate(({ session, t }) => {
    localStorage.setItem("theme", t);
    localStorage.setItem("prepai_sessions", JSON.stringify([session]));
  }, { session: fakeSession, t: theme });

  // 2. Reload to pick up the session history
  await page.reload({ waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(1500);

  // 3. Click the restore (RotateCcw) button in SessionHistory
  const restoreBtn = page.locator('[title="Restore this session"]').first();
  if (await restoreBtn.isVisible()) {
    await restoreBtn.click();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: outFile, fullPage: true });
  console.log("✓", outFile);
}

async function shotForm(page, theme, outFile) {
  await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
  await page.goto(`${BASE}/dashboard/practice`, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: outFile, fullPage: true });
  console.log("✓", outFile);
}

const browser = await chromium.launch({
  args: ["--ignore-certificate-errors", "--no-sandbox"],
});

for (const theme of ["dark", "light"]) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: theme,
  });
  const page = await ctx.newPage();

  await shotForm(page, theme, `ss-practice-form-${theme}.png`);
  await shotResults(page, theme, `ss-practice-results-${theme}.png`);

  await ctx.close();
}

await browser.close();
console.log("All done.");
