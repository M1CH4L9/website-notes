---
title: "4.4 - Enumeracja subdomen"
order: 4
---

```bash
gobuster vhost -u http://192.168.100.104/ -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt --domain channel --append-domain
```
