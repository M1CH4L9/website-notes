import type { APIRoute } from 'astro';
import { finishGithubOAuth, githubStateCookie } from '../../../lib/server/github';
import { createSession, setSessionCookie } from '../../../lib/server/sessions';
import { upsertGithubUser } from '../../../lib/server/users';
import { redirect, safeNext } from '../../../lib/server/http';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const err = context.url.searchParams.get('error');
  if (err) {
    return redirect('/logowanie?error=' + encodeURIComponent('Logowanie GitHub anulowane.'));
  }

  const code = context.url.searchParams.get('code');
  const state = context.url.searchParams.get('state');
  if (!code || !state) {
    return redirect('/logowanie?error=' + encodeURIComponent('Brak kodu OAuth.'));
  }

  try {
    const profile = await finishGithubOAuth({
      requestUrl: context.url,
      code,
      state,
      cookieValue: context.cookies.get(githubStateCookie)?.value,
    });
    const user = await upsertGithubUser({
      githubId: profile.githubId,
      githubLogin: profile.githubLogin,
      preferredUsername: profile.githubLogin,
    });
    const { token } = await createSession(user.id);
    setSessionCookie(context.cookies, token);
  } catch (error) {
    console.error('[github oauth]', error);
    return redirect(
      '/logowanie?error=' +
        encodeURIComponent(error instanceof Error ? error.message : 'Błąd GitHub OAuth.'),
    );
  } finally {
    context.cookies.delete(githubStateCookie, { path: '/' });
  }

  const next = context.cookies.get('gh_next')?.value || '/moje/';
  context.cookies.delete('gh_next', { path: '/' });
  return redirect(safeNext(next));
};
