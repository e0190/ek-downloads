// Open https://news.ek in Firefox through the .ek helper, wait for the site to
// draw, and print every error the page logs. Screenshot to shots/.
import { firefox } from 'playwright';
const browser = await firefox.launch({
  proxy: { server: 'http://127.0.0.1:7333' },
  firefoxUserPrefs: { 'browser.fixup.domainsuffixwhitelist.ek': true, 'security.enterprise_roots.enabled': true },
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errors.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '')));
for (const f of [page.mainFrame()]) f.page().on('frameattached', (fr) => errors.push('frame: ' + fr.url()));
await page.goto('https://news.ek/', { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(12000);
await page.screenshot({ path: 'shots/firefox-waited.png' });
const frames = page.frames().map((f) => f.url());
let text = '';
for (const f of page.frames()) { try { text += (await f.evaluate(() => document.body?.innerText || '')).slice(0, 300) + '\n---\n'; } catch (e) { text += 'frame unreadable: ' + e.message + '\n'; } }
console.log('FRAMES', JSON.stringify(frames));
console.log('TEXT', text);
console.log('ERRORS\n' + errors.join('\n'));
await browser.close();
