/** Pobranie gotowego dokumentu z serwera bez zmieniania DOM notatki. */
let exporting = false;
function status(message: string, error = false) {
  let el = document.querySelector<HTMLElement>('[data-pdf-busy]');
  if (!el) {
    el = document.createElement('div');
    el.className = 'note-pdf-busy';
    el.dataset.pdfBusy = '1';
    document.body.append(el);
  }
  el.hidden = false;
  el.setAttribute('role', error ? 'alert' : 'status');
  el.textContent = message;
  return el;
}
export async function exportNotePdf(filename: string, mdHref: string): Promise<void> {
  if (exporting) return;
  exporting = true;
  const message = status('Przygotowywanie PDF…');
  let objectUrl: string | undefined;
  try {
    const url = new URL(mdHref, location.origin);
    if (url.origin !== location.origin) throw new Error('Nieprawidłowy adres notatki.');
    url.searchParams.set('format', 'pdf');
    const response = await fetch(url, {credentials:'same-origin', signal:AbortSignal.timeout(65000)});
    if (!response.ok) {
      const data = await response.json().catch(()=>({}));
      throw new Error(data.error || 'Nie udało się przygotować PDF. Spróbuj ponownie.');
    }
    if (!response.headers.get('content-type')?.includes('application/pdf')) throw new Error('Serwer nie zwrócił pliku PDF.');
    objectUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `${filename.replace(/\.pdf$/i,'') || 'notatka'}.pdf`;
    document.body.append(link);
    link.click();
    link.remove();
    message.hidden = true;
  } catch (error) {
    status(error instanceof Error ? error.message : 'Nie udało się pobrać PDF. Spróbuj ponownie.', true);
  } finally {
    // Przeglądarka potrzebuje chwili na rozpoczęcie pobierania blobu.
    if (objectUrl) { const savedUrl = objectUrl; setTimeout(()=>URL.revokeObjectURL(savedUrl),30000); }
    exporting = false;
  }
}
