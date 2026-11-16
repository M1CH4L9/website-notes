/**
 * Client-side eksport PDF notatki (html2pdf.js).
 * Renderuje osobną kopię artykułu bez zmieniania widocznej strony.
 *
 * html2canvas nie parsuje color-mix() / color() - w onclone zdejmujemy arkusze
 * motywu i dokładamy uproszczony jasny CSS.
 */

type Html2PdfWorker = {
  set: (options: Record<string, unknown>) => Html2PdfWorker;
  from: (element: HTMLElement) => Html2PdfWorker;
  save: () => Promise<void>;
  prop?: { overlay?: HTMLElement };
};

/** Minimalny jasny arkusz bez color-mix - tylko pod html2canvas. */
const PDF_SAFE_CSS = `
  * {
    letter-spacing: normal !important;
    word-spacing: normal !important;
    text-wrap: wrap !important;
  }
  html, body {
    background: #ffffff !important;
    color: #1f2328 !important;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
    line-height: 1.65;
  }
  .note-head-actions, .note-download, .note-search, .toc-mobile,
  .note-pager, .code-copy, .heading-anchor, .note-pdf-busy, .note-pdf-fallback-tip {
    display: none !important;
  }
  .note-main { max-width: none; color: #1f2328; }
  .page-title { font-size: 1.75rem; font-weight: 700; margin: 0; color: #1f2328; letter-spacing: -0.01em !important; }
  .page-lead { margin-top: 0.6rem; color: #59636e; }
  .page-meta { margin-top: 0.75rem; color: #59636e; font-size: 0.9375rem; }
  .note-head { margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid #d1d9e0; }
  .prose { color: #1f2328; font-size: 1rem; }
  .prose :is(h1,h2,h3,h4) { color: #1f2328; font-weight: 700; line-height: 1.25; }
  .prose h2 { margin: 1.6rem 0 0.7rem; font-size: 1.35rem; padding-bottom: 0.35rem; border-bottom: 1px solid #d1d9e0; }
  .prose h3 { margin: 1.25rem 0 0.5rem; font-size: 1.15rem; }
  .prose p, .prose li { color: #1f2328; }
  .prose a { color: #0969da; text-decoration: underline; }
  .prose strong { font-weight: 700; }
  .prose :not(pre) > code {
    padding: 0.1em 0.35em; border-radius: 4px;
    background: #eff1f3; color: #1f2328; font-family: ui-monospace, monospace; font-size: 0.86em;
  }
  .code-block {
    border: 1px solid #c8d1da; border-radius: 8px; background: #eef2f6; overflow: hidden; margin: 0.9rem 0;
  }
  .code-header {
    padding: 0.35rem 0.85rem; border-bottom: 1px solid #c8d1da; background: #e4e9ef;
    color: #59636e; font-size: 0.8rem; font-family: ui-monospace, monospace;
  }
  .prose pre {
    margin: 0; padding: 0.85rem 1rem; background: #eef2f6 !important; color: #1f2328;
    white-space: pre-wrap !important; overflow-wrap: anywhere !important; word-break: break-word !important;
    overflow: visible !important; font-size: 0.78rem; line-height: 1.55;
    font-family: ui-monospace, monospace;
  }
  .prose pre code {
    display: block !important; width: auto !important; max-width: 100% !important; min-width: 0 !important;
    white-space: pre-wrap !important; overflow-wrap: anywhere !important; word-break: break-word !important;
    background: transparent;
  }
  .astro-code, .astro-code span { color: #1f2328 !important; }
  .prose details {
    padding: 0.65rem 0.9rem; border: 1px solid #d1d9e0; border-radius: 8px; background: #ffffff; margin: 0.7rem 0;
  }
  .prose summary { font-weight: 600; cursor: default; }
  .prose details[open] > summary { margin-bottom: 0.5rem; }
  .prose details > *:not(summary) { display: block !important; }
  .table-wrap { border: 1px solid #d1d9e0; border-radius: 8px; overflow: visible; }
  .prose table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  .prose :is(th, td) { border: 1px solid #d1d9e0; padding: 0.45rem 0.6rem; }
  .prose th { background: #f6f8fa; }
  .callout {
    border: 1px solid #d1d9e0; border-left: 4px solid #0969da; border-radius: 8px;
    padding: 0.75rem 1rem; background: #f6f8fa; margin: 0.9rem 0;
  }
  .katex { font-size: 1.05em; color: #1f2328; }
  img { max-width: 100%; height: auto; }
`;

function showBusy(label: string): HTMLElement {
  const existing = document.querySelector<HTMLElement>('[data-pdf-busy]');
  if (existing) {
    existing.textContent = label;
    existing.hidden = false;
    return existing;
  }
  const el = document.createElement('div');
  el.className = 'note-pdf-busy';
  el.dataset.pdfBusy = '1';
  el.setAttribute('role', 'status');
  el.textContent = label;
  document.body.append(el);
  return el;
}

function hideBusy() {
  const el = document.querySelector<HTMLElement>('[data-pdf-busy]');
  if (el) el.hidden = true;
}

