import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';

/** scrypt N=2^15, r=8, p=1 — mieści się w limicie pamięci Node/Vercel (~32–64 MB). */
const N = 1 << 15;
const R = 8;
const P = 1;
const KEYLEN = 64;
const SALT_LEN = 16;
/** maxmem ≥ 128 * N * r + 64 * (N + r) * 64  (zaokrąglone w górę). */
const MAXMEM = 64 * 1024 * 1024;

export const MIN_PASSWORD_LENGTH = 10;

function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      keylen,
      { ...options, maxmem: MAXMEM },
      (error, derived) => {
        if (error) reject(error);
        else resolve(derived as Buffer);
      },
    );
  });
}

export function assertPasswordPolicy(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków.`;
  }
  if (password.length > 200) {
    return 'Hasło jest za długie.';
  }
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LEN);
  const derived = await scryptAsync(password, salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const parts = encoded.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const Nused = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = Buffer.from(parts[4], 'base64url');
  const expected = Buffer.from(parts[5], 'base64url');
  if (!Nused || !r || !p || salt.length === 0 || expected.length === 0) return false;
  const derived = await scryptAsync(password, salt, expected.length, { N: Nused, r, p });
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
