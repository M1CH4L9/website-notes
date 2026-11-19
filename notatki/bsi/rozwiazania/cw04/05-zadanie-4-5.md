---
title: "4.5 - Fuzzing parametru password"
order: 5
---

> **Uwaga do rozwiązania:** Wartość `334` to rozmiar typowej nieudanej odpowiedzi w zapisanej instancji. Ustal aktualny rozmiar przed filtrowaniem, aby nie ukryć poprawnej odpowiedzi.

```bash
gobuster fuzz -u 'http://192.168.100.104/4.5.php?password=FUZZ' -w /usr/share/seclists/Passwords/Common-Credentials/xato-net-10-million-passwords-100000.txt --exclude-length 334
```

**PENTEST** · [plik źródłowy](https://github.com/M1CH4L9/BSI/blob/main/cw04/cw04_p.md).
