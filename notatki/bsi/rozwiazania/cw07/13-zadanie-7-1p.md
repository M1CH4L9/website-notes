---
title: "7.1p - Przeniesienie Nmap"
order: 13
---

```bash
#Kali:
wget https://github.com/opsec-infosec/nmap-static-binaries/releases/download/v2/nmap-x64.tar.gz
scp nmap-x64.tar.gz student@192.168.100.107:/home/student

#Homework server:
ssh student@192.168.100.107 #Password: pjatk
tar zxvf nmap-x64.tar.gz
```
