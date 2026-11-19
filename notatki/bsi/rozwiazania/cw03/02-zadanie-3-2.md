---
title: "3.2 - Intercept i zmiana parametru"
order: 2
---

> **Uwaga do rozwiązania:** W PDF na s. 24 jest parametr `autosolve=no` zmieniany na `yes`; repozytorium używa `solve=0` → `solve=1`. Zmieniaj parametr faktycznie obecny w żądaniu.

1. Otwórz **Proxy → Intercept** i włącz przechwytywanie.
2. Wejdź na `http://192.168.100.103/` i znajdź odpowiednie żądanie **POST**.
3. Zmień `solve=0` na `solve=1`.
4. Kliknij **Forward**. Po zakończeniu wyłącz Intercept, aby nie zatrzymywać pozostałych żądań.
