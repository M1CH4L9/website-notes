---
title: "3.4 - Automatyzacja głosowania w Intruderze"
order: 4
---

> **Uwaga do rozwiązania:** Zrzut na s. 35 PDF pokazuje też śledzenie przekierowań **Always** oraz przetwarzanie cookies w przekierowaniach. Dostosuj te ustawienia, jeśli bez nich głosy nie są zaliczane.

1. Wyślij żądanie głosowania z `vote=YES` do **Intrudera**.
2. Wyczyść zbędne znaczniki przyciskiem **Clear §**.
3. Ustaw **Payload type → Null payloads** i **Generate → 100**.
4. Uruchom **Start attack** i poczekaj na wyniki. Jeśli zadanie wymaga ponad 100 głosów, uwzględnij głosy wysłane wcześniej lub zwiększ liczbę powtórzeń.
