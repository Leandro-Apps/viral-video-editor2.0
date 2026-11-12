// Open a visible browser window on a site's login page so the OWNER logs in themself; then save the session
// (Playwright storage state) for capture.js. This tool never sees or types the password.
// Usage: NODE_PATH=... node login.js <login-url> <out-state.json> [<url-pattern-after-login>]
// Example: ./login.sh https://example.com/login ./session.json dashboard
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [url, out, done = ''] = process.argv.slice(2);
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(url);
  console.log('Log in in the window that just opened. Waiting up to 10 minutes...');
  const loginPath = new URL(url).pathname;
  const t0 = Date.now();
  while (Date.now() - t0 < 600000) {
    await page.waitForTimeout(2000);
    const u = page.url();
    if (!u.includes(loginPath) && (!done || u.includes(done))) break;
  }
  await page.waitForTimeout(4000);
  await ctx.storageState({ path: out });
  fs.chmodSync(out, 0o600);   // session tokens: readable only by this Mac user; never commit or upload
  console.log('Session saved to', out);
  await browser.close();
})();
