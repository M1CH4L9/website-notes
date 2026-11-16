/**
 * Client-side eksport PDF notatki (html2pdf.js).
 * Otwiera wszystkie .prose details na czas generowania / fallback print.
 *
 * html2canvas nie parsuje color-mix() / color() - w onclone zdejmujemy arkusze
 * motywu i dokładamy uproszczony jasny CSS.
 */

type DetailsSnapshot = { el: HTMLDetailsElement; open: boolean };

type Html2PdfWorker = {
  set: (options: Record<string, unknown>) => Html2PdfWorker;
  from: (element: HTMLElement) => Html2PdfWorker;
  save: () => Promise<void>;
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

function snapshotProseDetails(root: ParentNode): DetailsSnapshot[] {
  return [...root.querySelectorAll<HTMLDetailsElement>('.prose details')].map((el) => ({
    el,
    open: el.open,
  }));
}

function openAll(snapshot: DetailsSnapshot[]) {
  for (const item of snapshot) item.el.open = true;
}

function restoreAll(snapshot: DetailsSnapshot[]) {
  for (const item of snapshot) item.el.open = item.open;
}

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

function showFallbackTip() {
  let tip = document.querySelector<HTMLElement>('[data-pdf-fallback-tip]');
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'note-pdf-fallback-tip';
    tip.dataset.pdfFallbackTip = '1';
    tip.setAttribute('role', 'status');
    tip.innerHTML =
      'Nie udało się zapisać PDF automatycznie. W oknie drukowania wybierz <strong>Zapisz jako PDF</strong> (nie Microsoft Print to PDF).';
    document.body.append(tip);
  }
  tip.hidden = false;
  window.setTimeout(() => {
    tip?.remove();
  }, 10000);
}

async function loadHtml2Pdf(): Promise<() => Html2PdfWorker> {
  const mod = await import('html2pdf.js');
  const factory = (mod as { default?: unknown }).default ?? mod;
  if (typeof factory !== 'function') {
    throw new Error('html2pdf niedostępny');
  }
  return factory as () => Html2PdfWorker;
}

function prepareCloneForPdf(clonedDoc: Document) {
  clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => node.remove());

  const style = clonedDoc.createElement('style');
  style.textContent = PDF_SAFE_CSS;
  clonedDoc.head.append(style);

  clonedDoc.querySelectorAll<HTMLDetailsElement>('.prose details').forEach((el) => {
    el.open = true;
  });

  clonedDoc
    .querySelectorAll(
      '.note-head-actions, .note-download, .note-search, .toc-mobile, .note-pager, .code-copy, .heading-anchor',
    )
    .forEach((node) => node.remove());
}

/** Drukowanie systemowe: otwórz details, po afterprint przywróć. */
export function printNoteWithDetailsOpen() {
  const noteMain = document.querySelector('.note-main') ?? document.body;
  const snapshot = snapshotProseDetails(noteMain);
  openAll(snapshot);

  let done = false;
  const restore = () => {
    if (done) return;
    done = true;
    restoreAll(snapshot);
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);
  window.setTimeout(restore, 60_000);
  window.print();
}

export async function exportNotePdf(filename: string): Promise<void> {
  const noteMain = document.querySelector<HTMLElement>('.note-main');
  if (!noteMain) {
    showFallbackTip();
    printNoteWithDetailsOpen();
    return;
  }

  const safeName = (filename || 'notatka').replace(/\.pdf$/i, '') || 'notatka';
  const snapshot = snapshotProseDetails(noteMain);
  const html = document.documentElement;
  const prevTheme = html.dataset.theme;
  const prevCute = html.dataset.cute;
  let handedOffToPrint = false;

  openAll(snapshot);
  html.dataset.theme = 'light';
  html.dataset.cute = 'false';
  document.body.classList.add('is-pdf-export');
  showBusy('Generowanie PDF…');

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  try {
    const html2pdf = await loadHtml2Pdf();
    const longNote = noteMain.scrollHeight > 8000;
    await html2pdf()
      .set({
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
          windowWidth: Math.min(Math.max(noteMain.scrollWidth, 720), 900),
          onclone: (clonedDoc: Document) => {
            prepareCloneForPdf(clonedDoc);
          },
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      })
      .from(noteMain)
      .save();
  } catch (error) {
    console.error('[note-pdf]', error);
    showFallbackTip();
    handedOffToPrint = true;
    hideBusy();
    document.body.classList.remove('is-pdf-export');
    html.dataset.theme = prevTheme;
    html.dataset.cute = prevCute;

    let done = false;
    const restore = () => {
      if (done) return;
      done = true;
      restoreAll(snapshot);
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    window.setTimeout(restore, 60_000);
    window.print();
  } finally {
    if (!handedOffToPrint) {
      hideBusy();
      document.body.classList.remove('is-pdf-export');
      html.dataset.theme = prevTheme;
      html.dataset.cute = prevCute;
      restoreAll(snapshot);
    }
  }
}
