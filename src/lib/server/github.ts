import { createHash, randomBytes } from 'node:crypto';
import { githubOAuth, publicSiteUrl } from './env';

const STATE_COOKIE = 'gh_oauth';

export { STATE_COOKIE as githubStateCookie };

export function githubConfigured(): boolean {
  return Boolean(githubOAuth());
}

export function beginGithubOAuth(requestUrl: URL): {
  authorizeUrl: string;
  state: string;
  cookieValue: string;
} {
  const oauth = githubOAuth();
  if (!oauth) throw new Error('GitHub OAuth nie jest skonfigurowany.');

  const state = randomBytes(24).toString('base64url');
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const cookieValue = `${state}.${verifier}`;

  const redirectUri = `${publicSiteUrl(requestUrl)}/auth/github/callback`;
  const params = new URLSearchParams({
    client_id: oauth.clientId,
    redirect_uri: redirectUri,
    scope: 'read:user',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  return {
    authorizeUrl: `https://github.com/login/oauth/authorize?${params}`,
    state,
    cookieValue,
  };
}

export async function finishGithubOAuth(input: {
  requestUrl: URL;
  code: string;
  state: string;
  cookieValue: string | undefined;
}): Promise<{ githubId: string; githubLogin: string; name: string | null }> {
  const oauth = githubOAuth();
  if (!oauth) throw new Error('GitHub OAuth nie jest skonfigurowany.');
  if (!input.cookieValue) throw new Error('Brak ciasteczka stanu OAuth.');

  const [expectedState, verifier] = input.cookieValue.split('.');
  if (!expectedState || !verifier || expectedState !== input.state) {
    throw new Error('Nieprawidłowy stan OAuth.');
  }

  const redirectUri = `${publicSiteUrl(input.requestUrl)}/auth/github/callback`;
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: oauth.clientId,
      client_secret: oauth.clientSecret,
      code: input.code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }),
  });
  if (!tokenRes.ok) throw new Error('GitHub nie wydał tokenu.');
  const tokenJson = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenJson.access_token) throw new Error(tokenJson.error || 'Brak access_token.');

  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${tokenJson.access_token}`,
      'User-Agent': 'website-notes',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!userRes.ok) throw new Error('Nie udało się pobrać profilu GitHub.');
  const user = (await userRes.json()) as { id: number; login: string; name: string | null };
  return {
    githubId: String(user.id),
    githubLogin: user.login,
    name: user.name,
  };
}
