---
title: "3.1p - Modyfikacja ciasteczka"
order: 6
---

> **Uwaga do rozwiązania:** W PDF występuje ciasteczko `admin`, w repozytorium `debug`. Nie dodawaj losowego ciasteczka: sprawdź rzeczywiste żądanie.

1. Otwórz `http://192.168.100.153/` w przeglądarce Burpa.
2. Wyślij żądanie do `/` do **Repeatera**.
3. Zmień `Cookie: debug=false` na `Cookie: debug=true` i wyślij żądanie.
