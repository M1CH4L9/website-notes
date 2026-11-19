import type { APIRoute } from 'astro';
import { finishEmailLink, readEmailLink } from '../../../lib/server/account-email';
import { emailForm, readNewPassword } from '../../../lib/server/email-forms';
import { formMessage, assertSafeMutation, readFormString, redirect } from '../../../lib/server/http';
import { assertPasswordPolicy, hashPassword } from '../../../lib/server/password';
import { clearSessionCookie } from '../../../lib/server/sessions';
import { assertUsername, normalizeUsername } from '../../../lib/server/users';

export const POST: APIRoute = async context => {
  const form = await emailForm(context, '/logowanie/', 'confirm');
  if (form instanceof Response) return form;
  const purpose = readFormString(form, 'purpose');
  const token = readFormString(form, 'token');
  if (purpose !== 'register' && purpose !== 'reset' && purpose !== 'profile') return redirect('/logowanie/');
  const path = purpose === 'register' ? '/rejestracja/dokoncz/' : purpose === 'reset' ? '/haslo/ustaw/' : '/profil/potwierdz-email/';
  const link = await readEmailLink(purpose, token);
  if (!link) return formMessage(path, 'error', 'Link wygasł albo został już wykorzystany.');
  const fail = (message: string) => formMessage(`${path}?token=${encodeURIComponent(token)}`, 'error', message);
  let username: string | undefined;
  let passwordHash: string | undefined;
  let userId: string | undefined;
  if (purpose === 'profile') {
    const auth = context.locals.auth;
    if (!auth || auth.user.id !== link.user_id) return fail('Zaloguj się na konto, dla którego wysłano link.');
    const invalid = assertSafeMutation(context, auth, form);
    if (invalid) return fail(invalid);
    userId = auth.user.id;
  } else {
    if (purpose === 'register') {
      username = normalizeUsername(readFormString(form, 'username'));
      const invalid = assertUsername(username);
      if (invalid) return fail(invalid);
    }
    const { password, confirm } = readNewPassword(form);
    const invalid = assertPasswordPolicy(password);
    if (invalid) return fail(invalid);
    if (password !== confirm) return fail('Hasła nie są takie same.');
    passwordHash = await hashPassword(password);
  }
  try {
    if (!(await finishEmailLink({ purpose, token, userId, username, passwordHash }))) {
      return formMessage(path, 'error', 'Link wygasł albo został już wykorzystany.');
    }
  } catch (error) {
    if ((error as { code?: string }).code === '23505') return fail('Nazwa użytkownika lub adres e-mail są już zajęte.');
    throw error;
  }
  if (purpose === 'profile') return formMessage('/profil/', 'ok', 'Adres e-mail został potwierdzony.');
  if (purpose === 'reset') clearSessionCookie(context.cookies);
  return formMessage('/logowanie/', 'ok', purpose === 'reset' ? 'Hasło zostało zmienione. Zaloguj się ponownie.' : 'Konto jest gotowe. Możesz się zalogować.');
};
