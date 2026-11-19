---
title: "2.1p - Pełniejszy skan Nmap"
order: 9
---

> **Uwaga do rozwiązania:** Wykonaj skan z maszyny ćwiczeniowej dostępnej przez SSH z zadania 2.2. Detekcja systemu `-O` wymaga odpowiednich uprawnień; w razie błędu nie zakładaj, że cel jest wyłączony.

```bash
nmap -sT -sV -sC -O --osscan-guess -p- -vv 192.168.200.152
```
