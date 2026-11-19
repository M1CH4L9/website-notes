---
title: cw03_p.md
description: Zadania PENTEST
order: 2
---

## 3.1p - Modyfikacja ciasteczka

> **Uwaga do rozwiązania:** W PDF występuje ciasteczko `admin`, w repozytorium `debug`. Nie dodawaj losowego ciasteczka: sprawdź rzeczywiste żądanie.

1. Otwórz `http://192.168.100.153/` w przeglądarce Burpa.
2. Wyślij żądanie do `/` do **Repeatera**.
3. Zmień `Cookie: debug=false` na `Cookie: debug=true` i wyślij żądanie.

## 3.2p - Przejście do danych użytkowników

1. Otwórz `http://192.168.100.153/login/`.
2. Wyślij żądanie do **Repeatera** i ustaw `Cookie: debug=true`.
3. Zmień ścieżkę z `GET /login/` na `GET /usersdata/` i kliknij **Send**.

## 3.3p - Enumeracja identyfikatorów

1. Wyślij żądanie do `/login/` do **Intrudera**.
2. Ustaw ścieżkę `GET /usersdata/4/` i ciasteczko `debug=true`.
3. Wyczyść zbędne pozycje; zaznacz samą cyfrę `4` i kliknij **Add §**. Wynik: `/usersdata/§4§/`.
4. Wybierz **Numbers**: od `1` do `50`, krok `1`.
5. Uruchom **Start attack** i porównaj odpowiedzi.

## 3.4p - Dekodowanie adresu Hackera

1. W wynikach Intrudera znajdź użytkownika **Hacker**; w rozwiązaniu ma identyfikator `48`.
2. Skopiuj jego zakodowane dane do **Decoder** i wybierz **Decode as… → Base64**.
3. Odczytany adres otwórz w Repeaterze. Ścieżka ze źródła: `GET /h4ck3r1333733x/`.
4. Kliknij **Send**.

## 3.5p - Deobfuskacja JavaScript

> **Uwaga do rozwiązania:** Nazwy ukrytych plików różnią się między PDF a repozytorium. Rozstrzygający jest kod uzyskany z Twojej instancji.

1. Skopiuj kod JavaScript z odpowiedzi strony Hackera.
2. W narzędziu [do deobfuskacji z ćwiczenia](https://obf-io.deobfuscate.io/) pozostaw sam JavaScript, bez nagłówków HTTP i znaczników `<script>`.
3. Wybierz **Deobfuscate** i odszukaj `console.log("secrets31337.php")`.
4. W Repeaterze wyślij żądanie do `/h4ck3r1333733x/secrets31337.php`.
5. Odczytaj flagę z odpowiedzi i wpisz na platformie.
