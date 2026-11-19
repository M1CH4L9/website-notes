# notatnikpja.

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
| `/logowanie`, `/rejestracja`, `/haslo/` | logowanie e-mailem lub nazwą, GitHub OAuth, rejestracja z potwierdzeniem adresu i reset hasła |
| `/moje/` | prywatne notatki i foldery, sortowanie według tytułu lub aktualizacji |
| `/profil/` | konto, potwierdzanie adresu e-mail, hasło, GitHub, motywy |
| `/moje/nowa/`, `/moje/<slug>/`, `/moje/<slug>/edytuj/` | CRUD + live preview |
| `/moje/z-publicznej?subject=&note=` | kopia publicznej notatki |
| `/przedmioty/<przedmiot>/<slug>/` | publiczne notatki z plików **oraz** zaakceptowane publikacje użytkowników |
| `/admin/prosby/` | panel: nowe prośby, aktualizacje, przedmioty, publikacje (admin) |
| `/u/<nazwa>/<slug>/` | przekierowanie do publikacji na homepage (kompatybilność) |
| `/w/<token>/`, `/w/<token>/edytuj/` | link współdzielony do prywatnej notatki (odczyt / edycja) |

Admin: konto połączone z GitHubem `M1CH4L9` (albo `ADMIN_GITHUB_LOGIN`).

## Po merge na Vercelu (kolejność)

1. **Neon (Vercel Marketplace)**  
   Vercel → projekt → Storage / Marketplace → Neon → Create.  
   Region najlepiej blisko funkcji (np. Frankfurt / `fra1`).  
   Zostaw bazę na **Production** (preview bez osobnej bazy nie powinno migrować produkcji - skrypt i tak pomija non-production).
2. **Zmienna bazy**  
   Upewnij się, że jest `DATABASE_URL` albo `POSTGRES_URL` (Neon z Marketplace zwykle dokłada to sam).
3. **GitHub OAuth App**  
   GitHub → Settings → Developer settings → OAuth Apps → New (albo edycja istniejącej).  
   - Application name: `notatnikpja`  
   - Application logo: wgraj `public/oauth-icon.png` z repo  
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

Bez Neonu strona publiczna działa, ale konta zwracają komunikat o braku bazy. Logowanie GitHub wymaga OAuth. Rejestracja i odzyskiwanie hasła przez e-mail wymagają konfiguracji poczty.

## Poczta kont na Vercelu