function showExportError() {
  const status = showBusy('Nie udało się pobrać PDF. Spróbuj ponownie lub pobierz Markdown.');
  status.setAttribute('role', 'alert');
}

async function loadHtml2Pdf(): Promise<() => Html2PdfWorker> {
  const mod = await import('html2pdf.js');
  const factory = (mod as { default?: unknown }).default ?? mod;
  if (typeof factory !== 'function') {
    throw new Error('html2pdf niedostępny');
  }
  return factory as () => Html2PdfWorker;
}

/** Stała szerokość A4, niezależna od telefonu i aktywnego motywu. */
async function preparePdfSource(noteMain: HTMLElement) {
  const frame = document.createElement('iframe');
  frame.title = 'Przygotowanie pliku PDF';
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  frame.style.cssText = 'position:fixed;left:-100000px;top:0;width:718px;height:1000px;border:0;pointer-events:none;';
  document.body.append(frame);
  try {
    const doc = frame.contentDocument!;
    const style = doc.createElement('style');
    style.textContent = PDF_SAFE_CSS + `
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; font-size: 16px; }
      .note-main { width: 718px; }
      h1, h2, h3, h4, summary, tr, img { break-inside: avoid; }
      .table-wrap { max-width: 100%; }
      table { table-layout: fixed; overflow-wrap: anywhere; }
      td, th { white-space: normal; }
    `;
    doc.head.append(style);
    const source = noteMain.cloneNode(true) as HTMLElement;
    source.querySelectorAll('script, style, .note-head-actions, .note-download, .note-search, .toc-mobile, .note-pager, .code-copy, .heading-anchor').forEach(node => node.remove());
    source.querySelectorAll('details').forEach(el => { el.open = true; });
    // Nie eksportuj tymczasowych wyróżnień wyszukiwania.
    source.querySelectorAll('mark').forEach(el => el.replaceWith(...el.childNodes));
    doc.body.append(source);
    await doc.fonts.ready;
    await Promise.all([...source.querySelectorAll('img')].map(async img => {
      img.loading = 'eager';
      try { await img.decode(); } catch { throw new Error('Nie udało się wczytać obrazka do PDF.'); }
    }));
    // html2pdf tworzy własny kontener w dokumencie nadrzędnym. Utrwal style
    // kopii, żeby motyw aplikacji i jej media queries nie wpływały na paginację.
    const nodes = [source, ...source.querySelectorAll<HTMLElement>('*')];
    const styles = nodes.map(node => {
      const computed = frame.contentWindow!.getComputedStyle(node);
      // Paginacja dodaje odstępy, więc wysokość bloków tekstu musi pozostać automatyczna.
      const fixedSize = node.matches('img, svg, svg *');
      return [...computed]
        .filter(key => fixedSize || !['height', 'min-height', 'max-height', 'block-size', 'min-block-size', 'max-block-size'].includes(key))
        .map(key => `${key}:${computed.getPropertyValue(key)} !important;`).join('');
    });
    nodes.forEach((node, index) => node.setAttribute('style', styles[index]));
    return { source, frame };
  } catch (error) {
    frame.remove();
    throw error;
  }
}

let exporting = false;

export async function exportNotePdf(filename: string): Promise<void> {
  if (exporting) return;
  exporting = true;
  let frame: HTMLIFrameElement | undefined;
  let worker: Html2PdfWorker | undefined;
  showBusy('Generowanie PDF…').setAttribute('role', 'status');
  try {
    const noteMain = document.querySelector<HTMLElement>('.note-main');
    if (!noteMain) throw new Error('Brak notatki do eksportu.');
    const html2pdf = await loadHtml2Pdf();
    const prepared = await preparePdfSource(noteMain);
    frame = prepared.frame;
    const longNote = prepared.source.scrollHeight > 8000;
    const safeName = (filename || 'notatka').replace(/\.pdf$/i, '') || 'notatka';
    worker = html2pdf();
    await worker.set({
      margin: [10, 10, 12, 10],
      filename: `${safeName}.pdf`,
      image: { type: 'jpeg', quality: longNote ? 0.88 : 0.94 },
      html2canvas: {
        scale: longNote ? 1.5 : 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: 900,
        onclone: (doc: Document) => {
          // Wyłącznie wewnętrzna kopia html2canvas: bez color-mix() z motywu.
          doc.querySelectorAll('style, link[rel="stylesheet"]').forEach(node => node.remove());
          doc.documentElement.style.cssText = 'background:#fff;color:#1f2328;';
          doc.body.style.cssText = 'background:#fff;color:#1f2328;margin:0;';
        },
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] },
    }).from(prepared.source).save();
    hideBusy();
  } catch (error) {
    console.error('[note-pdf]', error);
    showExportError();
  } finally {
    frame?.remove();
    // html2pdf usuwa overlay po sukcesie; po błędzie trzeba sprzątnąć go samemu.
    worker?.prop?.overlay?.remove();
    exporting = false;
  }
}
