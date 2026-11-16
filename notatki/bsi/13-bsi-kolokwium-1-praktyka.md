---
title: "Kolokwium 1 - przygotowanie praktyczne według wskazówek"
description: "Siedem obszarów kolokwium BSI: jak dobrać komendę, odczytać wynik i zdobyć flagę. Przykłady z prac domowych oraz skrót na A4."
order: 13
updated: 2026-11-16
---

## Co wynika z nowych informacji

Ta notatka jest przygotowana **pod przekazane wskazówki o kolokwium**, a nie jako kolejny pełny wykład. Najpierw poznajesz sposób myślenia i podstawowe komendy. Potem przechodzisz przez przykłady z własnych zadań, a na końcu masz krótkie ćwiczenia kontrolne i propozycję treści na kartkę A4.

Z Twoich informacji wynika:

- Będzie **7 zadań**, w formule podobnej do prac domowych, ewentualnie nieco rozwiniętych.
- Próg zaliczenia zapisano jako **minimum 25**. Nie podano tutaj pełnej skali punktów ani rozkładu na zadania, więc nie zakładamy, jaki procent wyniku ani ile zadań to oznacza.
- Najprawdopodobniej trzeba będzie **odczytać i wysłać flagę**, zamiast czekać na automatyczne zaliczenie. To nadal zapowiedź, nie gwarancja identycznej formy każdego zadania.
- Wskazane materiały to **blok 1 na stronie** oraz własna notatka odręczna na maksymalnie jednej kartce A4. Prowadząca może ją sprawdzić; można wcześniej zapytać o akceptację jej treści. Nie zakładaj, że ta długa notatka będzie dozwolona do otwarcia podczas kolokwium.
- PDF-y warto przygotować na dysku **Z:** zgodnie z poleceniem prowadzącej, bo Teams ma być zamknięty.
- Na własnym laptopie ma być maksymalna jasność ekranu; według przekazanej informacji nie będzie wtedy pomocy technicznej.
- Gdy nie wiesz, czy problem jest techniczny, warto zgłosić go i zapytać zamiast długo zgadywać.

**Priorytety nauki:** najwięcej samodzielności i punktów ma wymagać obszar 7, szczególnie SUID, sudo oraz sekcje linPEAS dotyczące uprawnień i użytkowników. W obszarze 5 ćwicz pobieranie plików. W 6 rozpoznawanie własnej roli w reverse/bind shellu. Socat i scenariusz 7.11 nie są głównym kierunkiem tej powtórki.

## Zasada wspólna: od polecenia do flagi

W zadaniu praktycznym dobrze jest rozdzielić cztery rzeczy:

1. **Co mam uzyskać?** Treść pliku, numer portu, odpowiedź HTTP, dostęp do konta czy flagę?
2. **Gdzie mam działać?** Na Kali, maszynie pośredniej, docelowym serwerze, w Burpie czy wewnątrz klienta FTP/SMB?
3. **Jakie dane już dostałem?** IP, port, protokół, ścieżkę, słownik, nazwę użytkownika, kierunek połączenia?
4. **Co potwierdzi sukces?** Poprawny wynik, zapisany niepusty plik, właściwe `id`, widoczna flaga i jej przyjęcie przez platformę.

Nie przywiązuj się do IP, nazw kont i flag z prac domowych. Na kolokwium podstawisz wartości z nowego zadania. W szablonach poniżej `ADRES`, `PORT`, `PLIK`, `KATALOG` i `SLOWNIK` oznaczają takie wartości, a nie tekst do wpisania dosłownie.

**Flaga to dokładna wartość z zadania.** Skopiuj ją bez znaku zachęty terminala, komentarza, nagłówków i przypadkowych spacji. Nie zakładaj jej formatu, dopóki go nie zobaczysz. Samo wykonanie komendy, która wcześniej uruchamiała autosolver, może nie wystarczyć.

## Część I. Zrozumienie i schematy działania

### 1. Linux: wybierz komendę według pytania

Najważniejsze jest odróżnienie **szukania pliku**, **szukania tekstu w pliku** i **wyświetlenia zawartości**.

- „Pokaż, gdzie jestem” → `pwd`.
- „Przejdź do katalogu” → `cd KATALOG`.
- „Pokaż pliki, również ukryte i ich uprawnienia” → `ls -la`.
- „Pokaż zawartość pliku” → `cat PLIK`.
- „Znajdź plik po nazwie” → `find KATALOG -type f -name 'NAZWA'`.
- „Znajdź plik po fragmencie nazwy” → `find KATALOG -type f -iname '*fragment*'`.
- „Znajdź katalog po nazwie” → `find KATALOG -type d -name 'NAZWA'`.
- „Znajdź słowo w konkretnym pliku” → `grep -n 'slowo' PLIK`.
- „Znajdź słowo we wszystkich plikach pod katalogiem” → `grep -rn 'slowo' KATALOG`.

W `find` opcja `-name` rozróżnia wielkość liter, a `-iname` ją ignoruje. `-type f` wybiera zwykłe pliki, `-type d` katalogi. Wzorce z `*` zapisuj w apostrofach, żeby powłoka nie rozwinęła ich za wcześnie.

W `grep` opcja `-r` schodzi po podkatalogach, `-n` podaje numer linii, a `-i` ignoruje wielkość liter. Jeśli szukasz dosłownego ciągu zawierającego znaki specjalne, pomocne jest `-F`.

```bash
find /home -type f -iname '*flag*' 2>/dev/null
grep -rni 'flag' /home/student 2>/dev/null
```

