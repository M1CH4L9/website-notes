import type { APIRoute } from 'astro';
import { beginGithubOAuth, githubConfigured, githubStateCookie } from '../../../lib/server/github';
import { isProd } from '../../../lib/server/env';
import { redirect } from '../../../lib/server/http';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  if (!githubConfigured()) {
    return redirect('/logowanie?error=' + encodeURIComponent('GitHub OAuth nie jest skonfigurowany.'));
  }

  const next = context.url.searchParams.get('next') || '/moje/';
  const { authorizeUrl, cookieValue } = beginGithubOAuth(context.url);

  context.cookies.set(githubStateCookie, cookieValue, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd(),
    maxAge: 600,
  });
  context.cookies.set('gh_next', safeNext(next), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd(),
    maxAge: 600,
  });

  return redirect(authorizeUrl, 302);
};

function safeNext(value: string): string {
  if (!value.startsWith('/') || value.startsWith('//')) return '/moje/';
  return value;
}
