# notatnik.

Publiczna strona z notatkami ze studiów. Układ jest prosty: przedmiot, lista notatek, notatka.

## Stos

- [Astro](https://astro.build) w trybie statycznym. Wynik to zwykły HTML i CSS, JavaScript obsługuje tylko przełączniki wyglądu, kopiowanie kodu i spis treści.
- Treści w Markdownie i MDX (kolekcje treści Astro), przetwarzane przez remark i rehype.
- Shiki do podświetlania składni, KaTeX do wzorów.
- Hosting na Vercelu. `vercel.json` wskazuje framework, więc projekt buduje się bez ustawień w panelu.

## Uruchomienie

Wymagany Node.js 24 (Astro 7 działa też na 22.23.4 lub nowszym).

```sh
npm install
npm run dev      # podgląd pod http://localhost:4321
npm run build    # wersja produkcyjna w dist/
npm run preview  # podgląd wersji produkcyjnej
npm run check    # kontrola typów
```

## Treści

Wszystko leży w katalogu `notatki/`:

```text
notatki/
  bsi/
    przedmiot.yaml
    01-formatowanie-tekstu.md
    02-kod-i-terminal.md
    03-wzory-i-mdx.mdx
    obrazki/
      szyfrowanie-symetryczne.svg
```

### Nowy przedmiot

1. Utwórz katalog `notatki/<adres>/`, na przykład `notatki/sieci/`. Nazwa katalogu jest adresem: `/przedmioty/sieci/`.
2. Dodaj w nim plik `przedmiot.yaml`:

   ```yaml
   title: SK
   fullName: Sieci komputerowe
   description: Notatki z wykładów.
   order: 2
   ```

   Wymagane jest tylko `title`. `order` ustala kolejność na stronie głównej.

### Nowa notatka

Dodaj plik `.md` albo `.mdx` w katalogu przedmiotu, na przykład `notatki/sieci/01-model-osi.md`:

```md
---
title: Model OSI
description: Siedem warstw i co robi każda z nich.
updated: 2026-11-14
---

Treść notatki.
```

- Nazwa pliku jest adresem notatki: `/przedmioty/sieci/model-osi/`.
- Numer na początku nazwy (`01-`) ustala kolejność na liście i nie trafia do adresu.
- Wymagane jest tylko `title`. Pole `draft: true` ukrywa notatkę na stronie publicznej (lokalnie nadal ją widać).

### Co działa w notatkach

| Element | Składnia |
| :-- | :-- |
| Nagłówki, listy, tabele, listy zadań, przypisy, przekreślenia | jak na GitHubie |
| Blok kodu z podświetlaniem | ` ```python ` |
| Blok kodu z nazwą pliku | ` ```python title="hasla.py" ` |
| Blok uwagi | `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]` |
| Blok uwagi z własnym tytułem | `> [!TIP] Własny tytuł` |
| Wzór w linii i w bloku | `$a^2 + b^2$` oraz `$$ ... $$` |
| Obrazek | `![opis](./obrazki/plik.png)` |
| Obrazek z podpisem | `![opis](./obrazki/plik.png "Podpis")` |

Obrazki trzymaj obok notatek (na przykład w `notatki/<przedmiot>/obrazki/`) i podawaj ścieżkę względną. Astro sam je zoptymalizuje. Przykładowe notatki w `notatki/bsi/` pokazują wszystkie elementy i są do usunięcia.

## Motywy

Wygląd składa się z dwóch niezależnych ustawień, oba siedzą w atrybutach na `<html>`:

| Ustawienie | Atrybut | Wartości | Domyślnie | Klucz w `localStorage` |
| --- | --- | --- | --- | --- |
| Jasność | `data-theme` | `dark`, `light` | `dark` | `theme` |
| Tryb cute | `data-cute` | `true`, `false` | `false` | `cute` (`1` lub `0`) |

Tryb cute działa z jasnym i z ciemnym: zmienia paletę na różową, kroje nagłówków i zaokrąglenia oraz pokazuje kocie ilustracje.

- `src/components/ThemeInit.astro`: skrypt w `<head>`, który ustawia oba atrybuty przed pierwszym rysowaniem strony, więc nic nie miga.
- `src/components/ThemeSwitch.astro`: suwak cute i przełącznik jasny/ciemny w nagłówku.
- `src/styles/tokens.css`: wszystkie kolory, zaokrąglenia i kroje pisma jako zmienne, po jednym bloku na każdy z czterech wariantów.
- `src/markdown/shiki-kotek-theme.mjs`: kolory kodu dla trybu cute. Bez niego kod używa kolorów GitHuba.

Nowy element interfejsu powinien korzystać ze zmiennych z `tokens.css`, wtedy od razu działa we wszystkich wariantach. Ilustracje z kotami dostają `display: var(--cat-display)`, żeby było je widać tylko w trybie cute.

## Struktura kodu

```text
notatki/                  treści
src/content.config.ts     schemat przedmiotów i notatek
src/lib/notes.ts          odczyt przedmiotów i notatek (jedyne miejsce, które zna źródło danych)
src/markdown/             wtyczki Markdowna: bloki uwag, ramki kodu, kotwice, tabele, rysunki
src/pages/                strony: główna, przedmiot, notatka, 404
src/components/           przełączniki wyglądu, spis treści, ilustracje SVG
src/styles/               tokens.css (motywy), base.css (układ), prose.css (treść notatki)
src/site.config.ts        nazwa i opis strony
```

## Dalszy rozwój

Strona jest dziś w pełni statyczna, ale kilka decyzji zostawia miejsce na konta, prywatne sekcje i wspólną edycję:

- Strony czytają dane wyłącznie przez `src/lib/notes.ts`. Drugie źródło (baza z notatkami użytkowników) dokłada się tam, bez zmian w szablonach.
- Konfiguracja Markdowna jest w jednym module (`src/markdown/index.mjs`) i nie zależy od Astro, więc tym samym zestawem wtyczek da się renderować notatki zapisane w bazie.
- Adresy publicznych notatek są pod `/przedmioty/`, więc ścieżki takie jak `/konto`, `/logowanie` czy `/u/<nazwa>/` pozostają wolne.
- Astro pozwala włączyć renderowanie po stronie serwera dla wybranych stron (adapter `@astrojs/vercel`), a reszta może zostać statyczna. Logowanie, zapisywanie plików i edycja przez link to wtedy zwykłe trasy serwerowe i interaktywne komponenty na istniejącym układzie.