Pierwsza linia szuka **nazw**, druga **treści**. Nie uruchamiaj obu bez zastanowienia: jeśli zadanie wskazuje konkretny katalog, rozpocznij od niego zamiast od całego `/`. To ogranicza szum i czas.

`2>/dev/null` ukrywa błędy, np. brak dostępu; nie nadaje prawa odczytu. Jeśli wynik jest pusty, przy diagnozie powtórz bez ukrywania błędów. `locate` może być szybkie, ale korzysta z indeksu, więc nie jest najlepszym jedynym sprawdzeniem dla świeżo dodanych plików.

Po znalezieniu ścieżki dopiero odczytaj plik:

```bash
cat '/home/student/katalog z nazwa/flag.txt'
```

Przy okazji rozpoznawaj: `id` pokazuje konto i uprawnienia, `who` sesje użytkowników, `ps aux` procesy, `ip a` adresy, `ip r` trasy. Przy plikach `>` nadpisuje, a `>>` dopisuje. `|` przekazuje wyjście jednego programu na wejście następnego.

### 2. Nmap: przeczytaj raport, nie tylko uruchom skan

Enumeracja sieci odpowiada kolejno na pytania: **jaki host, jaki port, jaka usługa, jaka wersja i co z niej wynika?**

```text
PORT      STATE SERVICE VERSION
23/tcp    open  ssh     OpenSSH ...
8080/tcp  open  http    nginx ...
```

To przykład dydaktyczny, nie wynik nowego zadania. Numer portu to **23** lub **8080**, a `/tcp` określa protokół transportowy. `open` to stan portu. `ssh` i `http` opisują usługę; ostatnia część opisuje rozpoznaną implementację lub wersję.

**SSH na porcie 23 nadal jest SSH.** Gdy raport rozpoznaje HTTP na 8080, w adresie curl trzeba użyć `http://ADRES:8080/`. Przy SSH użyjesz `ssh UZYTKOWNIK@ADRES -p 23`.

Zapamiętaj podstawowe opcje jako osobne funkcje:

- `-sn` - odkrywa hosty bez skanowania ich portów.
- `-sT` - skan TCP connect.
- `-sV` - rozpoznawanie usług i wersji.
- `-sC` - domyślne skrypty NSE.
- `-O` - próba rozpoznania systemu, wymagająca odpowiednich uprawnień.
- `-p-` - wszystkie porty 1-65535 w danym typie skanu; w poniższych przykładach TCP.
- `-p PORT` - wybrany port lub lista portów.
- `-n` - bez rozwiązywania nazw DNS.
- `-Pn` - pomiń wstępne sprawdzanie aktywności hosta i spróbuj skanu.
- `-A` - zestaw rozszerzonych funkcji, w tym wersje, OS, domyślne skrypty i traceroute; nie oznacza wszystkich portów.

Nie trzeba w każdym zadaniu uruchamiać wszystkiego. Jeśli masz znaleźć usługę na podanym hoście, sensownym początkiem w laboratorium jest:

```bash
nmap -sV ADRES
```

Jeżeli trzeba sprawdzić wszystkie porty TCP:

```bash
nmap -sT -sV -p- ADRES
```

Jeżeli potrzebujesz informacji ze skryptów, dołącz `-sC`. Gdy pojawia się „host seems down”, sprawdź IP, miejsce wykonania i sieć; `-Pn` może pomóc przy blokowanym host discovery, lecz nie naprawia błędnego IP ani braku trasy.

`closed` oznacza odpowiedź wskazującą brak nasłuchu, a `filtered` brak możliwości rozstrzygnięcia wskutek filtrowania lub braku odpowiednich odpowiedzi. **Otwarty port nie jest automatycznie luką.** To wskazówka, jaką usługę sprawdzić dalej.

### 3. Burp Suite: które narzędzie do którego zadania?

Zapamiętaj pięć skojarzeń:

- **HTTP history = obejrzyj to, co już przesłano.** Żądania, odpowiedzi, nagłówki i przekierowania.
- **Intercept = zatrzymaj przed wysłaniem.** Zmień parametr i wybierz Forward.
- **Repeater = popraw i wyślij jeszcze raz ręcznie.** Kilka prób, porównanie odpowiedzi, zmiana cookie albo ścieżki.
- **Intruder = wykonaj serię prób.** Kolejne identyfikatory lub wiele takich samych żądań.
- **Decoder = odkoduj reprezentację.** Na przykład Base64; nie jest to łamanie szyfrowania.

Ruch musi przechodzić przez Burpa. Najprościej przećwiczyć to w jego wbudowanej przeglądarce. Jeśli nic nie ma w historii, najpierw sprawdź przeglądarkę i proxy, zamiast szukać flagi w pustej zakładce.

W odpowiednim wpisie rozróżniaj **Request** i **Response**. Parametr, metoda i Cookie wysyłane są w żądaniu; flaga może być w treści **lub nagłówku odpowiedzi**. Jeśli przeglądarka od razu przekierowuje na login, obejrzyj wcześniejszą odpowiedź w historii.

W Intruderze zaznacz tylko zmieniany fragment. Przykładowo w `/usersdata/4/` wybierasz cyfrę `4`, usuwasz zbędne pozycje przez Clear § i dodajesz własną przez Add §. **Numbers 1-50, krok 1** daje serię identyfikatorów; **Null payloads** umożliwia powtarzanie niezmienionego żądania.

