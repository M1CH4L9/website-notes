---
title: "4.2p - Odkrycie subdomeny"
order: 7
---

```bash
gobuster vhost -u https://developer/ -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt --domain developer --append-domain -k
#Found beta.developer
echo '192.168.100.154 beta.developer' | sudo tee -a /etc/hosts
#Open https://beta.developer/ in browser
```
