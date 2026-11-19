import type { APIRoute } from 'astro';
import { emailConfigured, findUserByEmail, normalizeEmail, sendAccountEmail } from '../../../lib/server/account-email';
import { emailForm, emailSendAllowed, queueAccountEmail } from '../../../lib/server/email-forms';
import { formMessage, readFormString } from '../../../lib/server/http';

export const POST: APIRoute = async context => {
  const page = '/haslo/';
  if (!emailConfigured()) return formMessage(page, 'error', 'Reset hasła jest chwilowo niedostępny.');
  const form = await emailForm(context, page, 'reset');
  if (form instanceof Response) return form;
  const email = normalizeEmail(readFormString(form, 'email'));
  if (!email) return formMessage(page, 'error', 'Podaj poprawny adres e-mail.');
  await queueAccountEmail(async () => {
    if (!(await emailSendAllowed('reset', email))) return;
    const user = await findUserByEmail(email);
    if (user) await sendAccountEmail('reset', email, user.id);
  });
  return formMessage(page, 'ok', 'Jeśli adres jest powiązany z kontem, otrzymasz link do ustawienia hasła.');
};