Jeśli przeglądarka „stoi”, sprawdź, czy Intercept nie zatrzymał ruchu. Po potrzebnej modyfikacji wyłącz go, gdy nie jest już używany.

### 4. Enumeracja WWW: znajdź miejsce podstawienia

Według wskazówki dostaniesz informację, **po czym enumerować** oraz odpowiedni kontekst słownika. Twoim zadaniem będzie dopasować tryb i adres, nie zgadywać całą bazę słów.

- **Katalogi lub pliki:** zmieniasz ścieżkę za hostem → `gobuster dir`.
- **Wirtualne hosty:** zmieniasz nazwę obsługiwaną przez serwer → `gobuster vhost`.
- **Subdomeny w zadaniach z tego kursu:** vhost z domeną dopisywaną do słów.
- **Wartość parametru:** wstawiasz słowa w miejsce `FUZZ` → `gobuster fuzz`.

```bash
gobuster dir -u 'http://ADRES/KATALOG/' -w SLOWNIK
gobuster vhost -u 'http://ADRES/' -w SLOWNIK
gobuster vhost -u 'http://ADRES/' -w SLOWNIK --domain DOMENA --append-domain
gobuster fuzz -u 'http://ADRES/plik.php?parametr=FUZZ' -w SLOWNIK
```

`-u` wskazuje miejsce testu, `-w` plik słownika. W trybie `dir` słownik plików nadal obsługujesz tym samym trybem co katalogi; inne są słowa i adres bazowy. W przypadku HTTPS z niezaufanym certyfikatem laboratorium może wymagać `-k`.

Wirtualny host to nie podfolder. `http://beta.developer/` i `http://developer/beta/` nie oznaczają tego samego. Nazwę można lokalnie przypisać do IP w `/etc/hosts`, jeśli tego wymaga ćwiczenie.

Po skanie **odwiedź znaleziony zasób i sprawdź odpowiedź**, zamiast traktować sam wpis w raporcie jako flagę. Przekierowanie lub `403` też może być ważnym tropem. Jeśli wszystkie losowe adresy zwracają to samo, porównaj długość i treść odpowiedzi dla nieistniejącego zasobu. Nie przepisuj filtra rozmiaru z innej instancji bez sprawdzenia.

### 5. Pobranie pliku: ustal protokół i kierunek połączenia

„Pobierz plik” nie wskazuje jednej komendy. Najpierw przeczytaj, **jak serwer go udostępnia**.

**Zwykły adres HTTP/HTTPS:**

```bash
wget 'http://ADRES:PORT/plik.txt' -O pobrane.txt
curl 'http://ADRES:PORT/plik.txt' -o pobrane.txt
```

Obie linie są alternatywami. W `wget` do treści pliku służy duże **`-O`**, w `curl` małe **`-o`**. Samo `curl URL` zwykle pokaże treść w terminalu. Przy przekierowaniu HTTP curl może wymagać `-L`; nie dodawaj go bez sprawdzenia, jeśli właśnie analizujesz samą odpowiedź przekierowania.

**Surowy transfer TCP z portu:**

```bash
nc ADRES PORT > pobrane.bin
```

To nie jest pobieranie HTTP: w przykładzie usługa wysyła surowe bajty pliku po połączeniu. Gdy zadanie mówi, że **cel sam przyśle plik na Twój port**, uruchamiasz nasłuch:

```bash
nc -lvp PORT > pobrane.bin
```

**UDP z zadań domowych:**

```bash
echo | nc -u ADRES PORT -w 5 > pobrane.bin
```

UDP nie daje gwarancji dostarczenia i kolejności. Jeśli dostaniesz oczekiwaną sumę pliku, sprawdź ją przez `sha1sum pobrane.bin`. Warianty `nc`, zwłaszcza składnia nasłuchu i zachowanie `-w`, mogą się różnić między instalacjami - sprawdzaj `nc -h`.

**Jeśli wskazano FTP lub SMB:** otwórz odpowiedniego klienta, a `get PLIK` wykonaj już wewnątrz niego. Po zakończeniu klienta plik czytasz zwykłym `cat`. Do kopiowania z konta SSH nadaje się `scp UZYTKOWNIK@ADRES:/sciezka/plik .`.

Po transferze sprawdź:

```bash
ls -l pobrane.txt
cat pobrane.txt
```

`cat` jest tutaj odpowiednie dla tekstu; nie wyświetlaj w ten sposób PNG czy innego pliku binarnego. Niepusty plik nadal może być stroną błędu 404 zamiast oczekiwanego dokumentu. Patrz na treść i komunikaty programu.

**Uwaga o `>`:** plik może zostać utworzony lub wyzerowany, zanim połączenie się powiedzie. Samo istnienie pliku nie potwierdza pobrania. Nie nadpisuj jedynej dobrej kopii kolejną próbą bez potrzeby.

### 6. Powłoki: rozpoznaj swoją stronę

Zawsze odpowiedz na trzy pytania: **gdzie działa Bash, kto nasłuchuje, kto się łączy?** W obu wariantach omawianych na zajęciach powłoka działa na celu.

**Reverse shell:**

```text
Cel inicjuje połączenie -> pentester nasłuchuje
Powłoka jest na celu.
```

Jeśli jesteś pentesterem i masz obsłużyć tylko swoją stronę, zwykle przygotowujesz nasłuch:

```bash
nc -lvp PORT
```

**Bind shell:**

```text
Pentester inicjuje połączenie -> cel nasłuchuje
Powłoka jest na celu.
```

Jeśli jesteś pentesterem i powłoka na celu już nasłuchuje:

