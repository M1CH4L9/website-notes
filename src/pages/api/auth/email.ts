import type { APIRoute } from 'astro';
import { emailConfigured, findUserByEmail, normalizeEmail, sendAccountEmail } from '../../../lib/server/account-email';
import { emailSendAllowed } from '../../../lib/server/email-forms';
import { formMessage, assertSafeMutation, parseForm, readFormString, requireUser } from '../../../lib/server/http';
import { verifyPassword } from '../../../lib/server/password';

export const POST: APIRoute = async context => {
  const page = '/profil/';
  const auth = await requireUser(context);
  if (auth instanceof Response) return auth;
  const form = await parseForm(context.request);
  if (form instanceof Response) return form;
  const invalid = assertSafeMutation(context, auth, form);
  if (invalid) return formMessage(page, 'error', invalid);
  if (!emailConfigured()) return formMessage(page, 'error', 'Poczta jest chwilowo niedostępna.');
  const email = normalizeEmail(readFormString(form, 'email'));
  if (!email || email === auth.user.email) return formMessage(page, 'error', 'Podaj nowy, poprawny adres e-mail.');
  if (!(await emailSendAllowed('profile-user', auth.user.id))) return formMessage(page, 'error', 'Zbyt wiele prób. Spróbuj później.');
  if (auth.user.password_hash) {
    const current = readFormString(form, 'current_password');
    if (current.length > 200 || !(await verifyPassword(current, auth.user.password_hash))) {
      return formMessage(page, 'error', 'Obecne hasło jest nieprawidłowe.');
    }
  } else if (Date.now() - new Date(auth.session.created_at).getTime() > 15 * 60_000) {
    return formMessage(page, 'error', 'Zaloguj się ponownie przez GitHub, aby potwierdzić zmianę adresu.');
  }
  if (await emailSendAllowed('profile', email) && !(await findUserByEmail(email))) {
    try { await sendAccountEmail('profile', email, auth.user.id); }
    catch (error) {
      console.error('[profile email]', error instanceof Error ? error.message : 'delivery failed');
      return formMessage(page, 'error', 'Nie udało się wysłać wiadomości. Spróbuj później.');
    }
  }
  return formMessage(page, 'ok', 'Jeśli można użyć tego adresu, otrzymasz link do jego potwierdzenia.');
};
