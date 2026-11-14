import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { JSDOM, VirtualConsole } from 'jsdom';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const errors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', e => errors.push(e.message));
async function page(path = '/', theme) {
 const file = join(root, path, path.endsWith('.html') ? '' : 'index.html');
 const dom = new JSDOM(readFileSync(file, 'utf8'), { url: `https://notatnik.example${path}`, runScripts: 'outside-only', virtualConsole });
 const w = dom.window;
 if(theme) w.localStorage.setItem('notatnik-theme', theme);
 w.IntersectionObserver = class { observe() {} disconnect() {} };
 for (const script of w.document.querySelectorAll('script')) {
  if (script.type && script.type !== 'module' && script.type !== 'text/javascript') continue;
  const code = script.src ? readFileSync(join(root,new URL(script.src).pathname),'utf8') : script.textContent;
  w.eval(code);
 }
 return dom;
}
const library = await page();
const w = library.window, d = w.document;
const visible = () => [...d.querySelectorAll('.note-card')].filter(c => !c.hidden);
assert.equal(visible().length, 6);
const search = d.querySelector('#search');
function query(value) { search.value = value; search.dispatchEvent(new w.Event('input')); }
query('SCIAGA');
assert.equal(visible().length, 1, 'Search ignores Polish accents and case');
assert.match(visible()[0].textContent,/terminala/);
query('nieistniejacy-temat');
assert.equal(visible().length, 0);
assert.equal(d.querySelector('.empty-state').hidden, false);
d.querySelector('#reset').click();
assert.equal(visible().length, 6);
d.querySelector('[data-category="Programowanie"].filter').click();
assert.equal(visible().length, 2);
query('TypeScript');
assert.equal(visible().length, 1, 'Search and category combine');
d.querySelector('#reset').click();
const selector = d.querySelector('#theme');
for(const theme of ['light','dark','cat']) {
 selector.value = theme; selector.dispatchEvent(new w.Event('change'));
 assert.equal(d.documentElement.dataset.theme,theme);
 assert.equal(w.localStorage.getItem('notatnik-theme'),theme);
}
const dark = await page('/','dark');
assert.equal(dark.window.document.documentElement.dataset.theme,'dark');
assert.equal(dark.window.document.querySelector('#theme').value,'dark');
const invalid = await page('/','invalid');
assert.equal(invalid.window.document.documentElement.dataset.theme,'cat');
const reader = await page('/notatki/03-kod/');
const rw = reader.window, rd = rw.document;
assert.equal(rd.querySelectorAll('.code-toolbar').length,3);
assert.equal(rd.querySelectorAll('.heading-anchor').length,4);
let copied = '';
Object.defineProperty(rw.navigator,'clipboard',{value:{writeText:async text=>{copied=text;}}});
rd.querySelector('.code-toolbar button').click();
await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(copied,rd.querySelector('pre code').textContent);
assert.match(rd.querySelector('.code-toolbar button').textContent,/Skopiowano/);
rw.navigator.clipboard.writeText=async()=>{throw new Error('Denied');};
rd.querySelector('.code-toolbar button').click();
await new Promise(resolve=>setTimeout(resolve,0));
assert.match(rd.querySelector('.code-toolbar button').textContent,/ręcznie/);
const table = await page('/notatki/02-szyfrowanie/');
assert.equal(table.window.document.querySelectorAll('.table-scroll table').length,1);
assert.equal(table.window.document.querySelector('.table-scroll').tabIndex,0);
let pages = 0;
function walk(dir) {
 for (const entry of readdirSync(dir,{withFileTypes:true})) {
  const file = join(dir,entry.name);
  if(entry.isDirectory()) walk(file);
  else if(entry.name.endsWith('.html')) {
   pages++;
   const doc = new JSDOM(readFileSync(file,'utf8')).window.document;
   assert.equal(doc.querySelectorAll('h1').length,1,`${file}: exactly one h1`);
   for(const a of doc.querySelectorAll('a[href]')) {
    const href=a.getAttribute('href');
    if(href.startsWith('#')) assert.ok(doc.getElementById(decodeURIComponent(href.slice(1))),`Missing anchor ${href}`);
    else if(href.startsWith('/')) assert.ok(existsSync(join(root,href.split('#')[0],'index.html')),`Missing route ${href}`);
   }
  }
 }
}
walk(root);
assert.equal(pages,8);
assert.deepEqual(errors,[]);
for(const dom of [library,dark,invalid,reader,table]) dom.window.close();
console.log('PASS: 8 pages, internal links and anchors, search, combined filters, empty/reset state, all themes and persistence, code copy success/failure, table scrolling wrapper.');
console.log('These DOM checks do not verify visual layout or real-device/browser behavior.');