```bash
nc ADRES_CELU PORT
```

Nie dodawaj na swoim Kali `-e /bin/bash`, jeśli zadanie polega tylko na połączeniu się do powłoki celu. `-e` uruchamia wskazany program **na tej maszynie, gdzie wykonujesz dane `nc`** i jest dostępne tylko w części odmian Netcata.

Samo połączenie `nc` może dać tylko kanał tekstowy, bez powłoki. Sprawdź kontekst zadania. Po uzyskaniu powłoki `id` i `pwd` pomagają ustalić, na jakim koncie i w jakim miejscu działasz. Następnie odczytujesz wskazaną flagę.

Przy reverse shellu cel musi znać dostępny dla niego adres pentestera. W laboratorium będzie to zwykle adres VPN z `ip addr show tun0`, pole `inet`, a nie adres `peer` ani automatycznie adres Wi-Fi. Najpierw uruchom nasłuch, potem stronę łączącą.

### 7. SUID, sudo i linPEAS: najważniejsza samodzielna część

Tu potrzebujesz rozumowania: **co znalazłem, jakie to daje uprawnienie i jak sprawdzić, czy rzeczywiście mogę z niego skorzystać?**

Początek na docelowym systemie:

```bash
id
pwd
ls -la
sudo -l
```

`id` mówi, jakie masz prawa teraz. `ls -la` może pokazać ukryty plik i jego uprawnienia. `sudo -l` pokazuje dostępne reguły. Jeśli sudo pyta o hasło, zwykle chodzi o hasło bieżącego użytkownika; nie zgaduj hasła roota. Sposób uwierzytelniania może zależeć od konfiguracji zadania.

**Jak czytać uprawnienia:** w `-rwsr-xr-x` znak `s` w części właściciela sygnalizuje SUID. Właściciela odczytujesz w dalszych kolumnach `ls -l`. SUID może ustawić efektywny UID właściciela pliku przy uruchomieniu; dla pliku należącego do root może to oznaczać efektywny UID 0. Sam SUID nie oznacza, że każdy plik jest furtką.

Szukanie z prac domowych:

```bash
find / -type f -perm /6000 2>/dev/null
```

`/6000` wybiera pliki z SUID **lub** SGID. Jeśli chcesz wyłącznie SUID:

```bash
find / -type f -perm -4000 2>/dev/null
```

Obejrzyj podejrzaną ścieżkę przez `ls -l /sciezka/pliku`. Nietypowe położenie, ukryta nazwa lub program różniący się od systemu odniesienia mogą być ważne. Nie uruchamiaj mechanicznie wszystkich wyników - standardowe programy z SUID występują też w poprawnie skonfigurowanym systemie.

**Szczególny przypadek Bash:** w zadaniu 7.6 powłoka z odpowiednim SUID wymagała `bash -p`, aby zachować efektywne uprawnienia. Zwykłe uruchomienie mogło je odrzucić. Jednak samo `bash -p` na normalnym pliku nie daje roota. Używaj ścieżki do faktycznie zidentyfikowanego programu, a wynik sprawdzaj przez `id` - może pokazać `euid=0`, nawet gdy rzeczywisty `uid` pozostaje użytkownika.

**Jak czytać sudo:** przykładowy, dydaktyczny wpis:

```text
(root) NOPASSWD: /usr/bin/vi
```

Oznacza możliwość wykonania wskazanego programu jako root bez hasła w ramach tej reguły. Nie oznacza automatycznie, że można wywołać przez sudo dowolną inną komendę. Trzeba rozumieć możliwości dopuszczonego programu: edytor może uruchamiać polecenia, a interpreter wykonywać kod. W praktyce znaczenie mają również argumenty, dodatkowe opcje i ograniczenia zapisane w regule.

**GTFOBins** pomaga sprawdzić, czy funkcje konkretnego programu mogą być wykorzystane w warunkach sudo lub SUID. Dobierz właściwy wariant uprawnień. Opis dla sudo nie jest automatycznie przepisem dla zwykłego uruchomienia bez sudo.

### 7. Ciąg dalszy: jak nie zgubić się w linPEAS

Jeżeli skrypt jest dostępny w katalogu, uruchom go i zachowaj wynik:

```bash
bash linpeas.sh | tee linpeas-wynik.txt
less -R linpeas-wynik.txt
```

`tee` zapisuje standardowe wyjście i jednocześnie je pokazuje. `less -R` pomaga oglądać wynik z kolorami. To lokalna pomoc do przeglądania, nie dodatkowa metoda eskalacji. Jeśli coś nie zostało zapisane, komunikat mógł trafić na stderr.

W `less` wpisz `/szukany_tekst`, potem Enter. `n` przechodzi do następnego dopasowania, `N` do poprzedniego, `q` kończy przeglądanie. Wyszukiwanie jest tekstowe; nazwy nagłówków zależą od wersji skryptu.

Według wskazówki prowadzącej najpierw znajdź dwie grupy informacji:

**Interesting Permissions / interesujące uprawnienia:**

- Jakie pliki z SUID/SGID pokazano? Kto jest właścicielem?
- Czy zwykły użytkownik może zmienić coś wykonywanego przez konto uprzywilejowane?
- Czy pojawia się nietypowa powłoka, lokalizacja albo plik w katalogu użytkownika?
- Czy wskazany trop da się potwierdzić zwykłym `ls -l` i `find`?

**Users Information / informacje o użytkownikach:**

