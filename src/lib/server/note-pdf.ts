import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { readFile, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { parse } from 'yaml';
import { renderPdfMarkdown } from '../../markdown/user.mjs';
import katexCss from 'katex/dist/katex.min.css?raw';

const require = createRequire(import.meta.url);
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const css = `
@page { size:A4; margin:17mm 15mm 19mm; }
* { box-sizing:border-box; }
html { color-scheme:light; }
body { margin:0; color:#24292f; background:white; font:10.5pt/1.55 PdfSans,sans-serif; overflow-wrap:anywhere; }
h1 { font-size:23pt; line-height:1.2; margin:0 0 12pt; }
header { border-bottom:1px solid #d0d7de; padding-bottom:13pt; margin-bottom:20pt; }
header p { color:#57606a; margin:7pt 0; }
h2 { font-size:15pt; border-bottom:1px solid #d8dee4; padding-bottom:5pt; margin:22pt 0 10pt; }
h3 { font-size:12pt; margin:17pt 0 8pt; }
h1,h2,h3,h4,summary { break-after:avoid; break-inside:avoid; line-height:1.3; }
p { margin:8pt 0; widows:3; orphans:3; }
li { margin:3pt 0; break-inside:avoid; }
ul,ol { padding-left:19pt; }
a { color:#0969da; text-decoration:underline; }
code,pre { font-family:PdfMono,monospace; font-variant-ligatures:none; }
:not(pre)>code { font-size:.88em; padding:1pt 3pt; background:#eff1f3; border-radius:3pt; box-decoration-break:clone; }
pre { font-size:8.4pt; line-height:1.5; margin:0; padding:10pt; white-space:pre-wrap!important; overflow-wrap:anywhere!important; word-break:break-word; }
pre code { white-space:inherit!important; width:auto!important; min-width:0!important; }
.astro-code,.astro-code span { color:var(--shiki-light,#24292f)!important; background:transparent!important; }
.code-block { border:1px solid #d0d7de; background:#f6f8fa; border-radius:4pt; margin:12pt 0; box-decoration-break:clone; }
.code-header { background:#eaeef2; color:#57606a; border-bottom:1px solid #d0d7de; font-size:8pt; padding:5pt 10pt; break-after:avoid; }
.code-copy,.heading-anchor,.katex-mathml { display:none!important; }
pre,.code-block { break-inside:auto; }
pre .line { break-inside:avoid; }
blockquote,.callout,.markdown-alert { border-left:3pt solid #879ab5; background:#f6f8fa; margin:12pt 0; padding:6pt 12pt; box-decoration-break:clone; }
summary { font-weight:700; margin-bottom:7pt; }
details { margin:12pt 0; }
table { border-collapse:collapse; width:100%; table-layout:fixed; font-size:8.5pt; margin:12pt 0; }
thead { display:table-header-group; }
tr { break-inside:avoid; }
th,td { text-align:left; padding:6pt; border:1px solid #d0d7de; vertical-align:top; overflow-wrap:anywhere; }
th { background:#f0f3f6; }
.table-wrap { overflow:visible; }
img,svg { max-width:100%; height:auto; break-inside:avoid; }
figure { margin:12pt 0; }
figcaption { font-size:9pt; color:#57606a; }
.katex-display { margin:12pt 0; break-inside:avoid; }
hr { border:0; border-top:1px solid #d0d7de; margin:16pt 0; }
`;

let assetCss: Promise<string> | undefined;
async function fontCss() {
  if (!assetCss) assetCss = (async () => {
    async function embeddedFont(packageName: string, family: string) {
      let sheet = await readFile(require.resolve(`${packageName}/wght.css`), 'utf8');
      sheet = sheet.replaceAll(/font-family: '[^']+'/g, `font-family: '${family}'`);
      for (const match of [...sheet.matchAll(/url\(\.\/files\/([^)]+)\)/g)]) {
        const font = await readFile(require.resolve(`${packageName}/files/${match[1]}`));
        sheet = sheet.replace(match[0], `url(data:font/woff2;base64,${font.toString('base64')})`);
      }
      return sheet.replaceAll('font-display: swap', 'font-display: block');
    }
    const sans = await embeddedFont('@fontsource-variable/figtree', 'PdfSans');
    const mono = await embeddedFont('@fontsource-variable/jetbrains-mono', 'PdfMono');
    let math = katexCss;
    const urls = [...new Set([...math.matchAll(/url\((fonts\/[^)]+\.woff2)\)/g)].map(m=>m[1]))];
    for (const url of urls) {
      const data = await readFile(require.resolve(`katex/dist/${url}`));
      math = math.replaceAll(`url(${url})`, `url(data:font/woff2;base64,${data.toString('base64')})`);
    }
    // WOFF2 jest obsługiwany przez Chromium; pozostałe formaty nie są potrzebne.
    math = math.replace(/,url\(fonts\/[^)]+\)/g, '');
    return `${math}\n${sans}\n${mono}`;
  })();
  return assetCss;
}

