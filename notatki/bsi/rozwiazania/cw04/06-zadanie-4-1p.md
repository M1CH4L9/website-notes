---
title: "4.1p - Nazwa z certyfikatu"
order: 6
---

> **Uwaga do rozwiązania:** Wartości `developer` i `192.168.100.154` pochodzą z repozytorium. Odczytaj nazwę z certyfikatu swojej maszyny przed dodaniem wpisu do hosts.

```bash
#Open https://192.168.100.154/ in browser and check 'View Certificate' -> 'Common Name' (developer)
echo '192.168.100.154 developer' | sudo tee -a /etc/hosts
#Open https://developer/ in browser
```
