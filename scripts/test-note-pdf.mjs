/** Run against a local dev server: PDF_TEST_URL=http://127.0.0.1:4321 npm run test:pdf */
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';
const base = process.env.PDF_TEST_URL || 'http://127.0.0.1:4321';
const output = await mkdtemp(join(tmpdir(), 'note-pdf-'));
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}),
});
try {
 for (const [width,theme,cute] of [[1440,'dark','false'],[1440,'light','false'],[390,'dark','true'],[390,'light','true']]) {
  const page = await browser.newPage({viewport:{width,height:900},acceptDownloads:true});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${base}/przedmioty/bsi/bsi-kolokwium-1-praktyka/`);
  await page.waitForLoadState('networkidle');
  await page.evaluate(({theme,cute})=>{
   document.documentElement.dataset.theme=theme;document.documentElement.dataset.cute=cute;
   document.querySelectorAll('.prose details').forEach(el=>el.open=false);
   window.__pdfMutations=[];
   const observer=new MutationObserver(mutations=>window.__pdfMutations.push(...mutations.map(m=>m.attributeName)));
   observer.observe(document.documentElement,{attributes:true});
   observer.observe(document.body,{attributes:true});
   document.querySelectorAll('.prose details').forEach(el=>observer.observe(el,{attributes:true}));
  },{theme,cute});
  await page.locator('.note-download-summary').click();
  const initial=await page.evaluate(()=>({x:scrollX,y:scrollY,width:document.documentElement.scrollWidth}));
  // Continuous frame sampling catches transient flashes, hidden actions and scroll jumps.
  await page.evaluate(()=>{
   window.__pdfVisualFailures=[];window.__pdfSampling=true;
   const actions=document.querySelector('.note-head-actions');
   const bounds=actions.getBoundingClientRect();
   const background=getComputedStyle(document.body).backgroundColor;
   const tick=()=>{
    if(!window.__pdfSampling)return;
    const current=actions.getBoundingClientRect();
    const exportDoc=document.querySelector('iframe[title="Przygotowanie pliku PDF"]')?.contentDocument;
    const source=exportDoc?.querySelector('.note-main');
    if(source?.style.height && source.style.height!=='auto')window.__pdfVisualFailures.push('Fixed article height can truncate paginated PDF');
    if(getComputedStyle(actions).display==='none'||Math.abs(current.top-bounds.top)>1||getComputedStyle(document.body).backgroundColor!==background)window.__pdfVisualFailures.push('Visible page changed');
    requestAnimationFrame(tick);
   };requestAnimationFrame(tick);
  });
  const pending=page.waitForEvent('download',{timeout:120000});
  await page.locator('[data-note-pdf]').click();
  const download=await pending;
  const file=join(output,`${width}-${theme}-${cute}.pdf`);await download.saveAs(file);
  await page.waitForFunction(()=>document.querySelectorAll('.html2pdf__overlay, iframe[title="Przygotowanie pliku PDF"]').length===0);
  const state=await page.evaluate(()=>{window.__pdfSampling=false;return {mutations:window.__pdfMutations,visual:window.__pdfVisualFailures,x:scrollX,y:scrollY,width:document.documentElement.scrollWidth,open:[...document.querySelectorAll('.prose details')].some(el=>el.open)};});
  assert.deepEqual(state.mutations,[]);assert.deepEqual(state.visual,[]);assert.equal(state.open,false);
  assert.equal(state.x,initial.x);assert.equal(state.y,initial.y);assert.equal(state.width,initial.width);
  assert.deepEqual(errors,[]);
  const pdf=await readFile(file);assert.equal(pdf.subarray(0,5).toString(),'%PDF-');assert.ok(pdf.length>10000);
  console.log(`PASS ${width}px / theme=${theme} / cute=${cute}: PDF, no flash, actions visible, details/scroll unchanged, cleanup`);
  if(width===390 && theme==='light') {
   await page.evaluate(()=>{window.__printCalled=false;window.print=()=>{window.__printCalled=true;};const img=document.createElement('img');img.src='/missing-pdf-test-image.png';document.querySelector('.prose').append(img);});
   await page.locator('.note-download-summary').click();await page.locator('[data-note-pdf]').click();
   await page.getByRole('alert').filter({hasText:'Nie udało się pobrać PDF'}).waitFor();
   assert.equal(await page.evaluate(()=>window.__printCalled),false);
   assert.equal(await page.locator('iframe[title="Przygotowanie pliku PDF"], .html2pdf__overlay').count(),0);
   assert.equal(await page.locator('[data-note-pdf]').isEnabled(),true);
   console.log('PASS failed image: error message, retry enabled, no print dialog, cleanup');
  }
  await page.close();
 }
 console.log(`PDF files for visual inspection: ${output}`);
} finally {await browser.close();}
