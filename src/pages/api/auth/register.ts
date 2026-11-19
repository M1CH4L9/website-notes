import type { APIRoute } from 'astro';
import { emailConfigured, findUserByEmail, normalizeEmail, sendAccountEmail } from '../../../lib/server/account-email';
import { emailForm, emailSendAllowed, queueAccountEmail } from '../../../lib/server/email-forms';
import { formMessage, readFormString } from '../../../lib/server/http';

export const POST: APIRoute = async context => {
  const page = '/rejestracja/';
  if (!emailConfigured()) return formMessage(page, 'error', 'Rejestracja e-mailem jest chwilowo niedostępna.');
  const form = await emailForm(context, page, 'register');
  if (form instanceof Response) return form;
  const email = normalizeEmail(readFormString(form, 'email'));
  if (!email) return formMessage(page, 'error', 'Podaj poprawny adres e-mail.');
  if (!readFormString(form, 'website')) {
    await queueAccountEmail(async () => {
      if (await emailSendAllowed('register', email) && !(await findUserByEmail(email))) {
        await sendAccountEmail('register', email);
      }
    });
  }
  return formMessage(page, 'ok', 'Jeśli można użyć tego adresu, otrzymasz link do dokończenia rejestracji.');
};
