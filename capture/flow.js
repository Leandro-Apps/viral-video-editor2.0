// FlowRecorder: records an app flow as STATES (one high-res screenshot per state) plus the box of every element the
// user acts on. The kit element `screenDemo` turns a flow into the house screen-demo animation (camera zoom on each
// action, gliding cursor, click ripple, result highlight), the style of a typical product-homepage demo video.
// flow.json: { app: [w, h] (CSS px of the capture viewport), scale, steps: [ { shot, action, box, text, at } ] }
//   action: 'start' | 'click' | 'type' | 'select' | 'scroll' | 'result' | 'hold' ; box: [x, y, w, h] in CSS px of the app
const fs = require('fs'), path = require('path');

class FlowRecorder {
  constructor(page, dir, opts = {}) {
    this.page = page; this.dir = dir; this.steps = []; this.n = 0;
    this.app = opts.app || [1440, 900]; this.scale = opts.scale || 2.5;
    fs.mkdirSync(dir, { recursive: true });
  }
  async box(loc) { const b = await loc.first().boundingBox(); return b ? [b.x, b.y, b.width, b.height].map(v => Math.round(v)) : null; }
  async shot(action = 'hold', box = null, extra = {}) {
    await this.page.evaluate(() => document.fonts.ready).catch(() => {});
    await this.page.evaluate(() => document.querySelectorAll('img').forEach(i => { if (i.complete && !i.naturalWidth) i.style.visibility = 'hidden'; })).catch(() => {});   // broken images show alt text
    await this.page.waitForTimeout(300);
    const name = String(++this.n).padStart(2, '0') + '-' + action + '.jpg';
    await this.page.screenshot({ path: path.join(this.dir, name), type: 'jpeg', quality: 88 });
    this.steps.push(Object.assign({ shot: name, action, box }, extra));
  }
  async start() { await this.shot('start'); }
  // click: the box is measured BEFORE the click (where the cursor goes), the state is shot AFTER (what the click shows)
  async click(loc, opts = {}) { const box = await this.box(loc); await loc.first().click(); await this.page.waitForTimeout(opts.wait ?? 900); await this.shot('click', box, opts.label ? { label: opts.label } : {}); }
  // type: progressive frames of the text (the animation swaps them like keystrokes)
  async type(loc, text, opts = {}) {
    const box = await this.box(loc); await loc.first().click(); const frames = opts.frames ?? Math.min(4, Math.max(2, Math.ceil(text.length / 5)));
    for (let i = 1; i <= frames; i++) { await loc.first().fill(text.slice(0, Math.ceil(text.length * i / frames))); await this.shot('type', box, { text }); }
  }
  async select(loc, label) { const box = await this.box(loc); await loc.first().selectOption({ label }); await this.page.waitForTimeout(500); await this.shot('select', box); }
  // result: the state that proves the outcome; box = what to highlight (a new row, a total, a chart)
  async result(loc, opts = {}) { const box = loc ? await this.box(loc) : null; await this.shot('result', box, opts.label ? { label: opts.label } : {}); }
  save(meta = {}) {
    const f = path.join(this.dir, 'flow.json');
    fs.writeFileSync(f, JSON.stringify(Object.assign({ app: this.app, scale: this.scale, steps: this.steps }, meta), null, 1));
    return f;
  }
}
module.exports = { FlowRecorder };
