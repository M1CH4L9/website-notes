const ADMIN_GITHUB_LOGIN = 'M1CH4L9';

export function databaseUrl(): string {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      'Brak DATABASE_URL (albo POSTGRES_URL). Podłącz Neon z Vercel Marketplace i zrób Redeploy.',
    );
  }
  return url;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

export function sessionCookieName(): string {
  return 'session';
}

export function sessionTtlMs(): number {
  return 1000 * 60 * 60 * 24 * 30; // 30 dni
}

export function githubOAuth() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function adminGithubLogin(): string {
  return (process.env.ADMIN_GITHUB_LOGIN || ADMIN_GITHUB_LOGIN).toLowerCase();
}

export function publicSiteUrl(requestUrl: URL): string {
  const fromEnv =
    process.env.PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined);
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return requestUrl.origin;
}

export function isProd(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}
