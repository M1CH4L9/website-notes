---
title: "5.1p - Przeniesienie statycznego Nmap"
order: 15
---

```bash
wget https://github.com/opsec-infosec/nmap-static-binaries/releases/download/v2/nmap-x64.tar.gz
scp nmap-x64.tar.gz student@192.168.100.105:/home/student
ssh student@192.168.100.105 #Password: pjatk
tar zxvf nmap-x64.tar.gz
```
