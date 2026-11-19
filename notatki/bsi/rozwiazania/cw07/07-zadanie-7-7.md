---
title: "7.7 - System 4 - porównanie sum plików"
order: 7
---

> **Uwaga do rozwiązania:** Porównuj z system0 o tej samej wersji pakietów. Inna suma pliku jest wskazówką do analizy, a nie samodzielnym dowodem backdoora. W repozytorium podmieniono `chfn`; w slajdach jest inna ścieżka.

```bash
ssh system4@192.168.100.107 -p 2204 #Password: pjatk
find / -type f -perm /6000 -exec sha1sum {} \; 2>/dev/null
#Compare SHA1 with system0 (same command)
/usr/bin/chfn #Modified SUID binary (root shell)
/root/solve
```
