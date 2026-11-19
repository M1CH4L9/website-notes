---
title: cw02_p.md
description: Zadania PENTEST
order: 2
---

## 2.1p - Pełniejszy skan Nmap

> **Uwaga do rozwiązania:** Wykonaj skan z maszyny ćwiczeniowej dostępnej przez SSH z zadania 2.2. Detekcja systemu `-O` wymaga odpowiednich uprawnień; w razie błędu nie zakładaj, że cel jest wyłączony.

```bash
nmap -sT -sV -sC -O --osscan-guess -p- -vv 192.168.200.152
```

## 2.2p - Flaga przez HTTP

> **Uwaga do rozwiązania:** Port `8080` pochodzi z rozwiązania. Numer portu HTTP ustal ze skanu; nie zakładaj portu 80.

```bash
curl http://192.168.200.152:8080/flag2.2p.txt
```

Odczytaj flagę z wyniku i wpisz ją na platformie.

## 2.3p - Flaga przez FTP

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

## 2.4p - Flaga przez SMB

W zwykłym terminalu otwórz udział SMB:

```bash
smbclient -N //192.168.200.152/FLAG
```

W interaktywnym kliencie wpisz:

```text
get flag2.4p.txt
exit
```

Po wyjściu z klienta odczytaj lokalny plik:

```bash
cat flag2.4p.txt
```

Odczytaną flagę wpisz na platformie.
