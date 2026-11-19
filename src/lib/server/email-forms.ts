import { waitUntil } from '@vercel/functions';
import type { APIContext } from 'astro';
import { isDatabaseConfigured } from './env';
import { parseForm, readFormString, formMessage } from './http';
import { hitRateLimit } from './rate-limit';
import { tokenHash } from './account-email';

export async function emailForm(context: APIContext, page: string, action: string) {
  if (!isDatabaseConfigured()) return formMessage(page, 'error', 'Konta są chwilowo niedostępne.');
  if (context.request.headers.get('origin') !== context.url.origin) {
    return formMessage(page, 'error', 'Odśwież stronę i wyślij formularz ponownie.');
  }
  const form = await parseForm(context.request);
  if (form instanceof Response) return form;
  const rate = await hitRateLimit(`email:${action}:ip:${context.clientAddress || 'unknown'}`, 15, 15 * 60_000);
  if (!rate.ok) return formMessage(page, 'error', 'Zbyt wiele prób. Spróbuj później.');
  return form;
}

export async function emailSendAllowed(purpose: string, email: string) {
  return (await hitRateLimit(`mail:${purpose}:${tokenHash(email)}`, 3, 30 * 60_000)).ok;
}

export function readNewPassword(form: FormData) {
  return { password: readFormString(form, 'password'), confirm: readFormString(form, 'password_confirm') };
}

/** Public requests return before delivery on Vercel for both known and unknown addresses. */
export async function queueAccountEmail(work: () => Promise<void>) {
  const job = work().catch(error => {
    console.error('[account email]', error instanceof Error ? error.message : 'delivery failed');
  });
  if (process.env.VERCEL === '1') waitUntil(job);
  else await job;
}
