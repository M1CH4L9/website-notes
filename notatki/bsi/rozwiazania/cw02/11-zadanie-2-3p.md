---
title: "2.3p - Flaga przez FTP"
order: 11
---

W zwykłym terminalu uruchom klienta FTP:

```bash
ftp 192.168.200.152
```

Zaloguj się jako `anonymous`, podając dowolne hasło. W kliencie FTP wpisz:

```text
get flag2.3p.txt
exit
```

Po wyjściu z klienta odczytaj lokalny plik:

```bash
cat flag2.3p.txt
```

Odczytaną flagę wpisz na platformie.