- Na jakim koncie pracujesz i do jakich grup ono należy?
- Czy inne konto ma UID 0?
- Czy widzisz podejrzaną konfigurację hasła lub konta?
- Co wynika z reguł sudo? Poszukaj również osobnych wyników dotyczących sudo - nie zakładaj, że każda wersja linPEAS umieszcza je w jednym konkretnym nagłówku.

Raport to **zbiór tropów, nie lista potwierdzonych podatności**. Kolor lub wyróżnienie nie zastępuje weryfikacji. Gdy zobaczysz ciekawy wpis, wróć do konkretnej ścieżki, konta lub reguły i sprawdź warunki.

Przy kontach sprawdź także:

```bash
cat /etc/passwd
```

Kolejność pól to `nazwa:haslo:UID:GID:opis:dom:powloka`. `x` zwykle oznacza odwołanie do danych hasła w shadow. Konto `backup` z UID 0 jest uprzywilejowane mimo zwykłej nazwy. Puste pole hasła w konfiguracji laboratorium może pozwalać na logowanie bez hasła; zachowanie zależy również od mechanizmów uwierzytelniania.

**Cel końcowy:** uzyskaj wymagany kontekst, potwierdź `id`, odczytaj flagę z lokalizacji podanej w zadaniu i wyślij jej wartość. `/root/solve` znane z prac domowych nie jest standardową komendą Linuxa ani gwarantowanym sposobem oddania kolokwium.

## Część II. Te same mechanizmy w Twoich pracach domowych

Poniższe adresy i nazwy pochodzą z Twoich rozwiązań. Służą do powtórzenia konkretnych laboratoriów. Na kolokwium zastępujesz je wartościami z treści zadania.

### 1. Zadania 1.10, 1.12 i 1.13: ukryty plik, nazwa i zawartość

W **1.10** kluczowe było znalezienie pliku pomijanego przez zwykłe `ls`:

```bash
ls -a
cat .secret
```

W **1.12** najpierw szukałeś nazwy, potem czytałeś znalezioną ścieżkę:

```bash
locate FINDME
cat /opt/FINDME
```

Jeśli indeks nie pokazuje świeżego pliku, odpowiednikiem sprawdzenia nazwy jest `find /opt -type f -name 'FINDME'`. W **1.13** znałeś nazwę pliku, a szukałeś konkretnej treści:

```bash
grep solution WORDS
```

**Możliwe rozwinięcie do przećwiczenia:** dostajesz katalog, ale nie nazwę pliku z odpowiedzią. Najpierw przejrzyj zawartość, potem użyj `find` dla wskazówki o nazwie albo `grep -rn` dla wskazówki o treści. To wariant treningowy, nie zapowiedź dokładnego zadania.

### 2. Zadania 2.4-2.7 i 2.2p: skan prowadzi do konkretnej usługi

W **2.4** odkrywałeś hosty:

```bash
nmap -sn 10.13.37.0/24
```

Następnie na znalezionym adresie sprawdzałeś port, wersję oraz informacje skryptów. Szablon po podstawieniu celu:

```bash
nmap -sT ADRES
nmap -sV ADRES
nmap -sC -sV ADRES
```

W **2.2p** rozwiązanie wymagało pamiętania o porcie HTTP 8080:

```bash
curl http://192.168.200.152:8080/flag2.2p.txt
```

**Wniosek:** skan dostarcza adresu usługi do następnego kroku. Jeśli podasz samo IP bez `:8080`, sprawdzisz inną usługę lub port bez nasłuchu. W części prac domowych skany wewnętrzne trzeba było wykonywać po SSH na maszynie pośredniej.

### 3. Zadania 3.1-3.5 i 3.3p: wybór modułu Burpa

Powtórz praktycznie poniższy ciąg we własnym laboratorium:

1. **3.1:** otwórz stronę `http://192.168.100.103/`, znajdź żądanie do `/` w historii i odczytaj nagłówek **Response** `FLAG_3_1`.
2. **3.2:** zatrzymaj właściwe żądanie POST w **Intercept**, zmień `solve=0` na `solve=1`, kliknij Forward.
3. **3.3:** wyślij żądanie `vote=YES` do **Repeatera** i powtórz je ręcznie.
4. **3.4:** wyślij żądanie do **Intrudera**, ustaw Null payloads i liczbę powtórzeń.
5. **3.5:** odkoduj dane ze strony `/encoded/` w **Decoderze** jako Base64.

W **3.3p** użyłeś Numbers 1-50, aby przejść po `/usersdata/ID/`. W rozwiązaniu Hacker miał ID 48, ale w nowym zadaniu nie zakładaj tej liczby. Porównuj rzeczywiste odpowiedzi.

Warianty PDF i repozytorium różniły się nazwami ciasteczek, parametrami i wartością głosu. Ćwicz na rzeczywistym żądaniu, nie na samym zapamiętanym napisie.

### 4. Zadania 4.1, 4.2, 4.4 i 4.5: cztery miejsca enumeracji

**4.1 - katalogi na stronie głównej:**

```bash
gobuster dir -u http://192.168.100.104/ -w /usr/share/seclists/Discovery/Web-Content/raft-small-directories.txt -r
```

**4.2 - pliki w konkretnym katalogu:**

```bash
gobuster dir -u http://192.168.100.104/misc/ -w /usr/share/seclists/Discovery/Web-Content/raft-small-files.txt
```

**4.4 - nazwy z dopisaną domeną:**

```bash
gobuster vhost -u http://192.168.100.104/ -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt --domain channel --append-domain
```

**4.5 - wartość parametru:**

