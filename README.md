# notatnik.

Publiczna strona z notatkami ze studiów. Układ jest prosty: przedmiot, lista notatek, notatka. Po zalogowaniu każdy ma własną sekcję notatek Markdown.

## Stos

- [Astro](https://astro.build) + adapter [`@astrojs/vercel`](https://docs.astro.build/en/guides/integrations-guide/vercel/) (`output: 'server'`).
- Publiczne notatki Michała: pliki Markdown/MDX w `notatki/` (kolekcje treści Astro).
- Konta: Neon Postgres (`DATABASE_URL` / `POSTGRES_URL`), hasła scrypt, sesje w bazie, opcjonalnie GitHub OAuth.
- Migracje SQL przy `npm run build` (tylko gdy jest URL bazy; na Vercelu tylko `production`).
- Shiki + KaTeX + te same wtyczki Markdowna dla notatek z bazy (z sanityzacją HTML).

## Uruchomienie lokalne

Wymagany Node.js 24 (Astro 7 działa też na 22.23.4 lub nowszym) i Postgres.

```sh
cp .env.example .env   # ustaw DATABASE_URL
npm install
npm run db:migrate
npm run dev            # http://localhost:4321
npm run build
npm run check
```

## Konta i notatki użytkowników

| Ścieżka | Opis |
| --- | --- |
| `/logowanie`, `/rejestracja` | hasło albo GitHub OAuth |
| `/moje/` | lista własnych notatek |
| `/moje/nowa/`, `/moje/<slug>/`, `/moje/<slug>/edytuj/` | CRUD + podgląd |
| `/moje/z-publicznej?subject=&note=` | kopia publicznej notatki |
| `/u/<nazwa>/<slug>/` | upubliczniona notatka użytkownika |
| `/admin/prosby/` | akceptacja/odrzucenie próśb (tylko admin) |

Admin: konto połączone z GitHubem `M1CH4L9` (albo `ADMIN_GITHUB_LOGIN`).

## Po merge na Vercelu (kolejność)

1. **Neon (Vercel Marketplace)**  
   Vercel → projekt → Storage / Marketplace → Neon → Create.  
   Region najlepiej blisko funkcji (np. Frankfurt / `fra1`).  
   Zostaw bazę na **Production** (preview bez osobnej bazy nie powinno migrować produkcji — skrypt i tak pomija non-production).
2. **Zmienna bazy**  
   Upewnij się, że jest `DATABASE_URL` albo `POSTGRES_URL` (Neon z Marketplace zwykle dokłada to sam).
3. **GitHub OAuth App**  
   GitHub → Settings → Developer settings → OAuth Apps → New.  
   - Application name: `notatnik` (albo inna).  
   - Homepage URL: `https://<twoja-domena-produkcyjna>`  
   - Authorization callback URL: `https://<twoja-domena-produkcyjna>/auth/github/callback`
4. **Zmienne OAuth w Vercel**  
   Project → Settings → Environment Variables (Production):  
   - `GITHUB_CLIENT_ID`  
   - `GITHUB_CLIENT_SECRET` (Sensitive)  
   Opcjonalnie: `PUBLIC_SITE_URL=https://<domena>`, `ADMIN_GITHUB_LOGIN=M1CH4L9`.
5. **Redeploy**  
   Deployments → … → Redeploy (albo pusty commit). Przy buildzie odpalą się migracje.
6. **Pierwsze logowanie jako admin**  
   Wejdź na `/logowanie` → **Kontynuuj z GitHubem** i zaloguj się jako **M1CH4L9**.  
   Konto dostanie `is_admin`. Potem `/admin/prosby/`.

Bez Neonu strona publiczna działa, ale konta zwracają komunikat o braku bazy. Bez OAuth działa tylko rejestracja hasłem (bez admina z GitHuba).

## Treści publiczne (pliki)

```text
notatki/
  bsi/
    przedmiot.yaml
    01-formatowanie-tekstu.md
    ...
```

Szczegóły składni Markdowna (kod, tabele, wzory, callouty) jak wcześniej — te same elementy działają w notatkach użytkowników.

## Motywy

Dwa niezależne ustawienia na `<html>`:

| Ustawienie | Atrybut | Wartości | Domyślnie | `localStorage` |
| --- | --- | --- | --- | --- |
| Jasność | `data-theme` | `dark`, `light` | `dark` | `theme` |
| Tryb cute | `data-cute` | `true`, `false` | `false` | `cute` (`1`/`0`) |

Kolory i typografia wyłącznie przez zmienne w `src/styles/tokens.css`. UI kont korzysta z tych samych zmiennych (`src/styles/account.css`).

## Struktura (konta)

```text
db/migrations/            SQL
scripts/migrate.mjs       migracje przy buildzie
src/lib/server/           db, sesje, hasła, OAuth, notatki, prośby
src/markdown/user.mjs     render Markdowna z bazy
src/pages/logowanie.astro
src/pages/moje/           prywatna sekcja
src/pages/admin/          prośby o publikację
src/pages/u/              publiczne notatki użytkowników
src/pages/api/            mutacje formularzy
src/pages/auth/github/    OAuth
```

## Poza zakresem (na później)

Wspólna edycja przez link, PDF/zdjęcia — schemat i trasy ich nie blokują.
