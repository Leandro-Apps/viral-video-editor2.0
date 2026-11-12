// Capture screenshots and screen recordings of a brand's site or app into its media library (Drive <brand> Videos/midia).
// Usage: node capture.js <shots.json> [--only name1,name2] [--headed]
//   NODE_PATH must reach a playwright install (see run.sh). Auth: shots.json "auth" = a Playwright storage-state file that
//   the owner created by logging in himself (login.js); this tool never types passwords.
// shots.json: { "out": "<media dir>", "base": "https://site", "auth": null|"<file>", "viewport": [1920,1080], "scale": 2,
//   "shots": [ { "name": "landing-hero", "url": "/", "kind": "print"|"video"|"both", "wait": 2500, "full": false,
//               "steps": [ {"scroll": 1400, "ms": 4000}, {"click": "text=Get started"}, {"wait": 1500}, {"hover": "css"},
//                          {"type": ["css", "text"]}, {"shot": "name-suffix"} ], "hide": ["css of cookie banners"] } ] }
// Prints -> out/prints/<name>.png (viewport x scale); videos -> out/screen-recordings/<name>-screen.mp4 (1920x1080, H.264, muted).
// Never submits forms: a step that clicks a submit button must say "allowSubmit": true in the shot.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');

const cfgPath = process.argv[2];
const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const headed = process.argv.includes('--headed');
const C = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const [W, H] = C.viewport || [1920, 1080];
const out = C.out, prints = path.join(out, 'prints'), recs = path.join(out, 'screen-recordings');
fs.mkdirSync(prints, { recursive: true }); fs.mkdirSync(recs, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function smoothScroll(page, dy, ms) {
  await page.evaluate(async ({ dy, ms }) => {
    const start = window.scrollY, t0 = performance.now();
    await new Promise(res => { const f = t => { const k = Math.min(1, (t - t0) / ms); const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      window.scrollTo(0, start + dy * e); k < 1 ? requestAnimationFrame(f) : res(); }; requestAnimationFrame(f); });
  }, { dy, ms });
}

async function runShot(browser, s) {
  const video = s.kind === 'video' || s.kind === 'both';
  const ctxOpts = { viewport: { width: W, height: H }, deviceScaleFactor: video ? 1 : (C.scale || 2), locale: C.locale || 'en-US' };
  if (C.auth) ctxOpts.storageState = C.auth;
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'cap-'));
  if (video) ctxOpts.recordVideo = { dir: tmp, size: { width: W, height: H } };
  const ctx = await browser.newContext(ctxOpts);
  const hide = ['[class*=cookie i]', '[id*=cookie i]', '[class*=consent i]', '[id*=consent i]'].concat(C.hide || [], s.hide || []);   // cookie banners hidden from the first frame
  await ctx.addInitScript(css => { const add = () => { const st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st); };
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', add) : add(); }, hide.map(h => `${h}{display:none!important}`).join('\n'));
  const page = await ctx.newPage();
  const t0 = Date.now();
  const url = s.url.startsWith('http') ? s.url : C.base + s.url;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => page.goto(url, { waitUntil: 'load', timeout: 60000 }));
  await sleep(s.wait ?? 2500);
  const tReady = (Date.now() - t0) / 1000;   // the video starts here: no loading frames
  const shots = [];
  const snap = async (suffix) => { if (s.kind === 'video') return; const f = path.join(prints, s.name + (suffix ? '-' + suffix : '') + '.png'); await page.screenshot({ path: f, fullPage: !!s.full }); shots.push(path.basename(f)); };
  for (const st of s.steps || []) {
    if (st.scroll != null) await smoothScroll(page, st.scroll, st.ms || 3000);
    if (st.to) { await page.locator(st.to).first().scrollIntoViewIfNeeded().catch(() => {}); }
    if (st.hover) await page.locator(st.hover).first().hover().catch(e => console.log('  hover miss', st.hover));
    if (st.click) {
      if (/submit|send|enviar|get my|see my results/i.test(st.click) && !s.allowSubmit) { console.log('  skipped submit-like click', st.click); continue; }
      await page.locator(st.click).first().click({ timeout: 8000 }).catch(e => console.log('  click miss', st.click));
    }
    if (st.type) await page.locator(st.type[0]).first().fill(st.type[1]).catch(() => console.log('  type miss', st.type[0]));
    if (st.pick) {   // answer quiz steps: click the first answer option, stop at the contact form (never fills or submits it)
      for (let i = 0; i < st.pick; i++) {
        if (await page.locator('input[type=email]:visible, input[type=tel]:visible, input[name*=phone i]:visible, main input[type=text]:visible, main input[type=number]:visible, input[inputmode=numeric]:visible').count()) { console.log('  reached a field to type (contact, ZIP...), stop: nothing is typed or sent'); break; }
        const deny = new RegExp(st.deny || '^(back|voltar|previous|see work|accept all|only necessary|necessary|manage preferences|free inspection|menu)$', 'i');
        const cands = await page.$$('main button:visible, [role=radio]:visible, [role=option]:visible, button:visible');
        let clicked = false;
        for (const c of cands) {
          const t = ((await c.innerText().catch(() => '')) || '').trim();
          if (!t || deny.test(t) || /\?$/.test(t)) continue;
          const inHeader = await c.evaluate(e => !!e.closest('header, nav, footer, [class*=cookie i], [id*=cookie i]'));
          if (inHeader) continue;
          if (st.prefer && !new RegExp(st.prefer, 'i').test(t) && i === 0) continue;
          const before = await page.locator('h1:visible, h2:visible, h3:visible').first().innerText().catch(() => '');
          await c.click().catch(() => {}); clicked = true;
          await sleep(900);
          const after = await page.locator('h1:visible, h2:visible, h3:visible').first().innerText().catch(() => '');
          if (after === before) {   // multi-select step: same question after the click, so press its continue button
            const next = page.locator('button:visible').filter({ hasText: /^\s*(next|continue|confirm)\b/i }).first();
            if (await next.count()) await next.click().catch(() => {});
          }
          break;
        }
        if (!clicked) break;
        await sleep(st.ms || 1600);
        if (st.shotEach) await snap('passo' + (i + 1));
      }
    }
    if (st.wait) await sleep(st.wait);
    if (st.shot !== undefined) await snap(st.shot);
  }
  if (!(s.steps || []).some(st => st.shot !== undefined)) await snap('');
  await sleep(video ? 1200 : 0);
  const v = video ? page.video() : null;
  await ctx.close();
  if (v) {
    const webm = await v.path(), mp4 = path.join(recs, s.name + '-screen.mp4');
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(s.trim ?? Math.max(0, tReady - 0.6).toFixed(2)), '-i', webm, '-c:v', 'libx264', '-crf', '20', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', mp4]);
    shots.push(path.basename(mp4));
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  return shots;
}

(async () => {
  const browser = await chromium.launch({ headless: !headed });
  const index = [];
  for (const s of C.shots) {
    if (only.length && !only.includes(s.name)) continue;
    try { const files = await runShot(browser, s); console.log('ok', s.name, files.join(' ')); index.push({ name: s.name, url: s.url, what: s.what || '', files }); }
    catch (e) { console.log('FAIL', s.name, String(e).slice(0, 200)); }
  }
  await browser.close();
  const idx = path.join(out, 'capturas.json');
  const prev = fs.existsSync(idx) ? JSON.parse(fs.readFileSync(idx, 'utf8')) : [];
  const merged = prev.filter(p => !index.some(n => n.name === p.name)).concat(index);
  fs.writeFileSync(idx, JSON.stringify(merged, null, 1));
})();
