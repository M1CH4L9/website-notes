# Notatnik 🐾

Publiczna, statyczna biblioteka notatek: Astro, TypeScript, Markdown i CSS. Domyślny różowy motyw z kotkiem oraz neutralne motywy jasny i ciemny. Obecne treści są demonstracyjne.

## Uruchomienie

Wymagany Node.js 22.12+ (lub 24 LTS).

```sh
npm ci
npm run dev
```

```sh
npm run check
npm test
npm run build
npm run preview
```

## Dodawanie notatek

Dodaj plik `src/content/notes/nazwa-notatki.md`. Nazwa pliku staje się adresem `/notatki/nazwa-notatki/`. Przykładowe metadane:

```yaml
---
title: "Tytuł notatki"
description: "Krótki opis do biblioteki"
subject: "BSI"
category: "Podstawy"
tags: ["sieci", "przykład"]
order: 10
icon: "book"
demo: false
---
```

Dostępne ikony: `shield`, `code`, `key`, `terminal`, `network`, `book`. Kolejność wynika z pola `order`. Używaj unikalnych wartości. Nowe przedmioty i kategorie pojawiają się automatycznie. Wyszukiwanie obejmuje tytuł, opis i tagi; ignoruje wielkość liter i polskie znaki. Spis treści korzysta z nagłówków `##` i `###`.

Markdown obsługuje listy, statyczne checklisty, tabele, cytaty, linki oraz bloki kodu z nazwą języka. Kod jest podświetlany przez Shiki i można go kopiować. Przycisk kopiowania wymaga HTTPS lub localhost; przy braku dostępu do schowka podpowiada kopiowanie ręczne. Bloki kodu i tabele przewijają się na wąskich ekranach.

Wyróżnienie:

```html
<div class="callout"><strong>Wskazówka</strong>Treść wskazówki.</div>
```

Rozwijana sekcja:

```html
<details><summary>Dodatkowe wyjaśnienie</summary><p>Treść.</p></details>
```

Obrazki umieszczaj w `public/`, a w Markdown odwołuj się do nich np. `![Opis obrazka](/rysunek.svg)`.

Treści Markdown/HTML są zaufanym kodem autora repozytorium. Nie należy przyjmować niezweryfikowanego HTML od odwiedzających. Strona nie ma publicznej edycji ani zapisu postępów; zmiana motywu zapisuje się wyłącznie lokalnie w przeglądarce.

## Vercel

1. Wyślij projekt do repozytorium GitHub.
2. W Vercel wybierz **Add New → Project** i zaimportuj repozytorium.
3. Framework: **Astro**; build: `npm run build`; output: `dist`; Node.js: **24.x**.
4. Wdróż projekt. Nie są potrzebne zmienne środowiskowe, baza danych ani własna domena.

Vercel buduje kolejne wersje po zmianach na podłączonej gałęzi. Treść można edytować przez GitHub, z historią zmian i możliwością przywrócenia wersji. Publikacja nie jest częścią pierwszego lokalnego buildu.

## Przed zastąpieniem przykładów

Usuń demonstracyjne pliki i dodaj własne. Ustaw `demo: false`; oznaczenia na kartach i w czytniku wynikają z tego pola. Informacja o przykładowej bibliotece znika, gdy nie ma już demonstracyjnych wpisów. Sprawdź wygląd dłuższych tytułów, kodu i tabel w każdym motywie, na telefonie oraz komputerze.

## Weryfikacja pierwszej wersji

`npm run check` oraz `npm test` przechodzą. Testy sprawdzają 8 wygenerowanych stron, linki i kotwice, wyszukiwanie z polskimi znakami, łączenie filtrów, pusty wynik i reset, trzy motywy oraz ich zapamiętywanie, sukces i błąd kopiowania kodu oraz kontener przewijania tabel.

Testy DOM nie zastępują testów wizualnych. Podgląd w środowisku chmurowym został zablokowany przez `relay could not open browser port 4173: timed out waiting for relay readiness`. Do potwierdzenia w przeglądarce pozostają szerokości 360, 390, 768, 1024 i 1440 px, kontrast, fokus klawiatury i zachowanie dotykowe.
