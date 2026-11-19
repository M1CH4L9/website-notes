---
title: "2.1 - Pierwszy skan Nmap"
order: 1
---

> **Uwaga do rozwiązania:** Pierwszy skan wykonaj na Kali. Po SSH kolejne skany wewnętrznej sieci wykonuj na maszynie ćwiczeniowej. Źródło zaleca ponowienie lub reset maszyny, jeśli system nie zaliczy poprawnej sekwencji.

```bash
nmap -A 192.168.100.102
ssh student@192.168.100.102 -p 23
nmap -A 192.168.100.102
#Its sometimes bugged and doesnt count. If you have problems then reset and restart machine then paste commands in correct order
```