1. Zweryfikuj domenę nadawcy w [Resend](https://resend.com/domains) i utwórz klucz z uprawnieniem do wysyłki.
2. W środowisku **Production** projektu Vercel ustaw `RESEND_API_KEY` jako Sensitive i `AUTH_EMAIL_FROM` jako pełny adres z tej domeny, np. `Notatnik <konto@twoja-domena.pl>`.
3. Jeśli używasz własnego adresu strony, ustaw `PUBLIC_SITE_URL=https://adres-strony`. W przeciwnym razie linki użyją produkcyjnego adresu Vercel. Lokalnie ustaw `PUBLIC_SITE_URL=http://localhost:4321`.
4. Wdróż wersję z migracjami `005` i `006`. Skrypt produkcyjnego buildu przeprowadzi migracje. Do testowania preview użyj osobnej bazy z tymi migracjami.

Rejestracja zaczyna się od linku do skrzynki. Po jego otwarciu użytkownik wybiera nazwę i hasło. Istniejące konta mogą dodać adres w profilu. Link do potwierdzenia adresu jest ważny 60 minut, link resetu 30 minut. Po resecie trzeba zalogować się ponownie na wszystkich urządzeniach. Bez ustawień poczty dostępne pozostaje logowanie przez GitHub oraz przez hasło do istniejących kont.

## Treści publiczne (pliki)

```text
notatki/
  bsi/
    przedmiot.yaml
    11-bsi-spis-komend.md
    rozwiazania/
      folder.yaml
      cw01/
        folder.yaml
        01-zadanie-1-1.md
```

Każdy widoczny folder ma `folder.yaml` z `title` i opcjonalnymi `description` oraz `order`. Foldery można zagnieżdżać. Adres notatki zależy od nazwy pliku (po pominięciu liczbowego prefiksu), więc nazwy muszą być unikalne w całym przedmiocie. Przeniesienie pliku do folderu zachowuje adres. `archive: true` ukrywa notatkę z list, zachowując dostęp przez jej adres. Pełna wersja „Rozwiązań” BSI jest archiwum ze starymi kotwicami. Bieżące zadania edytuj w odpowiednim folderze ćwiczenia.

Szczegóły składni Markdowna (kod, tabele, wzory, callouty) jak wcześniej - te same elementy działają w notatkach użytkowników.

## Motywy

Dwa niezależne ustawienia na `<html>`:

| Ustawienie | Atrybut | Wartości | Domyślnie | `localStorage` |
| --- | --- | --- | --- | --- |
| Jasność | `data-theme` | `dark`, `light` | `dark` | `theme` |
| Tryb cute | `data-cute` | `true`, `false` | `false` | `cute` (`1`/`0`) |

Wybór trzyma się w `localStorage` i nie resetuje się przy nawigacji (`ClientRouter` / view transitions). Po zalogowaniu trafia też do kolumn `pref_theme` / `pref_cute` na koncie: lokalne → serwer przy pierwszym logowaniu bez zapisu; serwer → lokalne, gdy w przeglądarce nie ma jeszcze wpisu.

Kolory i typografia wyłącznie przez zmienne w `src/styles/tokens.css`. UI kont korzysta z tych samych zmiennych (`src/styles/account.css`).

## Struktura (konta)

```text
db/migrations/            SQL
scripts/migrate.mjs       migracje przy buildzie
src/lib/server/           db, sesje, hasła, OAuth, notatki, prośby
src/markdown/user.mjs     render Markdowna z bazy
src/pages/logowanie.astro
src/pages/moje/           prywatne notatki
src/pages/profil/         konto (dane, hasło)
src/pages/admin/          prośby o publikację
src/pages/u/              publiczne notatki użytkowników
src/pages/api/            mutacje formularzy + podgląd Markdown
src/pages/auth/github/    OAuth
public/favicon.svg        favicon
public/oauth-icon.png     ikona do GitHub OAuth App
```

## Publikowanie na homepage

1. Autor prywatnej notatki wysyła **Prośbę o upublicznienie** (istniejący przedmiot albo zgłoszenie nowego).
2. Admin w `/admin/prosby/` akceptuje: powstaje **snapshot** w tabeli `publications` i wpis w przedmiocie na stronie głównej.
3. Późniejsze edycje u autora są lokalne. **Zaktualizuj publikację** wysyła prośbę typu update (pola do wyboru).
4. Usunięcie prywatnej notatki **nie usuwa** publikacji (`source_note_id` → NULL). Admin może zdjąć publikację w zakładce Publikacje.
5. Linki współdzielone do prywatnych notatek to osobny mechanizm (nie mylić z publikacją).

## Linki współdzielone

- Generowanie i unieważnianie na stronie prywatnej notatki (`Udostępnij`).
- **Odczyt** (`/w/<token>/`): bez konta.
- **Edycja** (`/w/<token>/edytuj/`): token `edit` wystarcza; zalogowanie opcjonalne (nick w obecności).
- Sync: polling + optimistic concurrency (`revision`); obecność „kto edytuje”.
- Kursory CRDT (Yjs) - follow-up (wymaga WebSocket / Durable Objects na Vercelu).

## Poza zakresem (na później)

PDF/zdjęcia, kursory live (Yjs) - schemat share nie blokuje.

## Pobieranie PDF

`/api/notes/download?...&format=pdf` generuje PDF po stronie serwera przez Puppeteer i Chromium (pakiet `@sparticuz/chromium`, dołączony do funkcji Vercel). Wykorzystuje te same kontrole dostępu co eksport Markdown: prywatną notatkę pobiera właściciel, udostępnioną - posiadacz aktywnego linku. Nie otwiera okna drukowania ani nie zmienia motywu strony.

Dokument A4 ma tekst do zaznaczania i wyszukiwania, osadzone fonty, numerację stron, podświetlanie kodu, automatyczny podział treści i powtarzane nagłówki tabel. Kod zawija długie linie, a rozwijane sekcje są otwarte w PDF. Nie korzysta z canvas ani z obrazów całych stron. Blok dłuższy niż strona dzieli się między stronami.

Generator uruchamia się w Node.js 24. Konfiguracja Astro dołącza Chromium, fonty i lokalne obrazki do funkcji; nie potrzeba klucza zewnętrznej usługi. Pierwsze pobranie może potrwać kilka sekund. Jedna instancja obsługuje jeden eksport naraz; zajętość zwraca 503 z komunikatem ponowienia. Funkcja ma limit 60 sekund. `PDF_CHROMIUM_PATH` opcjonalnie wskazuje własny Chromium lokalnie.

Treść jest renderowana przez sanitowany potok Markdown. Przeglądarka generatora ma wyłączony JavaScript i zablokowaną sieć; obrazki mogą pochodzić z `notatki/` lub `public/`. Niedostępne i zewnętrzne obrazki powodują błąd eksportu zamiast cichego pomijania. JSX z własnymi komponentami wymaga osobnego wsparcia; obecne notatki MDX z HTML i wzorami są obsługiwane.

### Test regresji

Wymaga Chromium dla Playwright (`npx playwright install chromium`) i narzędzia `pdftotext` z Popplera.

```sh
npm run dev -- --port 4321
# W drugim terminalu:
npm run test:pdf
```

Opcjonalne `PDF_TEST_URL` i `CHROMIUM_PATH` wybierają serwer oraz przeglądarkę testową. Test pobiera rzeczywiste PDF w czterech kombinacjach motywu i szerokości, sprawdza brak migania, zmiany pozycji, chowania przycisków i rozwijania oryginalnej treści. Ekstrakcja tekstu sprawdza również początek, kod, polskie znaki i zakończenie dokumentu. Symulowany błąd serwera pozwala ponowić próbę bez drukowania. Pliki do kontroli wizualnej trafiają do katalogu tymczasowego.