```bash
gobuster fuzz -u 'http://192.168.100.104/4.5.php?password=FUZZ' -w /usr/share/seclists/Passwords/Common-Credentials/xato-net-10-million-passwords-100000.txt --exclude-length 334
```

`334` jest filtrem z zapisanej instancji, a nie uniwersalną wartością. Podczas nauki wskaż palcem, **który fragment żądania zmienia każde polecenie**. Jeśli umiesz to zrobić, łatwiej dostosujesz szablon do podanego słownika i nowej ścieżki.

### 5. Zadania 5.1, 5.3 i 5.5: trzy sposoby pobrania

**5.1: Ty inicjujesz TCP i zapisujesz odebrane bajty.**

```bash
nc 192.168.100.105 12301 > tcpconnect.png
```

**5.3: używasz UDP; echo wysyła początkowe dane, aby serwer mógł odpowiedzieć.**

```bash
echo | nc -u 192.168.100.105 12302 -w 5 > udpconnect.png
```

**5.5: Ty nasłuchujesz, a maszyna zadaniowa przychodzi z plikiem.**

```bash
nc -lvp 12303 > tcplisten.png
```

W **5.3p** pobierałeś zasoby WWW przez:

```bash
wget -r --no-parent http://192.168.200.155/
```

To pobieranie rekursywne odnajdywanych zasobów. Jeśli na kolokwium podano jeden konkretny plik, zwykle nie trzeba pobierać całego drzewa. W każdym przypadku rozpoznaj transport i kierunek połączenia. Socat nie jest potrzebny do tych przykładów.

### 6. Zadania 6.2 i 6.6: tylko rola pentestera

W **6.2**, reverse shell, po stronie Kali wykonywałeś:

```bash
nc -lvp 12302
```

To cel uruchamiał swoje `nc ... -e /bin/bash` i łączył się do Twojego VPN IP. Jeśli na kolokwium obsługujesz tylko pentestera, nie musisz sam konfigurować drugiej strony, o ile treść zadania jej nie wymaga.

W **6.6**, bind shell, po stronie Kali wykonywałeś:

```bash
nc 192.168.100.106 32102
```

Cel miał już nasłuch z podłączonym Bashem. Po połączeniu komendy kierowałeś do celu. **To role sieciowe rozstrzygają nazwę techniki, nie kolejność numerów zadań ani obecność samego słowa Bash.**

### 7. Zadania 7.4-7.6: znajdź i zrozum SUID

W **7.4** podejrzanym plikiem w katalogu domowym była ukryta binarka `.zsh_history`. Nazwa wyglądała jak plik historii, ale rzeczywisty typ i uprawnienia miały większe znaczenie niż nazwa:

```bash
ls -la
```

W **7.5** szukałeś w całym systemie:

```bash
find / -type f -perm /6000 2>/dev/null
```

W zapisanym rozwiązaniu furtką był `/usr/sbin/delete`. Nie wynika z tego, że każdy program o takiej nazwie ma identyczne działanie.

W **7.6** rozwiązaniem był Bash z właściwym SUID:

```bash
bash -p
id
```

**Ćwiczenie do wykonania:** dla każdej z tych trzech maszyn zapisz: ścieżkę podejrzanego pliku, właściciela, widoczne prawa, wynik `id` przed i po wykorzystaniu. Jeśli potrafisz to wyjaśnić, rozumiesz rozwiązanie zamiast pamiętać jedną komendę.

### 7. Zadania 7.8 i 7.9: sudo do interpretera albo edytora

W **7.8** najpierw sprawdzałeś regułę, a następnie używałeś dopuszczonego Perla:

```bash
sudo -l
sudo /usr/bin/perl -e 'system("/root/solve");'
```

Ten przykład pokazuje możliwość wykonania programu poprzez interpreter uruchomiony jako root. `/root/solve` był celem laboratoryjnym. W nowym zadaniu może być potrzebna inna czynność, np. odczyt konkretnej flagi; nie przepisuj końcówki bez przeczytania polecenia.

W **7.9** najpierw w zwykłej powłoce:

```bash
sudo -l
sudo vi
```

Potem **wewnątrz vi**, jako polecenie edytora:

```text
:!bash
```

Następnie w uzyskanej powłoce sprawdzasz `id` i wykonujesz czynność wymaganą w zadaniu. `:!bash` nie wpisujesz jako zwykłego polecenia w terminalu przed otwarciem vi.

### 7. Zadanie 7.10: informacje o użytkownikach

```bash
cat /etc/passwd
```

W Twoim wariancie ważne było konto `backup` z UID 0 i pustym polem hasła. Następnie:

```bash
su backup
id
```

**Wniosek:** nie szukaj wyłącznie konta nazwanego `root`. Sprawdzaj numery UID i rzeczywiste zasady dostępu. Nie zakładaj też, że puste pole zawsze ominie uwierzytelnianie w dowolnym systemie.

Scenariusza **7.11 z nadpisywaniem `/etc/passwd` nie rozwijamy w tej notatce**, zgodnie z nową wskazówką. W pierwszej kolejności opanuj powyższe prostsze przypadki oraz nawigowanie po wyniku linPEAS.

## Część III. Jak szukać brakującej opcji w dokumentacji

Nie musisz pamiętać każdej flagi. Musisz umieć szybko znaleźć **opcję programu**, nie pomylić jej z **flagą zadania do oddania** i rozpoznać, do czego służy.

### Pomoc programu, pomoc trybu, a potem man