let active = false;
export async function createNotePdf(markdown: string, subject = ''): Promise<Uint8Array> {
  if (active) throw new Error('PDF_BUSY');
  active = true;
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
  try {
    const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) throw new Error('Nieprawidłowa treść notatki.');
    const meta = parse(match[1]);
    const rendered = await renderPdfMarkdown(match[2]);
    const fonts = await fontCss();
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: process.env.PDF_CHROMIUM_PATH || await chromium.executablePath(),
      headless: true,
    });
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    const missing: string[] = [];
    page.on('request', async request => {
      const url = new URL(request.url());
      if (url.protocol === 'data:' || url.protocol === 'about:') { await request.continue(); return; }
      // Brak dostępu do sieci, kont użytkownika ani dowolnych plików serwera.
      // Obrazki mogą pochodzić tylko z public/ albo katalogu notatek.
      try {
        if (url.origin !== 'https://pdf.invalid' || request.resourceType() !== 'image') throw new Error();
        const pathname = decodeURIComponent(url.pathname);
        const base = pathname.startsWith('/notatki/') ? 'notatki' : 'public';
        const root = await realpath(path.join(process.cwd(), base));
        const file = await realpath(path.join(process.cwd(), base === 'notatki' ? pathname.slice(1) : `public/${pathname}`));
        if (!file.startsWith(root + path.sep)) throw new Error();
        const ext = path.extname(file).toLowerCase();
        const type = ({'.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif'} as Record<string,string>)[ext];
        if (!type) throw new Error();
        await request.respond({status:200,contentType:type,body:await readFile(file)});
      } catch {
        missing.push(url.pathname);
        await request.abort();
      }
    });
    await page.setContent(`<!doctype html><html lang="pl"><head><meta charset="utf-8"><base href="https://pdf.invalid/notatki/${encodeURIComponent(subject)}/"><style>${fonts}\n${css}</style></head><body><header><h1>${escape(String(meta.title || 'Notatka'))}</h1>${meta.description ? `<p>${escape(String(meta.description))}</p>` : ''}</header><main>${rendered.html}</main></body></html>`, {waitUntil:'load',timeout:25000});
    await page.evaluate(async () => {
      document.querySelectorAll('details').forEach(el => el.open = true);
      await document.fonts.ready;
      await Promise.all([...document.images].map(img => img.decode()));
      document.querySelectorAll<HTMLElement>('.katex-display').forEach(el => {
        if (el.scrollWidth > el.clientWidth) el.style.fontSize = `${Math.max(.5, el.clientWidth/el.scrollWidth)}em`;
      });
    });
    if (missing.length) throw new Error('Nie udało się wczytać obrazków do PDF.');
    return await page.pdf({format:'A4',preferCSSPageSize:true,printBackground:true,displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="font-size:8px;color:#69727d;width:100%;text-align:center"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',timeout:25000});
  } finally {
    try { await browser?.close(); } finally { active = false; }
  }
}
