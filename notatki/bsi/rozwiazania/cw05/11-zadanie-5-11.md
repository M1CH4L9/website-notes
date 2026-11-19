---
title: "5.11 - Serwer HTTPS Apache"
order: 11
---

```bash
sudo a2enmod ssl
sudo a2ensite default-ssl.conf
sudo systemctl restart apache2
```