1. Zacznij od pomocy narzędzia: `nmap -h`, `nc -h`, `curl --help`, `wget --help`.
2. Dla narzędzia z trybami sprawdź konkretny tryb, np. `gobuster dir --help`, `gobuster vhost --help`, `gobuster fuzz --help`.
3. Gdy opis jest za krótki, otwórz `man nmap`, `man find`, `man grep`, `man curl` albo `man nc`.
4. W typowym czytniku man wpisz `/slowo`, Enter, potem `n` lub `N`. Wyjście: `q`.

Przydatne angielskie hasła do wyszukiwania w pomocy:

- zapis pobranego pliku: `output`, `output-document`;
- nasłuch: `listen`;
- wybór portów: `ports`, `port specification`;
- wykrywanie wersji: `version detection`;
- schodzenie po katalogach: `recursive`;
- nazwa pliku bez rozróżniania liter: `iname`;
- prawa plików: `perm`;
- przekierowania HTTP: `redirect`, `location`;
- słownik: `wordlist`.

### Przykład: nie pamiętam, jak zapisać wynik curl

Otwórz `man curl` i wyszukaj `/--output`. Znajdziesz opcję `-o, --output` oraz informację, że następuje po niej nazwa pliku. Następnie dostosuj przykład do zadania:

```bash
curl 'http://ADRES/flag.txt' -o flag.txt
```

Nie przenoś tej opcji mechanicznie do `wget`, w którym `-o` oznacza log. Czytaj pomoc **tego programu, którego używasz**.

### Przykład: nie pamiętam trybu enumeracji

Nie przeglądaj całej dokumentacji od początku. Jeśli treść mówi „pliki w katalogu”, zacznij od `gobuster dir --help` i poszukaj URL oraz wordlist. Jeśli mówi o parametrze, wybierz pomoc `fuzz` i sprawdź użycie `FUZZ`.

Lokalna dokumentacja nie wymaga otwierania Teams. To, z jakich źródeł wolno korzystać w trakcie kolokwium, nadal wynika z zasad prowadzącej. Nie zakładaj dostępności Internetu ani zewnętrznych stron z gotowymi rozwiązaniami.

## Część IV. Krótka próba przed kolokwium

Poniższe zadania są treningiem ułożonym na podstawie wskazówek. Nie są prawdziwymi pytaniami ani potwierdzonym rozkładem punktów. Przećwicz je na przygotowanym laboratorium, a przed podglądem odpowiedzi powiedz własnymi słowami, co robisz.

### Siedem scenariuszy do sprawdzenia

1. W podanym katalogu istnieje plik o nieznanej nazwie. W treści zawiera słowo `solution`. Znajdź go i odczytaj odpowiedź.
2. Dostajesz wynik Nmap z SSH na 2222 i HTTP na 8080. Wskaż porty i przygotuj po jednej komendzie dostępu.
3. Flaga nie jest widoczna w HTML, ale jest w nagłówku odpowiedzi. Następnie trzeba sprawdzić ID 1-20. Dobierz dwa moduły Burpa.
4. Podano URL katalogu i słownik nazw plików. Przygotuj polecenie enumeracji we właściwym miejscu.
5. Cel wysyła plik na Twój port TCP 12303. Przygotuj pobieranie i wyjaśnij, dlaczego samo utworzenie pliku nie potwierdza sukcesu.
6. Cel ma już bind shell na 32102. Jesteś pentesterem. Przygotuj tylko swoją stronę.
7. Na celu ustal konto, zbadaj sudo i pliki SUID, a następnie wyjaśnij jeden realny trop z raportu linPEAS. Nie wystarcza wskazanie koloru.

<details>
<summary>Odpowiedzi i kryteria poprawnego rozumowania</summary>

1. `grep -rn 'solution' KATALOG` wskazuje plik i linię. Odczytaj trafienie i w razie potrzeby cały plik przez `cat`. To szukanie treści, więc sam `find -name` nie odpowiada na pytanie.
2. `ssh UZYTKOWNIK@ADRES -p 2222` oraz `curl 'http://ADRES:8080/'`. Nie wybieraj protokołu wyłącznie po typowym numerze portu.
3. HTTP history, panel Response z nagłówkami; potem Intruder z pozycją na ID i Numbers 1-20. Repeater byłby dobry do pojedynczej ręcznej próby.
4. `gobuster dir -u 'http://ADRES/PODANY_KATALOG/' -w PODANY_SLOWNIK`. Zachowaj właściwy katalog bazowy.
5. `nc -lvp 12303 > pobrane.bin`. Nasłuchujesz, bo cel inicjuje kontakt. Przekierowanie może stworzyć pusty plik przed połączeniem; sprawdź rozmiar i oczekiwaną treść lub sumę.
6. `nc ADRES_CELU 32102`. Nie konfigurujesz dodatkowego reverse shella ani lokalnego Basha.
7. Minimum: `id`, `sudo -l`, `find / -type f -perm /6000 2>/dev/null`, przegląd odpowiednich sekcji linPEAS. Potwierdź konkretny plik lub regułę i jej warunki. Następnie sprawdź uzyskane uprawnienia i odczytaj wskazaną flagę.

</details>

### Co zrobić, gdy coś nie działa

Zamiast losowo zmieniać opcje, sprawdź po kolei:

1. Czy jestem na właściwej maszynie i koncie? `id`, `pwd`, adresy interfejsów.
2. Czy przepisałem poprawnie IP, port, ścieżkę i nazwę parametru?
3. Czy cel wymaga dostępu z maszyny pośredniej?
4. Czy wybrałem TCP/UDP oraz connect/listen zgodnie z treścią?
5. Czy inny program nie zajmuje portu? Czy w Burpie nie został włączony Intercept?
6. Czy komunikat oznacza błąd składni, brak opcji w tej wersji, brak uprawnień, odmowę połączenia czy timeout?
7. Czy rezultat rzeczywiście jest flagą, a nie komunikatem błędu albo samym sukcesem narzędzia?

Przy zgłoszeniu podaj **zadanie, miejsce wykonania, komendę i dokładny komunikat**. Zgodnie ze wskazówką warto zapytać, czy problem jest techniczny. Brak wyniku po jednej próbie nie rozstrzyga przyczyny.

## Propozycja skrótu do przepisania na A4

To materiał do **ręcznego skrócenia i przepisania**, nie potwierdzenie akceptacji kartki przez prowadzącą. Miejsce zależy od pisma i układu; najpierw sprawdź, ile się mieści, i usuń rzeczy, które już pamiętasz. Najwięcej miejsca zostaw na obszar 7 oraz te opcje, które najłatwiej mylisz.

```text
ZASADA: CEL -> GDZIE DZIALAM -> KOMENDA -> WYNIK -> FLAGA
ADRES/PORT/PLIK/KAT/SL = wartosci z zadania

1. LINUX
pwd; cd KAT; ls -la; cat PLIK; id
find KAT -type f -iname '*nazwa*' 2>/dev/null
find KAT -type d -name 'nazwa'
grep -rni 'tekst' KAT; grep -n 'tekst' PLIK
> nadpisz; >> dopisz; | przekaz stdout; 2> bledy

2. NMAP
nmap -sV ADRES; nmap -sT -sV -p- ADRES
-sn hosty; -sV wersje; -sC skrypty; -O OS
-p- wszystkie porty; -p PORT wybrane; -n bez DNS
-Pn pomin host discovery; -A NIE znaczy wszystkie porty
PORT/PROTO | STATE | SERVICE | VERSION
ssh USER@ADRES -p PORT; curl http://ADRES:PORT/sciezka

3. BURP
History: request/response, naglowki; Intercept: zmien+Forward
Repeater: recznie powtarzaj; Intruder: seria, pozycje §
Numbers: kolejne ID; Null payloads: powtorzenia bez zmian
Decoder: Base64; gdy stoi strona -> sprawdz Intercept

4. ENUMERACJA
gobuster dir -u URL/KAT/ -w SL
gobuster vhost -u URL -w SL
vhost + --domain DOMENA --append-domain
gobuster fuzz -u 'URL?param=FUZZ' -w SL
-k certyfikat; rozmiar bledow sprawdz przed filtrem

5. POBRANIE
wget 'URL' -O PLIK; curl 'URL' -o PLIK
nc ADRES PORT > PLIK; nc -lvp PORT > PLIK
echo | nc -u ADRES PORT -w 5 > PLIK
ls -l PLIK; cat PLIK (tekst); sha1sum PLIK (gdy podano sume)
FTP/SMB: get PLIK wewnatrz klienta

6. PENTESTER
REVERSE: cel laczy -> ja slucham: nc -lvp PORT
BIND: cel slucha -> ja lacze: nc ADRES_CELU PORT
Shell na celu! VPN IP: ip addr show tun0, inet

7. UPRAWNIENIA
id; ls -la; sudo -l; cat /etc/passwd
find / -type f -perm /6000 2>/dev/null  (SUID lub SGID)
find / -type f -perm -4000 2>/dev/null (SUID)
ls -l /sciezka; root-wlasciciel? s w prawach?
bash -p tylko przy odpowiednim SUID; potwierdz id/euid
sudo: jaki program, jako kto, haslo, argumenty?
vi przez sudo -> :!bash WEWNATRZ vi -> id
UID 0 = root niezaleznie od nazwy; haslo/PAM ma znaczenie
linPEAS: Interesting Permissions + Users Information + sudo
bash linpeas.sh | tee wynik.txt; less -R wynik.txt
/SUID lub /Users lub /sudo; n nastepny; q wyjdz
Wynik narzedzia to trop -> sprawdz konkretna regule/plik
Na koniec odczytaj i wyslij flage, nie zakladaj autosolvera

POMOC: narzedzie -h/--help; gobuster TRYB --help; man X
man/less: /slowo, Enter, n/N, q
output, listen, ports, recursive, wordlist, perm, iname
```

## Jak korzystać z pozostałych notatek

Ten plik jest celowo węższy niż pełne przygotowanie. W tym samym folderze masz:

- `bsi-rozwiazania.md` - dokładne sekwencje 101 zadań i uwagi o różnicach instancji.
- `bsi-spis-komend.md` - szerszy słownik poleceń i opcji.
- `bsi-kolokwium-1.md` - pełną teorię z 14 PDF-ów.

Podstawą nowego zakresu są Twoje informacje o kolokwium. Przykłady praktyczne pochodzą z wcześniejszego opracowania i plików [repozytorium BSI](https://github.com/M1CH4L9/BSI), zwłaszcza zadań 1.10-1.13, 2.4-2.7, 2.2p, 3.1-3.5, 3.3p, 4.1-4.5, 5.1-5.5, 6.2, 6.6 oraz 7.4-7.10. Dodatkowe scenariusze kontrolne i skrót A4 są materiałem treningowym. Nie uruchamiano tych poleceń na maszynach BSI ani nie odtwarzano przyszłego kolokwium.
