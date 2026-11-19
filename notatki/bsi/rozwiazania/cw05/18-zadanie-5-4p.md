---
title: "5.4p - Logowanie kluczem SSH"
order: 18
---

> **Uwaga do rozwiązania:** Użytkownik `wwwadmin` jest z repozytorium; PDF podaje `webadmin`. Właściciela klucza ustal z dostępnych danych, m.in. komentarza klucza publicznego.

```bash
#On student@192.168.100.105:
cat ~/192.168.200.155/.ssh/id_ed25519.pub
chmod 600 ~/192.168.200.155/.ssh/id_ed25519
ssh -i ~/192.168.200.155/.ssh/id_ed25519 wwwadmin@192.168.200.155
```
