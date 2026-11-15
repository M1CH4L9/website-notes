import { query } from './db';
import { adminGithubLogin } from './env';

export type User = {
  id: string;
  username: string;
  password_hash: string | null;
  github_id: string | null;
  github_login: string | null;
  is_admin: boolean;
  pref_theme: 'dark' | 'light' | null;
  pref_cute: boolean | null;
  created_at: Date;
};

export type ThemePreference = 'dark' | 'light';

export function normalizeThemePreference(raw: string): ThemePreference | null {
  return raw === 'dark' || raw === 'light' ? raw : null;
}

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function assertUsername(username: string): string | null {
  if (!/^[a-z0-9_]{3,32}$/.test(username)) {
    return 'Nazwa użytkownika: 3-32 znaki, tylko małe litery, cyfry i _.';
  }
  return null;
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const { rows } = await query<User>('SELECT * FROM users WHERE lower(username) = lower($1) LIMIT 1', [
    username,
  ]);
  return rows[0] ?? null;
}

export async function findUserById(id: string): Promise<User | null> {
  const { rows } = await query<User>('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
  return rows[0] ?? null;
}

export async function findUserByGithubId(githubId: string): Promise<User | null> {
  const { rows } = await query<User>('SELECT * FROM users WHERE github_id = $1 LIMIT 1', [githubId]);
  return rows[0] ?? null;
}

export async function createUserWithPassword(username: string, passwordHash: string): Promise<User> {
  const { rows } = await query<User>(
    `INSERT INTO users (username, password_hash, is_admin)
     VALUES ($1, $2, FALSE)
     RETURNING *`,
    [username, passwordHash],
  );
  return rows[0];
}

export async function upsertGithubUser(input: {
  githubId: string;
  githubLogin: string;
  preferredUsername?: string;
}): Promise<User> {
  const existing = await findUserByGithubId(input.githubId);
  const makeAdmin = input.githubLogin.toLowerCase() === adminGithubLogin();

  if (existing) {
    const { rows } = await query<User>(
      `UPDATE users
       SET github_login = $2,
           is_admin = CASE WHEN $3 THEN TRUE ELSE is_admin END
       WHERE id = $1
       RETURNING *`,
      [existing.id, input.githubLogin, makeAdmin],
    );
    return rows[0];
  }

  let username = normalizeUsername(input.preferredUsername || input.githubLogin).replace(
    /[^a-z0-9_]/g,
    '_',
  );
  if (username.length < 3) username = `gh_${input.githubId}`.slice(0, 32);
  if (username.length > 32) username = username.slice(0, 32);

  // Unikalna nazwa, gdy zajęta.
  let candidate = username;
  for (let i = 0; i < 20; i++) {
    const taken = await findUserByUsername(candidate);
    if (!taken) break;
    const suffix = String(i + 2);
    candidate = `${username.slice(0, 32 - suffix.length)}${suffix}`;
  }

  const { rows } = await query<User>(
    `INSERT INTO users (username, github_id, github_login, is_admin)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [candidate, input.githubId, input.githubLogin, makeAdmin],
  );
  return rows[0];
}

export async function linkGithubToUser(
  userId: string,
  githubId: string,
  githubLogin: string,
): Promise<User> {
  const makeAdmin = githubLogin.toLowerCase() === adminGithubLogin();
  const { rows } = await query<User>(
    `UPDATE users
     SET github_id = $2,
         github_login = $3,
         is_admin = CASE WHEN $4 THEN TRUE ELSE is_admin END
     WHERE id = $1
     RETURNING *`,
    [userId, githubId, githubLogin, makeAdmin],
  );
  return rows[0];
}

export async function updateUserPreferences(
  userId: string,
  theme: ThemePreference,
  cute: boolean,
): Promise<User> {
  const { rows } = await query<User>(
    `UPDATE users
     SET pref_theme = $2,
         pref_cute = $3
     WHERE id = $1
     RETURNING *`,
    [userId, theme, cute],
  );
  return rows[0];
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<User> {
  const { rows } = await query<User>(
    `UPDATE users
     SET password_hash = $2
     WHERE id = $1
     RETURNING *`,
    [userId, passwordHash],
  );
  return rows[0];
}
