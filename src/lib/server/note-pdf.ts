import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { readFile, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { parse } from 'yaml';
import { renderPdfMarkdown } from '../../markdown/user.mjs';
import printCss from '../../styles/note-pdf.css?raw';
import katexCss from 'katex/dist/katex.min.css?raw';

const require = createRequire(import.meta.url);
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
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
export async function createNotePdf(markdown: string, linkBase: URL, assetDirectory: string): Promise<Uint8Array> {
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
    // Szerokość pola druku A4 po odjęciu obu marginesów 18 mm.
    await page.setViewport({ width: Math.round(174 * 96 / 25.4), height: 960 });
    await page.emulateMediaType('print');
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
    const title = escape(String(meta.title || 'Notatka'));
    const assets = new URL(assetDirectory, 'https://pdf.invalid');
    await page.setContent(`<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>${title}</title><base href="${escape(assets.href)}"><style>${fonts}\n${printCss}</style></head><body><header><h1>${title}</h1>${meta.description ? `<p>${escape(String(meta.description))}</p>` : ''}</header><main>${rendered.html}</main></body></html>`, {waitUntil:'load',timeout:25000});
    await page.evaluate(async (linkBase) => {
      // Po wczytaniu obrazków kotwice muszą wskazywać dokument PDF.
      for (const image of document.images) image.src = image.src;
      document.querySelector('base')?.remove();
      for (const anchor of document.querySelectorAll<HTMLAnchorElement>('a[href]')) {
        const href = anchor.getAttribute('href')!;
        if (href.startsWith('#')) {
          let fragment: string;
          try { fragment = decodeURIComponent(href.slice(1)); } catch { continue; }
          // Sanityzacja dodaje prefiks do identyfikatorów nagłówków i przypisów.
          const target = document.getElementById('user-content-' + fragment) || document.getElementById(fragment);
          if (target) anchor.setAttribute('href', '#' + encodeURIComponent(target.id));
        } else {
          try { anchor.href = new URL(href, linkBase).href; } catch { anchor.removeAttribute('href'); }
        }
      }
      document.querySelectorAll('details').forEach(el => el.open = true);
      await document.fonts.ready;
      await Promise.all([...document.images].map(img => img.decode()));
      document.querySelectorAll<HTMLElement>('.katex-display').forEach(el => {
        if (el.scrollWidth > el.clientWidth) el.style.fontSize = `${Math.max(.5, el.clientWidth/el.scrollWidth)}em`;
      });
      for (const code of document.querySelectorAll(':not(pre) > code')) {
        if (/^\S{1,20}$/.test(code.textContent ?? '')) code.classList.add('short-token');
      }
      // Krótkie przykłady i odpowiedzi pozostają razem, długie mogą się dzielić.
      for (const block of document.querySelectorAll('.code-block, details, .callout, figure, blockquote, li')) {
        if (block.getBoundingClientRect().height <= 160) block.classList.add('print-keep');
      }
    }, linkBase.href);
    if (missing.length) throw new Error('Nie udało się wczytać obrazków do PDF.');
    return await page.pdf({
      format: 'A4', preferCSSPageSize: true, printBackground: true,
      tagged: true, outline: true, timeout: 25000,
    });
  } finally {
    try { await browser?.close(); } finally { active = false; }
  }
}
