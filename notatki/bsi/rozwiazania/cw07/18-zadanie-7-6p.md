---
title: "7.6p - Konto root bez hasła"
order: 18
---

> **Uwaga do rozwiązania:** Repozytorium wykorzystuje puste hasło roota, a PDF 7p na s. 20 - uprawnienie sudo do `service`. To różne konfiguracje końcowego zadania; zachowano rozwiązanie z repozytorium.

```bash
#Inside the bind shell (admin):
su #Root has an empty password (root::0:0 in /etc/passwd)
cat /root/root.txt #Submit the flag on the platform
```
