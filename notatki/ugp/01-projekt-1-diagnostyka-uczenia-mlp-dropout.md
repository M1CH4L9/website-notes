---
title: "Projekt 1 — diagnostyka uczenia MLP i dropout"
description: "Projekt z Keras od zera: półksiężyce, podział danych, baseline'y, MLP, loss, overfitting, 9 treningów z dropout, metryki, wykresy i pytania do obrony."
updated: 2026-11-18
order: 1
---

> **O co chodzi?** Mamy punkty tworzące dwa zaszumione półksiężyce. Komputer ma nauczyć się rozpoznawać, do którego półksiężyca należy dany punkt. Najpierw sprawdzamy proste modele, potem sieć neuronową **MLP**, a na końcu eksperymentujemy z **dropout**.

To jest notatka **do zrozumienia i wytłumaczenia własnego projektu**, a nie nowe rozwiązanie. Przykłady kodu, nazwy zmiennych i liczby pochodzą z notebooka `projekt1_michal(4).ipynb`. W notebooku kod jest podzielony na mniejsze komórki — tutaj łączę go w logiczne fragmenty i wyjaśniam, co robią.

**Ważne:** wyniki są wynikami z zapisanego uruchomienia projektu. Na innym komputerze lub przy innej wersji bibliotek mogą się nieznacznie zmienić.

## Jak się z tego uczyć?

1. Najpierw przeczytaj rozdziały 1–5, żeby zrozumieć, **co w ogóle robimy**.
2. Potem przejdź przez kod i spróbuj bez patrzenia powiedzieć, **co robi każda ważniejsza linia**.
3. Na końcu naucz się **interpretacji wyników**, a nie samych liczb.
4. Sprawdź się z pytaniami z rozdziału 20.

## Spis treści

1. [Projekt w 30 sekund](#1-projekt-w-30-sekund)
2. [Google Colab i notebook](#2-google-colab-i-notebook)
3. [Co jest daną, cechą, etykietą i klasyfikacją?](#3-co-jest-daną-cechą-etykietą-i-klasyfikacją)
4. [Tworzenie półksiężyców](#4-tworzenie-półksiężyców)
5. [Podział na trening, walidację i test](#5-podział-na-trening-walidację-i-test)
6. [Pierwszy wykres](#6-pierwszy-wykres)
7. [Model naiwny](#7-model-naiwny)
8. [Regresja logistyczna i niedouczenie](#8-regresja-logistyczna-i-niedouczenie)
9. [Granice decyzyjne](#9-granice-decyzyjne)
10. [Jak działa sieć MLP?](#10-jak-działa-sieć-mlp)
11. [Budowanie MLP w Keras](#11-budowanie-mlp-w-keras)
12. [Trenowanie, epoki, batch i loss](#12-trenowanie-epoki-batch-i-loss)
13. [Przeuczenie kontra niedouczenie](#13-przeuczenie-kontra-niedouczenie)
14. [Dropout — co naprawdę robi?](#14-dropout--co-naprawdę-robi)
15. [Dziewięć kontrolowanych treningów](#15-dziewięć-kontrolowanych-treningów)
16. [Wyniki eksperymentu i odchylenie standardowe](#16-wyniki-eksperymentu-i-odchylenie-standardowe)
17. [Wybór modelu i test końcowy](#17-wybór-modelu-i-test-końcowy)
18. [Python i biblioteki — ściąga](#18-python-i-biblioteki--ściąga)
19. [Jak opowiedzieć projekt prowadzącemu?](#19-jak-opowiedzieć-projekt-prowadzącemu)
20. [Pytania kontrolne z odpowiedziami](#20-pytania-kontrolne-z-odpowiedziami)
21. [Najważniejsze pojęcia i źródła](#21-najważniejsze-pojęcia-i-źródła)

---

## 1. Projekt w 30 sekund

### Co chciałem sprawdzić?

W projekcie są **dwie hipotezy**:

1. Sieć neuronowa MLP powinna lepiej rozpoznawać dwa półksiężyce niż model, który umie rozdzielać punkty tylko prostą linią.
2. Dropout **może** poprawić wynik, jeśli sieć zacznie się przeuczać. To hipoteza do sprawdzenia, a nie gwarantowany efekt.

### Co zrobiłem po kolei?

| Krok | Co robiłem? | Po co? |
|---|---|---|
| 1 | Wygenerowałem 1200 punktów | Żeby mieć dane do nauki |
| 2 | Podzieliłem punkty na 840 / 180 / 180 | Żeby oddzielić uczenie, wybieranie modelu i końcową ocenę |
| 3 | Zbudowałem model naiwny i regresję logistyczną | Żeby zobaczyć, od jakiego poziomu zaczynamy |
| 4 | Zbudowałem MLP z dwoma warstwami po 64 neurony | Żeby nauczyć się nieliniowej granicy między klasami |
| 5 | Obserwowałem stratę treningową i walidacyjną | Żeby sprawdzić proces uczenia i oznaki przeuczenia |
| 6 | Porównałem dropout 0.0 / 0.2 / 0.4 i po trzy ziarna | Żeby rzetelniej zbadać wpływ dropout |
| 7 | Wybrałem model według walidacji i raz oceniłem test | Żeby uzyskać niezależny wynik końcowy |

### Najważniejsze wyniki

| Model | Accuracy | F1 | Zbiór |
|---|---:|---:|---|
| Naiwny | 50,00% | 0,00% | Walidacja |
| Regresja logistyczna | 87,22% | 87,01% | Walidacja |
| MLP bez dropout, ziarno 11 | 95,56% | 95,40% | Walidacja |
| **Wybrany MLP bez dropout, ziarno 11** | **93,89%** | **93,79%** | **Test** |

> **Główny wniosek:** MLP lepiej poradził sobie z półksiężycami niż regresja logistyczna. W naszych 9 treningach dodawanie dropout **nie poprawiło średniego wyniku**. Nie było też wyraźnego przeuczenia, więc nie możemy twierdzić, że dropout je ograniczył.

---

## 2. Google Colab i notebook

**Google Colab** to środowisko, w którym można uruchamiać kod Pythona w przeglądarce. Nie trzeba samodzielnie konfigurować całego Pythona i bibliotek na komputerze.

Plik `*.ipynb` to **notebook**, czyli dokument złożony z komórek:

- **Komórka tekstowa (Markdown)** — nagłówek, wyjaśnienie, raport.
- **Komórka kodu (Python)** — kod do wykonania.
- **Wynik komórki** — tekst, tabela albo wykres pokazany pod uruchomionym kodem.

Komórki używają **wspólnej pamięci**. Jeżeli w jednej napiszę:

```python
dane = [10, 20, 30]
```

to w kolejnej mogę napisać:

```python
print(dane)
```

Ale muszę najpierw uruchomić komórkę z utworzeniem `dane`! Po restarcie sesji zmienne znikają z pamięci, mimo że kod zapisany w notebooku zostaje.

**Praktyczna zasada:** przed oddaniem projektu warto użyć opcji uruchomienia **wszystkich komórek od góry**, żeby sprawdzić, czy kod nie polega na jakiejś starej zmiennej.

Najważniejsze biblioteki w projekcie:

| Biblioteka | Do czego służy tutaj? |
|---|---|
| `numpy` | Tablice, tworzenie siatki punktów do wykresów |
| `matplotlib.pyplot` | Rysowanie wykresów |
| `sklearn` (scikit-learn) | Dane `make_moons`, podział, proste modele, accuracy i F1 |
| `tensorflow.keras` | Tworzenie i uczenie sieci neuronowej |
| `pandas` | Tabele i liczenie średniej oraz odchylenia |

---

## 3. Co jest daną, cechą, etykietą i klasyfikacją?

Wyobraź sobie jeden punkt na kartce:

```text
punkt = [1.2, 0.5]
klasa = 1
```

Ten punkt ma **dwie cechy**:

- pierwsza liczba `1.2` — położenie na osi X;
- druga liczba `0.5` — położenie na osi Y.

Ma też **etykietę** (`klasa`), czyli poprawną odpowiedź. W naszym przypadku to `0` lub `1`.

| Pojęcie | Po ludzku | Przykład |
|---|---|---|
| Próbka / przykład | Jeden punkt | `[1.2, 0.5]` |
| Cecha (feature) | Informacja o punkcie | Współrzędna X lub Y |
| Etykieta (label) | Poprawna klasa | `0` albo `1` |
| Klasyfikacja | Wybieranie kategorii | „Ten punkt należy do klasy 1” |
| Model | Program, który nauczył się reguły | Regresja logistyczna lub MLP |
| Trenowanie | Dopasowywanie modelu do danych | Zmiana wag sieci |
| Predykcja | Zgadywanie odpowiedzi przez gotowy model | `model.predict(...)` |

To **klasyfikacja binarna**, ponieważ są dokładnie dwie możliwości: klasa 0 i klasa 1.

Model nie dostaje informacji „ten punkt jest w górnym półksiężycu” w postaci instrukcji słownej. Dostaje **współrzędne i przykładowe poprawne odpowiedzi** i ma sam dopasować regułę.

---

## 4. Tworzenie półksiężyców

Kod z początku projektu:

```python
import tensorflow as tf
from sklearn.datasets import make_moons

print("TensorFlow:", tf.__version__)

dane, klasy = make_moons(
    n_samples=1200,
    noise=0.25,
    random_state=42
)

print("Rozmiar danych:", dane.shape)
print("Rozmiar etykiet:", klasy.shape)
```

### Co oznaczają argumenty `make_moons`?

- `n_samples=1200` — tworzymy **1200 punktów**.
- `noise=0.25` — dodajemy losowy szum, przez co punkty nie leżą idealnie na łukach. Zadanie staje się trudniejsze i bardziej realistyczne.
- `random_state=42` — ustalamy **ziarno generatora danych**, aby przy ponownym uruchomieniu otrzymać taki sam zestaw punktów.

Dlaczego półksiężyce? Ponieważ **nie da się ich dobrze rozdzielić jedną prostą linią**. Łatwo więc zobaczyć różnicę między modelem liniowym a siecią uczącą się bardziej skomplikowanego kształtu.

### Co zawierają zmienne?

```python
dane.shape   # (1200, 2)
klasy.shape  # (1200,)
```

Ważne, żeby rozumieć nawiasy:

- `(1200, 2)` = **1200 wierszy i 2 kolumny**. Każdy wiersz to jeden punkt, a kolumny to X i Y.
- `(1200,)` = **1200 etykiet w jednej tablicy**. Dla każdego punktu jedna poprawna klasa.

Przykładowo, `dane[0]` to współrzędne pierwszego punktu, a `klasy[0]` to jego poprawna klasa.

### Czym jest „ziarno”?

Losowanie komputerowe zwykle jest **pseudolosowe**: program wylicza ciąg liczb, który wygląda losowo, ale można go powtórzyć od tego samego punktu startowego.

```python
random_state=42
```

oznacza „użyj tego samego punktu startowego”. Sama liczba **42 nie jest magiczna**. Można byłoby użyć innej — ważne, że w poleceniu podano właśnie 42.

> **Uwaga:** `random_state=42` przy tworzeniu danych to coś innego niż późniejsze ziarna `11`, `22`, `33` używane przy trenowaniu sieci.

---

## 5. Podział na trening, walidację i test

Mamy 1200 punktów, ale **nie powinniśmy trenować modelu i oceniać go na tych samych punktach**. Model mógłby je po prostu zapamiętać, a nie nauczyć się sensownej reguły.

Dlatego tworzymy trzy zbiory:

| Zbiór | Procent | Punkty | Rola |
|---|---:|---:|---|
| **Treningowy** | 70% | **840** | Na tych danych model uczy się, zmienia swoje wagi |
| **Walidacyjny** | 15% | **180** | Sprawdzamy jakość w trakcie pracy i wybieramy wariant |
| **Testowy** | 15% | **180** | Otwieramy na końcu, żeby niezależnie ocenić wybrany model |

### Kod podziału

```python
from sklearn.model_selection import train_test_split

dane_treningowe, dane_pozostale, klasy_treningowe, klasy_pozostale = train_test_split(
    dane, klasy,
    test_size=0.3,
    random_state=42,
    stratify=klasy
)

dane_walidacyjne, dane_testowe, klasy_walidacyjne, klasy_testowe = train_test_split(
    dane_pozostale, klasy_pozostale,
    test_size=0.5,
    random_state=42,
    stratify=klasy_pozostale
)
```

### Dlaczego dwa razy `train_test_split`?

W pierwszym podziale:

- `70%` całych danych trafia do treningu;
- `30%` zostaje „na później”, czyli **360 punktów**.

W drugim podziale rozcinamy te pozostałe 360 punktów na pół:

- `180` do walidacji;
- `180` do testu.

Dlatego `test_size=0.5` w drugim wywołaniu **nie oznacza połowy całych 1200 punktów**! To połowa tylko tych 360 pozostałych.

### Co robi `stratify`?

Stratyfikacja pilnuje, żeby w poszczególnych zbiorach zachować podobne **proporcje klas**.

Gdybyśmy przypadkowo do testu wylosowali prawie same punkty klasy 0, ocena byłaby mniej miarodajna. W tym projekcie mamy dwie klasy występujące po mniej więcej tyle samo, więc chcemy zachować ten rozkład w treningu, walidacji i teście.

### Czym jest wyciek danych (data leakage)?

To sytuacja, kiedy przy uczeniu lub wyborze modelu wykorzystamy informacje, których **nie powinniśmy jeszcze znać**.

Przykład: sprawdzamy wynik testowy, zmieniamy `dropout`, sprawdzamy go ponownie, aż test wygląda pięknie. Wtedy test przestaje być niezależną oceną — zaczynamy dopasowywać projekt do testu.

**Zasada projektu:**

- trening — do uczenia;
- walidacja — do porównywania i wyboru;
- test — **jeden końcowy sprawdzian po wyborze**.

W projekcie **nie skalowaliśmy danych**, ponieważ obie cechy miały podobne rzędy wielkości. Skalowanie nie było tu wymagane. Jeśli jednak mielibyśmy skalować, np. przez `StandardScaler`, to parametry skalowania należałoby wyliczyć **tylko z treningu**, a później zastosować do walidacji i testu.

---

## 6. Pierwszy wykres

Przed trenowaniem oglądamy, jak rzeczywiście wyglądają dane.

```python
import matplotlib.pyplot as plt

zbiory = [
    ("Trening", dane_treningowe, klasy_treningowe),
    ("Walidacja", dane_walidacyjne, klasy_walidacyjne),
    ("Test", dane_testowe, klasy_testowe)
]

plt.figure(figsize=(12, 4))

for numer, (nazwa, punkty, etykiety) in enumerate(zbiory):
    plt.subplot(1, 3, numer + 1)

    plt.scatter(punkty[etykiety == 0, 0], punkty[etykiety == 0, 1], label="Klasa 0", s=10)
    plt.scatter(punkty[etykiety == 1, 0], punkty[etykiety == 1, 1], label="Klasa 1", s=10)

    plt.title(nazwa)
    plt.xlabel("Cecha 1")
    plt.ylabel("Cecha 2")
    plt.legend()

plt.tight_layout()
plt.show()
```

Nie musisz zapamiętywać całego kodu wykresu. Rozumiej najważniejsze linie:

| Fragment | Znaczenie |
|---|---|
| `plt.figure(figsize=(12, 4))` | Tworzy obszar wykresu o wybranych rozmiarach |
| `zbiory = [...]` | Lista trzech rzeczy do narysowania |
| `for ... in enumerate(zbiory)` | Przechodzi po treningu, walidacji i teście, dając też numer 0, 1, 2 |
| `plt.subplot(1, 3, numer + 1)` | Układ: 1 rząd, 3 wykresy, wybór kolejnego panelu |
| `plt.scatter(...)` | Rysuje punkty |
| `plt.xlabel`, `plt.ylabel` | Podpisuje osie |
| `plt.legend()` | Pokazuje legendę klas |
| `plt.tight_layout()` | Porządkuje odstępy |
| `plt.show()` | Wyświetla wykres |

### Co znaczy dziwne `punkty[etykiety == 0, 0]`?

To tylko wybieranie odpowiednich elementów tablicy NumPy:

```python
etykiety == 0          # sprawdź, które punkty mają klasę 0
punkty[etykiety == 0] # wybierz całe punkty klasy 0
punkty[etykiety == 0, 0] # ich pierwsza cecha, czyli X
punkty[etykiety == 0, 1] # ich druga cecha, czyli Y
```

Czyli `plt.scatter(X, Y)` dostaje współrzędne tylko jednej klasy. Potem robimy to samo dla drugiej.

**Co widać?** Punkty układają się w dwa zakrzywione łuki, ale przez szum częściowo się mieszają. Dlatego nawet dobry model może popełniać błędy.

---

## 7. Model naiwny

Zanim użyjemy sieci neuronowej, warto sprawdzić, jaki wynik dałby **najprostszy możliwy model**.

```python
from sklearn.dummy import DummyClassifier
from sklearn.metrics import accuracy_score, f1_score

model_naiwny = DummyClassifier(strategy="most_frequent")
model_naiwny.fit(dane_treningowe, klasy_treningowe)

przewidywania_naiwne = model_naiwny.predict(dane_walidacyjne)

print("Accuracy:", accuracy_score(klasy_walidacyjne, przewidywania_naiwne))
print("F1:", f1_score(klasy_walidacyjne, przewidywania_naiwne))
```

### Jak działa ten model?

`strategy="most_frequent"` oznacza: **zobacz, która klasa występuje najczęściej w treningu, i przewiduj zawsze tę klasę**.

Taki model:

- nie patrzy sensownie na X i Y;
- nie uczy się kształtu półksiężyców;
- zawsze odpowiada jedną klasą.

W naszym przypadku klasy były tak samo liczne. Model naiwny wybierał klasę `0`, więc każde pytanie kwitował odpowiedzią „0”.

### Co otrzymaliśmy?

```text
Accuracy: 0.5
F1: 0.0
```

`0.5` to **50%** — połowę odpowiedzi trafił, bo połowa walidacji należy do klasy 0.

F1 to **0**, ponieważ przy domyślnym ustawieniu `f1_score` oceniamy **klasę dodatnią 1**, a model **nigdy nie przewiduje klasy 1**. Nie rozpoznaje więc ani jednego pozytywnego przypadku.

**Wniosek:** następne modele muszą osiągnąć wynik wyraźnie lepszy niż 50% accuracy.

---

## 8. Regresja logistyczna i niedouczenie

Teraz używamy modelu, który **rzeczywiście bierze pod uwagę cechy punktów**, ale ma ograniczenie: jego granica decyzyjna jest liniowa.

```python
from sklearn.linear_model import LogisticRegression

model_liniowy = LogisticRegression()
model_liniowy.fit(dane_treningowe, klasy_treningowe)

przewidywania_liniowe = model_liniowy.predict(dane_walidacyjne)

print("Accuracy:", accuracy_score(klasy_walidacyjne, przewidywania_liniowe))
print("F1:", f1_score(klasy_walidacyjne, przewidywania_liniowe))
```

Wyniki zapisane w notebooku:

```text
Accuracy: 0.8722222222222222  → 87,22%
F1:       0.8700564971751412  → 87,01%
```

### Dlaczego nazywa się „regresja”, skoro klasyfikuje?

To po prostu tradycyjna nazwa algorytmu. **Regresja logistyczna** jest często używana właśnie do **klasyfikacji**. Oblicza wartość z zakresu od 0 do 1, interpretowaną jako prawdopodobieństwo klasy 1, a potem może zamienić ją na klasę.

### Dlaczego nie osiąga 100%?

Regresja logistyczna używa liniowej funkcji cech. W dwóch wymiarach daje to **prostą linię** oddzielającą klasy (dla typowego progu 0.5).

A nasze półksiężyce nie są oddzielone prostą. Dlatego część punktów znajdzie się po niewłaściwej stronie tej linii.

To jest przykład **ograniczonej zdolności modelu do odwzorowania problemu** — można to wykorzystać do omówienia **niedouczenia (underfitting)**. Ważne: samo 87% nie dowodzi niedouczenia; podstawą diagnozy jest również **kształt granicy** i to, że model nie potrafi oddać nieliniowej struktury danych.

> **Na obronie:** „Regresja logistyczna osiągnęła około 87% accuracy, ale jej liniowa granica nie odpowiada kształtowi półksiężyców. MLP z aktywacją ReLU może stworzyć granicę nieliniową, dlatego powinien lepiej poradzić sobie z tym zbiorem”.

---

## 9. Granice decyzyjne

**Granica decyzyjna** to linia, po której jednej stronie model przewiduje klasę 0, a po drugiej klasę 1.

### Jak zrobić taki wykres?

Na zwykłym wykresie rysujemy prawdziwe punkty. Tutaj dodatkowo chcemy zobaczyć, **co model powiedziałby dla każdego miejsca na całej kartce**.

Dlatego tworzymy **siatkę wielu sztucznych punktów** i prosimy model o przewidywanie dla każdego z nich:

```python
import numpy as np

x = np.linspace(-2, 3, 200)
y = np.linspace(-1.5, 2, 200)

siatka_x, siatka_y = np.meshgrid(x, y)
punkty_siatki = np.column_stack((siatka_x.ravel(), siatka_y.ravel()))
```

Krok po kroku:

1. `np.linspace(-2, 3, 200)` tworzy **200 równomiernych wartości** X od -2 do 3.
2. Podobnie tworzymy 200 wartości Y.
3. `np.meshgrid(x, y)` tworzy ich wszystkie kombinacje — **200 × 200 = 40 000 miejsc** na wykresie.
4. `ravel()` zamienia tablicę 2D w jedną długą listę wartości.
5. `np.column_stack(...)` łączy X i Y w pary `[x, y]`, czyli przygotowuje 40 000 punktów do `predict`.

**To nie są nowe dane treningowe!** To tylko miejsca, w których pytamy model „jaką klasę byś tu przewidział?” — żeby pokolorować tło.

### Kod do pokolorowania tła

```python
przewidywania = model_liniowy.predict(punkty_siatki)
przewidywania = przewidywania.reshape(siatka_x.shape)

plt.contourf(siatka_x, siatka_y, przewidywania, alpha=0.3, cmap="coolwarm")
```

- `predict` — przewiduje klasę dla każdej pozycji na siatce.
- `reshape(siatka_x.shape)` — układa wyniki z powrotem w prostokątną siatkę 200 × 200.
- `contourf` — koloruje obszary zależnie od przewidywanej klasy.
- `alpha=0.3` — tło jest półprzezroczyste, żeby nie zasłaniało punktów.

W projekcie rysowaliśmy obok siebie model naiwny i liniowy, używając pętli po liście `modele` i `plt.subplot(1, 2, numer + 1)`.

### Jak czytać wykres?

- **Kolor kropki** — prawdziwa klasa danego punktu walidacyjnego.
- **Kolor tła** — klasa przewidziana przez model w tym miejscu.
- **Kropka na tle drugiej klasy** — prawdopodobny błąd modelu dla tego punktu.

Model naiwny ma tło jednego koloru (wszędzie klasa 0). Regresja logistyczna rozdziela tło **prostą granicą**. Późniejsze MLP ma granicę **zakrzywioną**.

---

## 10. Jak działa sieć MLP?

**MLP** (*Multilayer Perceptron*, perceptron wielowarstwowy) to sieć złożona z warstw neuronów. W naszym projekcie przyjmuje **dwie liczby** (X i Y) i zwraca **jedną liczbę od 0 do 1**.

### Architektura naszej sieci

| Warstwa | Liczba neuronów | Aktywacja | Zadanie |
|---|---:|---|---|
| Wejście | 2 cechy | — | Pobiera X i Y |
| Ukryta nr 1 | 64 | ReLU | Przetwarza cechy |
| Ukryta nr 2 | 64 | ReLU | Łączy wykryte zależności |
| Wyjściowa | 1 | Sigmoid | Zwraca wynik dla klasy 1 |

Mówiąc prościej: pierwsze warstwy próbują zrozumieć, **gdzie jest punkt** i do jakiej części kształtu pasuje. Ostatnia daje odpowiedź.

### Neuron, wagi i bias — najprościej

Pojedynczy neuron bierze liczby, mnoży je przez swoje **wagi**, dodaje **bias** (wyraz wolny), a następnie przepuszcza przez funkcję aktywacji.

Dla dwóch wejść można to zapisać jako:

```text
z = x1 * w1 + x2 * w2 + b
wynik_neuronu = aktywacja(z)
```

- `x1`, `x2` — wejściowe dane;
- `w1`, `w2` — wagi, które sieć zmienia w trakcie nauki;
- `b` — bias, który również jest uczony;
- `aktywacja` — funkcja decydująca, co neuron przekazuje dalej.

Właśnie **dobieranie wag i biasów** jest sercem trenowania sieci.

### ReLU — po co jest?

**ReLU** działa tak:

```text
ReLU(z) = max(0, z)
```

- jeśli `z = -3`, wynik to `0`;
- jeśli `z = 5`, wynik to `5`.

ReLU wprowadza **nieliniowość**, czyli umożliwia sieci budowanie bardziej złożonych kształtów granicy. Gdyby wszystkie warstwy ukryte wykonywały wyłącznie operacje liniowe, ich połączenie nadal zachowywałoby się jak jedno przekształcenie liniowe.

### Sigmoid — dlaczego na wyjściu?

**Sigmoid** ściska dowolną wartość do przedziału `(0, 1)`.

Przykładowo:

- wynik `0.08` — model mocno wskazuje klasę 0;
- wynik `0.48` — niepewna sytuacja, nadal klasa 0 przy progu 0.5;
- wynik `0.72` — klasa 1;
- wynik `0.96` — mocne wskazanie klasy 1.

W naszym kodzie:

```python
przewidywania = model.predict(dane_walidacyjne, verbose=0)
przewidywania = (przewidywania >= 0.5).astype(int).ravel()
```

1. `predict` daje wartości z zakresu 0–1.
2. `>= 0.5` zamienia każdą z nich na `True`/`False`.
3. `astype(int)` zamienia `True` na 1, a `False` na 0.
4. `ravel()` spłaszcza wynik z kształtu `(180, 1)` do `(180,)`, żeby wygodnie porównać go z etykietami.

**Ważne:** sigmoid zwraca oszacowaną pewność klasy 1, a nie pewnik. Wynik 0.9 nie gwarantuje, że odpowiedź jest poprawna.

---

## 11. Budowanie MLP w Keras

Kod z projektu:

```python
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense

tf.keras.utils.set_random_seed(11)

model_mlp = Sequential([
    tf.keras.Input(shape=(2,)),
    Dense(64, activation="relu"),
    Dense(64, activation="relu"),
    Dense(1, activation="sigmoid")
])

model_mlp.compile(
    optimizer="adam",
    loss="binary_crossentropy",
    metrics=["accuracy"]
)

model_mlp.summary()
```

### Linijka po linijce

**`Sequential([...])`** — tworzy model, w którym dane przechodzą kolejno przez podane warstwy: od pierwszej do ostatniej.

**`Input(shape=(2,))`** — każdy przykład ma **dwie cechy**. Liczba punktów nie jest tu wpisana na sztywno, bo możemy podawać różnej wielkości porcje danych.

**`Dense(64, activation="relu")`** — tworzy warstwę **64 neuronów**, każdy połączony z neuronami poprzedniej warstwy (*Dense* = warstwa w pełni połączona). Wyniki przechodzą przez ReLU.

**Druga `Dense(64, ...)`** — druga warstwa ukryta. Polecenie wymagało **co najmniej dwóch warstw ukrytych po co najmniej 32 neurony** — nasze dwie po 64 spełniają warunek.

**`Dense(1, activation="sigmoid")`** — na końcu mamy **jeden neuron**, bo rozwiązujemy klasyfikację binarną.

**`tf.keras.utils.set_random_seed(11)`** — ustawia ziarno losowości dla używanego środowiska trenowania, aby wyniki były łatwiejsze do powtórzenia. Nie zmienia już wcześniej wygenerowanego zbioru danych.

**`compile(...)`** — przygotowuje sposób trenowania:

| Argument | Co oznacza? |
|---|---|
| `optimizer="adam"` | Algorytm, który aktualizuje wagi na podstawie błędów |
| `loss="binary_crossentropy"` | Funkcja mówiąca, **jak duży błąd** popełnia model przy klasyfikacji 0/1 |
| `metrics=["accuracy"]` | Prosimy o dodatkowe podawanie odsetka poprawnych odpowiedzi |

**`summary()`** — wyświetla informacje o warstwach i liczbie parametrów modelu.

### Ile parametrów ma nasza sieć?

Sieć ma **4417 parametrów uczonych** (wag i biasów):

| Warstwa | Obliczenie | Parametry |
|---|---|---:|
| Pierwsza Dense 64 | `(2 wejścia × 64) + 64 biasy` | 192 |
| Druga Dense 64 | `(64 × 64) + 64 biasy` | 4160 |
| Wyjściowa Dense 1 | `(64 × 1) + 1 bias` | 65 |
| **Suma** | | **4417** |

To właśnie te wartości sieć dostosowuje podczas trenowania. Nie programujemy ręcznie reguły „jak rozpoznawać półksiężyce”.

### Adam i learning rate

**Adam** to optymalizator — na podstawie informacji o błędzie zmienia parametry sieci w kierunku lepszego dopasowania. Domyślny `learning_rate` użytego Adama to **0.001**.

**Learning rate (współczynnik uczenia)** oznacza ogólnie, jak duże kroki wykonywane są przy aktualizacji wag. Zbyt duży może utrudniać stabilną naukę, zbyt mały może spowalniać uczenie.

---

## 12. Trenowanie, epoki, batch i loss

Samo zbudowanie modelu nie wystarczy. Teraz trzeba go **nauczyć**.

```python
historia_mlp = model_mlp.fit(
    dane_treningowe,
    klasy_treningowe,
    epochs=60,
    batch_size=32,
    validation_data=(dane_walidacyjne, klasy_walidacyjne),
    verbose=0
)
```

### Co robi `fit`?

`fit()` wykonuje trening. W uproszczeniu:

1. Sieć dostaje porcję punktów oraz ich prawdziwe klasy.
2. Oblicza własne przewidywania.
3. Funkcja straty (`loss`) ocenia, jak bardzo się pomyliła.
4. Algorytm uczenia oblicza, jak zmienić wagi (wsteczna propagacja błędu + optymalizator).
5. Wagi są poprawiane.
6. Proces się powtarza.

### Epoka a batch

- **Epoka (`epoch`)** to jedno przejście przez **cały zbiór treningowy**.
- **Batch** to mniejsza porcja danych, na której jednorazowo wykonujemy aktualizację wag.

Mamy **840 próbek treningowych** i `batch_size=32`.

- 26 pełnych batchy po 32 próbki daje 832;
- zostaje jeszcze 8 próbek w ostatnim batchu;
- razem to **27 batchy na epokę**.

Wykonujemy **60 epok**, więc sieć wiele razy widzi te same dane, stopniowo aktualizując wagi. Nie oznacza to 60 oddzielnych modeli — to **60 rund uczenia jednego modelu**.

### `validation_data` — bardzo ważne

```python
validation_data=(dane_walidacyjne, klasy_walidacyjne)
```

Keras po każdej epoce sprawdza, jak model radzi sobie na tych danych, **ale nie aktualizuje na ich podstawie wag**.

Nie myl tego z tym, że **my później używamy wyników walidacji do wyboru wariantu**. Walidacja wpływa na decyzję człowieka/eksperymentu, ale w tym kodzie nie jest materiałem do gradientowego treningu.

### Co znaczy `verbose=0`?

Wyłącza wypisywanie postępu treningu po każdej epoce. **Nie wyłącza treningu ani zapisywania historii**.

### Loss, accuracy i F1 to nie to samo

**Loss (strata)** jest liczbą, którą minimalizuje optymalizator. Tu używamy `binary_crossentropy`, czyli **binarnej entropii krzyżowej**.

Przykład intuicyjny: prawdziwa klasa to 1.

- model mówi `0.99` — dobra, pewna odpowiedź, mała strata;
- model mówi `0.55` — poprawna klasa przy progu 0.5, ale mała pewność, większa strata;
- model mówi `0.01` — bardzo pewna **błędna** odpowiedź, ogromna kara.

**Accuracy** liczy tylko, jaki procent przewidywanych **klas** był poprawny:

```text
accuracy = liczba_poprawnych_odpowiedzi / liczba_wszystkich_odpowiedzi
```

Np. `169 / 180 ≈ 0.9389 = 93.89%`.

**F1** łączy dwa inne pojęcia:

- **Precision** (precyzja) — z punktów uznanych za klasę 1, ile naprawdę było klasą 1?
- **Recall** (czułość) — z rzeczywistych punktów klasy 1, ile model rozpoznał?

Wzory:

```text
precision = TP / (TP + FP)
recall    = TP / (TP + FN)
F1        = 2 * precision * recall / (precision + recall)
```

Gdzie:

- `TP` — prawdziwa klasa 1 przewidziana jako 1;
- `FP` — prawdziwa klasa 0 błędnie przewidziana jako 1;
- `FN` — prawdziwa klasa 1 błędnie przewidziana jako 0;
- `TN` — prawdziwa klasa 0 przewidziana jako 0.

Można też liczyć `F1 = 2TP / (2TP + FP + FN)`, gdy mianownik jest dodatni.

**Dlaczego dwa wskaźniki?** Accuracy potrafi wyglądać dobrze, nawet gdy model ignoruje rzadką klasę. F1 dodatkowo ocenia, czy sensownie rozpoznajemy klasę 1. U nas klasy są zbalansowane, ale polecenie wymaga obu metryk.

### Co zapisał `historia_mlp`?

```python
historia_mlp.history["loss"]
historia_mlp.history["val_loss"]
historia_mlp.history["accuracy"]
historia_mlp.history["val_accuracy"]
```

To listy wyników dla kolejnych epok:

- `loss` — strata na treningu;
- `val_loss` — strata na walidacji;
- `accuracy` — accuracy na treningu;
- `val_accuracy` — accuracy na walidacji.

Każda lista ma **60 wartości**, bo trenowaliśmy 60 epok.

```python
historia_mlp.history["loss"][-1]
```

`[-1]` w Pythonie oznacza **ostatni element listy**. Otrzymujemy więc stratę z **ostatniej epoki**, a nie średnią ze wszystkich epok.

### Wyniki pierwszego MLP

| Metryka po 60. epoce | Trening | Walidacja |
|---|---:|---:|
| Strata BCE | **0,1711** | **0,1117** |
| Accuracy | **92,26%** | **95,56%** |

Na zapisanym uruchomieniu model lepiej wypadał pod względem accuracy na walidacji niż na treningu. **To samo w sobie nie jest błędem ani dowodem na oszustwo.** Zbiory mają różną trudność, a wartości treningowe zbiera się w trakcie uczenia, kiedy wagi się zmieniają; walidacja jest oceniana po epoce z jej końcowymi wagami.

### Wykres historii strat

```python
plt.figure(figsize=(10, 5))

plt.plot(historia_mlp.history["loss"], label="Strata treningowa")
plt.plot(historia_mlp.history["val_loss"], label="Strata walidacyjna")

plt.title("Strata podczas uczenia sieci MLP")
plt.xlabel("Epoka")
plt.ylabel("Strata (loss)")
plt.legend()
plt.grid()
plt.show()
```

Wykres pokazuje **dwie linie**. Chcemy zobaczyć nie tylko końcowy wynik, ale **jak zmieniało się uczenie w czasie**.

Ważny szczegół: `plt.plot(lista)` domyślnie podpisuje oś X indeksami **0–59**, które odpowiadają epokom **1–60**. W późniejszym wykresie dropout ustawiliśmy `range(1, 61)`, żeby na osi wyświetlać numery epok wprost.

---

## 13. Przeuczenie kontra niedouczenie

To **najważniejsza część teoretyczna projektu**, bo prowadzący wymagał **diagnostyki procesu uczenia**, a nie wyłącznie dobrego accuracy.

### Niedouczenie (underfitting)

Model jest **zbyt prosty** albo jeszcze **nie nauczył się wystarczająco**, aby uchwycić rzeczywiste zależności.

Objawy mogą być takie:

- słaby wynik na treningu;
- słaby wynik na walidacji;
- granica decyzyjna zbyt prosta w stosunku do danych;
- obie straty stosunkowo wysokie.

**Nasz przykład:** regresja logistyczna i jej **prosta granica decyzyjna** w zadaniu z zakrzywionymi półksiężycami.

### Przeuczenie (overfitting)

Model zbyt mocno dopasował się do **konkretnych danych treningowych**, zamiast nauczyć się reguły dobrze działającej na nowych punktach.

Przykładowy scenariusz:

- strata treningowa spada bardzo nisko;
- strata walidacyjna po pewnym czasie przestaje spadać lub zaczyna rosnąć;
- accuracy treningowe jest wyraźnie wyższe niż walidacyjne;
- granica decyzyjna zaczyna robić dziwne zakręty wokół pojedynczych punktów, próbując dopasować szum.

**Pamiętaj:** tylko wysokie accuracy treningowe **nie wystarczy**, żeby powiedzieć „model się przeuczył”. Trzeba sprawdzić, **jak radzi sobie na danych spoza treningu**.

### Co zaobserwowaliśmy w naszym projekcie?

W pierwszym MLP bez dropout:

- strata treningowa malała;
- strata walidacyjna również malała;
- walidacja nie była wyraźnie gorsza od treningu;
- granica MLP była zakrzywiona i lepiej pasowała do półksiężyców.

**Wniosek: nie zaobserwowaliśmy wyraźnego przeuczenia.**

To **nie znaczy**, że przeuczenie nigdy by nie wystąpiło. Badaliśmy tylko jeden podział, tę architekturę i do 60 epok. Przy innym szumie, większej sieci, mniejszej ilości danych albo dłuższym uczeniu wynik mógłby wyglądać inaczej.

W poleceniu **dopuszczono taką sytuację**: jeśli przeuczenie nie jest widoczne, należy uczciwie opisać, **co sprawdzono** i **jakie są ograniczenia**. Nie trzeba dopisywać przeuczenia na siłę.

### Dlaczego walidacyjna strata może być mniejsza od treningowej?

Możliwe przyczyny:

1. **Walidacja może akurat zawierać łatwiejsze punkty** niż trening.
2. Keras rejestruje stratę treningową podczas aktualizowania modelu w trakcie epoki, a walidacyjną mierzy po epoce — **na końcowej wersji wag**.
3. W eksperymencie z dropout podczas treningu część aktywacji jest zerowana, a na walidacji dropout jest wyłączony. Dlatego strata treningowa może być wyższa.

Nie wolno z samego faktu `val_loss < loss` wyciągać wniosku „na pewno coś jest nie tak”. Trzeba patrzeć na **przebieg wykresów i metryki**.

### Granica decyzyjna MLP

```python
przewidywania_mlp = model_mlp.predict(punkty_siatki, verbose=0)
przewidywania_mlp = przewidywania_mlp.reshape(siatka_x.shape)

plt.contourf(
    siatka_x, siatka_y, przewidywania_mlp,
    levels=[0, 0.5, 1], alpha=0.3, cmap="coolwarm"
)
plt.contour(
    siatka_x, siatka_y, przewidywania_mlp,
    levels=[0.5], colors="black"
)
```

Tu `predict` zwraca **wartości sigmoid**, czyli wyniki od 0 do 1, a nie gotowe klasy. Dlatego:

- `levels=[0, 0.5, 1]` określa dwa zakresy tła: poniżej i powyżej progu 0.5;
- `plt.contour(... levels=[0.5])` rysuje **czarną linię** dokładnie na granicy decyzji.

Kropki walidacyjne są dodatkowo rysowane przez `plt.scatter`, jak przy poprzednich modelach.

---

## 14. Dropout — co naprawdę robi?

**Dropout** to metoda **regularyzacji** — technika, która może zmniejszać skłonność sieci do zbytniego dopasowania się do treningu.

### Intuicja

Wyobraź sobie grupę ludzi rozwiązujących zadanie. Jeśli zawsze robi je ta sama osoba, reszta może się na niej za bardzo polegać. Kiedy co jakiś czas niektóre osoby dostają przerwę, pozostali muszą nauczyć się działać bez nich.

W sieci dropout **losowo zeruje część aktywacji neuronów podczas treningu**, przez co model nie może w każdej iteracji polegać na dokładnie tych samych połączeniach informacji.

**Ale uwaga:** dropout **nie usuwa neuronów ani wag na stałe**. Na walidacji i podczas `predict` jest **wyłączony**.

### Co oznacza wartość dropout?

| Dropout | Co oznacza w trakcie treningu? |
|---|---|
| `0.0` | Nie wyłączamy żadnych aktywacji przez dropout |
| `0.2` | Losowo zerujemy około 20% aktywacji danej warstwy |
| `0.4` | Losowo zerujemy około 40% aktywacji danej warstwy |

Dropout standardowo skaluje aktywacje, które pozostały, tak żeby zachować ich oczekiwaną wielkość. Dla stopy `p` mnożnik podczas trenowania wynosi `1 / (1 - p)`.

Np. przy `p=0.2` pozostałe aktywacje są skalowane przez `1 / 0.8 = 1.25`.

### Gdzie dodaliśmy dropout?

```python
from tensorflow.keras.layers import Dropout

model = Sequential([
    tf.keras.Input(shape=(2,)),
    Dense(64, activation="relu"),
    Dropout(dropout),
    Dense(64, activation="relu"),
    Dropout(dropout),
    Dense(1, activation="sigmoid")
])
```

Za **każdą warstwą ukrytą** `Dense(64, ...)`. W poleceniu właśnie tego wymagano.

### Czy większy dropout zawsze jest lepszy?

**Nie.**

Jeżeli model już dobrze generalizuje, większy dropout może nie przynieść korzyści. Przy zbyt silnej regularyzacji model ma utrudnione uczenie i może gorzej dopasowywać nawet dane treningowe.

Ale nie wolno powiedzieć automatycznie „dropout 0.4 oznacza niedouczenie” — taki wniosek wymaga obserwacji, że model faktycznie ma za małą zdolność dopasowania (np. słabe wyniki także na treningu).

---

## 15. Dziewięć kontrolowanych treningów

### Po co aż 9 razy trenować?

Wynik pojedynczego treningu zależy m.in. od początkowych wag i losowych operacji podczas uczenia. Gdybyśmy przetestowali tylko jedną sieć, moglibyśmy przypadkiem wylosować bardzo dobry albo słabszy start.

Dlatego porównujemy **3 wartości dropout × 3 ziarna = 9 treningów**.

| | Ziarno 11 | Ziarno 22 | Ziarno 33 |
|---|---|---|---|
| Dropout 0.0 | Trening 1 | Trening 2 | Trening 3 |
| Dropout 0.2 | Trening 4 | Trening 5 | Trening 6 |
| Dropout 0.4 | Trening 7 | Trening 8 | Trening 9 |

**W całym notebooku treningów MLP jest faktycznie 10:** pierwszy trening diagnostyczny MLP bez dropout i później **9 treningów w kontrolowanym eksperymencie**. To nie błąd — „9 treningów” odnosi się do eksperymentu dropout.

### Co pozostawiliśmy takie samo?

- dokładnie te same punkty i ten sam podział na zbiory;
- wejście z 2 cechami;
- dwie warstwy ukryte po 64 neurony z ReLU;
- wyjście sigmoid;
- `adam`, `binary_crossentropy`, współczynnik uczenia 0.001;
- `epochs=60`, `batch_size=32`;
- ten sam sposób mierzenia accuracy i F1 na **walidacji**.

**Zmieniają się:** dropout (`0.0`, `0.2`, `0.4`) i kontrolowane ziarno treningu (`11`, `22`, `33`). Dzięki temu porównanie jest **kontrolowane**: badamy wpływ konkretnego czynnika, a nie piętnastu rzeczy naraz.

### Funkcja tworząca model

```python
def stworz_model(dropout, ziarno):
    tf.keras.utils.set_random_seed(ziarno)

    model = Sequential([
        tf.keras.Input(shape=(2,)),
        Dense(64, activation="relu"),
        Dropout(dropout),
        Dense(64, activation="relu"),
        Dropout(dropout),
        Dense(1, activation="sigmoid")
    ])

    model.compile(
        optimizer="adam",
        loss="binary_crossentropy",
        metrics=["accuracy"]
    )

    return model
```

**Po co funkcja?** Zamiast kopiować ten sam kod budowania sieci 9 razy, tworzymy funkcję, która przyjmuje **dwa argumenty** i za każdym razem zwraca **nowy, nieuczony jeszcze model**.

**`return model`** oznacza: „oddaj gotowy obiekt modelu do miejsca, w którym wywołano funkcję”.

**Dlaczego ziarno jest ustawiane wewnątrz funkcji?** Żeby każdy trening zaczynał się od kontrolowanej losowości, niezależnie od wcześniejszych trenowań.

### Pętla eksperymentu — najważniejszy fragment

```python
dropouty = [0.0, 0.2, 0.4]
ziarna = [11, 22, 33]

wyniki_dropout = []
historie_dropout = {}
modele_dropout = {}

for dropout in dropouty:
    for ziarno in ziarna:
        model = stworz_model(dropout, ziarno)

        historia = model.fit(
            dane_treningowe,
            klasy_treningowe,
            epochs=60,
            batch_size=32,
            validation_data=(dane_walidacyjne, klasy_walidacyjne),
            verbose=0
        )

        przewidywania = model.predict(dane_walidacyjne, verbose=0)
        przewidywania = (przewidywania >= 0.5).astype(int).ravel()

        accuracy = accuracy_score(klasy_walidacyjne, przewidywania)
        f1 = f1_score(klasy_walidacyjne, przewidywania)

        wyniki_dropout.append([dropout, ziarno, accuracy, f1])
        historie_dropout[(dropout, ziarno)] = historia.history
        modele_dropout[(dropout, ziarno)] = model
```

### Jak czytać podwójną pętlę?

```python
for dropout in dropouty:
    for ziarno in ziarna:
        # tutaj wykonujemy jeden trening danego wariantu
        pass
```

To znaczy:

1. Weź dropout `0.0` i przetestuj ziarna `11`, `22`, `33`.
2. Weź dropout `0.2` i przetestuj ziarna `11`, `22`, `33`.
3. Weź dropout `0.4` i przetestuj ziarna `11`, `22`, `33`.

Łącznie: **9 przejść przez wnętrze pętli**.

### Dlaczego trzy pojemniki na wyniki?

| Zmienna | Typ danych | Co trzyma? |
|---|---|---|
| `wyniki_dropout` | **Lista** `[]` | Wiersze: dropout, ziarno, accuracy, F1 |
| `historie_dropout` | **Słownik** `{}` | Wykresy: straty i metryki z epok |
| `modele_dropout` | **Słownik** `{}` | Faktycznie wytrenowane modele |

Przykład:

```python
historie_dropout[(0.2, 22)]
```

oznacza: pobierz historię treningu modelu z **dropout 0.2 i ziarnem 22**.

```python
modele_dropout[(0.0, 11)]
```

oznacza: pobierz **konkretną wytrenowaną sieć** bez dropout i z ziarnem 11.

**Para `(dropout, ziarno)` jest kluczem słownika.** Tak łatwo odszukać właściwy wariant.

### Dlaczego nie możemy porównywać tylko accuracy?

Bo mogłoby się okazać, że jeden model ma wysokie accuracy, ale popełnia dużo błędów przy klasie 1. Dlatego obok accuracy zapisujemy **F1**.

### Co robią pozostałe wykresy?

**Porównanie strat (3 panele):** dla każdego dropout rysujemy 3 krzywe treningowe (`loss`, linie ciągłe) i 3 walidacyjne (`val_loss`, linie przerywane). To łącznie 6 krzywych w jednym panelu.

Fragment, który pobiera odpowiednią historię:

```python
historia = historie_dropout[(dropout, ziarno)]
epoki = range(1, len(historia["loss"]) + 1)

plt.plot(epoki, historia["loss"], label=f"Trening {ziarno}")
plt.plot(epoki, historia["val_loss"], label=f"Walidacja {ziarno}", linestyle="--")
```

**Porównanie granic decyzyjnych (3 panele):** bierzemy modele z **tym samym ziarnem 11** i różnymi dropout:

```python
model = modele_dropout[(dropout, 11)]
```

Następnie przewidujemy wartości na tej samej siatce `punkty_siatki`, kolorujemy tło i rysujemy czarną granicę na poziomie `0.5`.

Dlaczego wszędzie ziarno 11? Chcemy **na rysunku** porównać różne dropout przy **jednym stałym ziarnie**. Pozostałe ziarna nie znikają — ich wyniki są w tabelach i krzywych strat.

> **Drobny szczegół techniczny:** TensorFlow może wypisać podczas pętli ostrzeżenie o `tf.function retracing`. W naszym notebooku ostrzeżenie pojawiło się podczas wielokrotnego tworzenia i używania modeli, ale wszystkie 9 treningów zakończyło się i wyniki zostały zapisane. To ostrzeżenie o możliwych kosztach wydajności, a nie automatycznie dowód błędnych pomiarów.

---

## 16. Wyniki eksperymentu i odchylenie standardowe

### Wszystkie 9 wyników walidacyjnych

| Dropout | Ziarno | Accuracy | F1 |
|---:|---:|---:|---:|
| **0.0** | 11 | **95,56%** | **95,40%** |
| 0.0 | 22 | 94,44% | 94,25% |
| 0.0 | 33 | 95,00% | 94,92% |
| **0.2** | 11 | 94,44% | 94,32% |
| 0.2 | 22 | 95,00% | 94,86% |
| 0.2 | 33 | 95,00% | 94,97% |
| **0.4** | 11 | 94,44% | 94,32% |
| 0.4 | 22 | 93,89% | 93,79% |
| 0.4 | 33 | 93,89% | 93,85% |

To wyniki **na walidacji**, nie na teście.

### Tabela w Pythonie

```python
import pandas as pd

tabela = pd.DataFrame(
    wyniki_dropout,
    columns=["Dropout", "Ziarno", "Accuracy", "F1"]
)

display(tabela.round(4))

podsumowanie = tabela.groupby("Dropout")[["Accuracy", "F1"]].agg(["mean", "std"])
display(podsumowanie.round(4))
```

Co robią kolejne elementy?

- `pd.DataFrame(...)` — zamienia listę wyników na **tabelę**.
- `columns=[...]` — nadaje nazwy kolumnom.
- `.round(4)` — pokazuje liczby zaokrąglone do 4 miejsc po przecinku (nie zmienia tego, jak modele były uczone).
- `.groupby("Dropout")` — grupuje wiersze po stopie dropout.
- `[ ["Accuracy", "F1"] ]` — wybiera obie kolumny metryk.
- `.agg(["mean", "std"])` — liczy dla każdej grupy **średnią** i **odchylenie standardowe**.

### Co oznaczają średnia i odchylenie?

**Średnia (`mean`)** odpowiada na pytanie: jaki jest **przeciętny wynik z trzech ziaren**?

Jeśli mamy wyniki accuracy `0.95`, `0.94`, `0.96`, to:

```text
średnia = (0.95 + 0.94 + 0.96) / 3 = 0.95 = 95%
```

**Odchylenie standardowe (`std`)** opisuje, **jak mocno poszczególne wyniki różnią się od średniej**.

- Małe `std` — wyniki podobne, mniejsza zmienność między ziarnami.
- Duże `std` — uruchomienia dają bardziej różne wyniki.

`pandas` domyślnie liczy tutaj **próbkowe odchylenie standardowe** (dzielone przez `n-1`). Wystarczą trzy uruchomienia, żeby zobaczyć pewną zmienność, ale to mała próba — nie daje mocnych podstaw do daleko idących wniosków statystycznych.

### Podsumowanie wyników

| Dropout | Średnie accuracy | Odchylenie accuracy | Średnie F1 | Odchylenie F1 |
|---:|---:|---:|---:|---:|
| **0.0** | **95,00%** | **0,56 p.p.** | **94,86%** | ok. 0,58 p.p. |
| 0.2 | 94,81% | 0,32 p.p. | 94,72% | ok. 0,35 p.p. |
| 0.4 | 94,07% | 0,32 p.p. | 93,99% | ok. 0,29 p.p. |

`p.p.` oznacza **punkt procentowy**, a nie „procent zmiany”. Np. różnica między 95% i 94% wynosi **1 punkt procentowy**.

### Jak interpretować te liczby?

1. **Dropout 0.0 ma najlepszą średnią** zarówno accuracy, jak i F1.
2. **Dropout 0.2 jest bardzo blisko** — różnica średniego accuracy to tylko ok. **0,19 punktu procentowego**.
3. **Dropout 0.4 jest średnio najsłabszy** w tym eksperymencie.
4. Przewaga dropout 0.0 **nie powtarza się idealnie przy każdym ziarnie**. Przy ziarnie 22 wariant 0.2 jest lepszy, a przy ziarnie 33 ma takie samo accuracy i odrobinę lepsze F1.
5. Z trzech ziaren **nie da się udowodnić**, że dropout zawsze szkodzi albo że różnice są istotne statystycznie.

### Co działo się ze stratami przy większym dropout?

Na wykresach treningowych strata z większym dropout była na ogół **wyższa i bardziej zmienna**. To zrozumiałe: podczas treningu część aktywacji jest losowo zerowana, więc uczenie jest trudniejsze.

Jednocześnie na walidacji dropout jest wyłączony. Dlatego **sama większa różnica między `loss` i `val_loss` nie świadczy jeszcze ani o przeuczeniu, ani o niedouczeniu**.

### Czego NIE można twierdzić?

- ❌ „Dropout na pewno pogarsza wszystkie sieci”.
- ❌ „Udowodniłem, że dropout 0.4 powoduje niedouczenie”.
- ❌ „Dropout ograniczył przeuczenie” — nie stwierdziliśmy przecież wyraźnego przeuczenia w modelu wyjściowym.

**Co wolno powiedzieć:** „W tej architekturze, na tych danych, przy jednym podziale i trzech ziarnach, **najlepsze średnie wyniki miała sieć bez dropout**”.

---

## 17. Wybór modelu i test końcowy

To bardzo ważny etap, bo tu można łatwo popełnić błąd metodologiczny.

### Najpierw wybór na walidacji

Wybraliśmy dropout **0.0**, bo miał:

- najwyższe średnie accuracy: **95,00%**;
- najwyższe średnie F1: **94,86%**.

Jako konkretny wytrenowany model wybraliśmy wariant z **ziarnem 11**, bo w grupie dropout 0.0 osiągnął najlepsze walidacyjne F1 (**95,40%**).

To wybór wykonany **bez patrzenia na test**. Trzeba jednak pamiętać, że wybieranie najlepszego ziarna może sprawić, że wynik walidacyjny będzie trochę optymistyczny.

### Kod końcowego testu

```python
model_koncowy = modele_dropout[(0.0, 11)]

przewidywania_test = model_koncowy.predict(dane_testowe, verbose=0)
przewidywania_test = (przewidywania_test >= 0.5).astype(int).ravel()

accuracy_test = accuracy_score(klasy_testowe, przewidywania_test)
f1_test = f1_score(klasy_testowe, przewidywania_test)

print("Accuracy:", round(accuracy_test, 4))
print("F1:", round(f1_test, 4))
```

### Co jest tutaj najważniejsze?

- `modele_dropout[(0.0, 11)]` — bierzemy **już wytrenowany i wybrany** model.
- `dane_testowe` — pierwszy raz sprawdzamy jakość na **zbiorze testowym**.
- `>= 0.5` — zamieniamy wyniki sigmoid na klasy 0/1.
- `accuracy_score` i `f1_score` — obliczamy końcowe metryki.

Nie zaczynamy kolejnych treningów dlatego, że wynik testowy nie jest idealny. To zniszczyłoby niezależność oceny.

### Wynik końcowy

| Metryka | Walidacja wybranego modelu | Test |
|---|---:|---:|
| Accuracy | **95,56%** | **93,89%** |
| F1 | **95,40%** | **93,79%** |

Na teście model poprawnie sklasyfikował **169 z 180** punktów (`169/180 ≈ 93,89%`). Oznacza to **11 błędnych klasyfikacji**.

**Czy spadek jest zły?** Nie musi być. Walidacja i test zawierają inne próbki, a wariant wybieraliśmy właśnie na walidacji, więc nieznacznie niższy wynik testowy jest możliwy. W tych danych różnica accuracy to około **1,67 punktu procentowego**.

**Najważniejszy wniosek:** model potrafi także na niezależnym teście osiągnąć wynik wyraźnie lepszy niż modele odniesienia ocenione na walidacji. Przy takim porównaniu pamiętaj jednak, że baseline'y miały metryki **walidacyjne**, a końcowe MLP ma dodatkowo metryki **testowe** — to różne zbiory.

### Dlaczego nie dążymy na siłę do 100%?

Mamy dane z szumem `0.25`. Niektóre punkty z obu klas mogą się nakładać lub wyglądać bardzo podobnie. **Perfekcyjny wynik nie był celem polecenia**. Celem było wyjaśnić zachowanie modeli i przeprowadzić uczciwy eksperyment.

---

## 18. Python i biblioteki — ściąga

Jeżeli kod wciąż wydaje się obcy, tu są najważniejsze konstrukcje, których użyliśmy.

### Listy i słowniki

```python
liczby = [11, 22, 33]            # lista
wyniki = {}                     # pusty słownik
wyniki[(0.2, 11)] = 0.9444      # klucz to para wartości

print(liczby[0])                # pierwszy element = 11
print(liczby[-1])               # ostatni element = 33
print(wyniki[(0.2, 11)])        # 0.9444
```

Lista przydaje się, gdy przechowujemy **kolejne elementy**. Słownik — gdy chcemy coś odnaleźć **po kluczu**.

### Pętla `for`

```python
for ziarno in [11, 22, 33]:
    print(ziarno)
```

Uruchamia wnętrze pętli trzy razy, za każdym z inną wartością.

### Funkcja `def`

```python
def dodaj(a, b):
    wynik = a + b
    return wynik

print(dodaj(2, 3))  # 5
```

Funkcja pozwala nie kopiować wielokrotnie kodu. W projekcie używaliśmy tego mechanizmu do tworzenia modeli.

### `enumerate`

```python
for numer, nazwa in enumerate(["Trening", "Walidacja", "Test"]):
    print(numer, nazwa)
```

Daje **numer elementu** i sam element. Numerowanie zaczyna się od 0.

### `len`, `range` i `shape`

| Zapis | Co zwraca? |
|---|---|
| `len(dane_treningowe)` | Liczbę punktów — `840` |
| `range(1, 61)` | Liczby 1–60 (61 się nie wlicza) |
| `dane.shape` | Wymiary tablicy, `(1200, 2)` |
| `klasy.shape` | Wymiary etykiet, `(1200,)` |
| `tablica.ravel()` | Spłaszczoną tablicę |
| `tablica.reshape(200, 200)` | Tablicę ułożoną w 200 wierszy i 200 kolumn |

### Co oznaczają te metody w całym projekcie?

| Zapis | Sens |
|---|---|
| `make_moons(...)` | Generuje sztuczne dane |
| `train_test_split(...)` | Dzieli dane na podzbiory |
| `model.fit(...)` | **Uczy** model |
| `model.predict(...)` | Oblicza **przewidywania** |
| `model.compile(...)` | Ustala sposób nauki sieci |
| `model.summary()` | Pokazuje budowę sieci |
| `history.history["loss"]` | Lista strat w kolejnych epokach |
| `accuracy_score(y_true, y_pred)` | Procent poprawnych klas |
| `f1_score(y_true, y_pred)` | F1 dla klasy 1 |
| `.astype(int)` | Zamienia wartości na liczby całkowite |
| `.round(4)` | Zaokrągla wyświetlane wartości |
| `display(...)` | Ładnie pokazuje tabelę w notebooku |

### Typowe pułapki

**1. `fit` a `predict`:** `fit` **uczy**, `predict` tylko **korzysta z wyuczonego modelu**.

**2. `loss` a `accuracy`:** `loss` to wartość błędu dla optymalizatora; accuracy to odsetek poprawnie wybranych klas.

**3. `epochs=60` a 9 treningów:** 60 to liczba epok **w jednym treningu**. Powtarzamy trening dla 9 konfiguracji dropout/ziarno.

**4. `random_state=42` a `set_random_seed(11)`:** 42 służy do generowania/podziału danych, a 11/22/33 do kontrolowania losowości treningu.

**5. `dropout=0.2` a „usunięcie 20% neuronów”:** dropout nie usuwa ich na stałe; zeruje losowo aktywacje **podczas trenowania**.

**6. `round` a zmiana wyniku:** `round(accuracy, 4)` tylko zaokrągla liczbę do wypisania; nie poprawia modelu.

**7. Wynik z walidacji a wynik z testu:** walidacją wybieramy model, a testem sprawdzamy go na końcu.

**8. Wielkie wykresy:** `figsize` zmienia rozmiar ilustracji, nie jakość uczenia modelu. Oznaczenia `xlabel`, `ylabel`, `legend`, `title` są ważne, bo bez nich trudno wyjaśnić wykres.

---

## 19. Jak opowiedzieć projekt prowadzącemu?

### Wersja krótka — około minuty

„Wygenerowałem 1200 punktów z `make_moons` z szumem 0.25 i ziarnem 42. Podzieliłem je stratyfikowanie na 70% treningu, 15% walidacji i 15% testu. Najpierw sprawdziłem model naiwny, który miał 50% accuracy, oraz regresję logistyczną, która miała 87,22% na walidacji, ale nie potrafiła dobrze odwzorować zakrzywionych półksiężyców.

Następnie zbudowałem MLP z dwiema warstwami po 64 neurony z ReLU i wyjściem sigmoid. Trenowałem ją przez 60 epok z Adamem i binary crossentropy. Obserwowałem stratę treningową i walidacyjną, ale nie zauważyłem wyraźnego przeuczenia.

Potem porównałem dropout 0.0, 0.2 i 0.4, każdy z ziarnami 11, 22 i 33, czyli 9 treningów przy tych samych ustawieniach. Najlepsze średnie wyniki walidacyjne dał dropout 0.0 — 95% accuracy i 94,86% F1. Wybrałem model z ziarnem 11 na podstawie walidacji, a na końcowym teście uzyskałem 93,89% accuracy i 93,79% F1. Wniosek: MLP pomogło lepiej rozdzielić dane, ale w tym eksperymencie dropout nie poprawił średniego wyniku”.

### Wersja szczególnie ważna: obrona wniosków

Jeśli prowadzący zapyta: **„Miałeś pokazać przeuczenie. Dlaczego go nie ma?”**

> „Sprawdziłem wykresy straty treningowej i walidacyjnej, wyniki obu zbiorów i granicę decyzji MLP bez dropout. Strata walidacyjna nie zaczęła wyraźnie rosnąć, więc nie mam podstaw, żeby stwierdzić przeuczenie. Zaznaczyłem w raporcie, że badanie ograniczało się do tej architektury, jednego podziału i 60 epok. Polecenie dopuszczało opisanie takiej sytuacji”.

Jeśli zapyta: **„Czy dropout pogarsza uczenie?”**

> „Tutaj wraz z większym dropout średnie wyniki były nieco gorsze, ale nie mogę uogólniać tego na wszystkie sieci. Dropout ma pomagać ograniczać przeuczenie, a u mnie ono nie było wyraźne. Dodatkowo wariant 0.2 bywał lepszy dla części ziaren, więc różnice nie są jednoznaczne”.

Jeśli zapyta: **„Dlaczego użyłeś walidacji, a potem testu?”**

> „Walidacja służyła mi do porównywania wariantów i wyboru modelu. Test zostawiłem do jednorazowej niezależnej oceny po podjęciu decyzji. Gdybym zaczął poprawiać model pod wynik testowy, nie byłby już niezależnym testem”.

### Jak sprawozdanie realizuje polecenie?

| Wymaganie | Gdzie to w notebooku? |
|---|---|
| 1200 punktów, `noise=0.25`, ziarno 42 | `make_moons` na początku |
| Podział 70/15/15, stratyfikacja | Dwa `train_test_split` |
| Wykres klas i zbiorów | Trzy wykresy punktowe |
| Naiwny model i regresja logistyczna | `DummyClassifier`, `LogisticRegression` |
| Accuracy, F1 i granice baseline'ów | Metryki i tło rysowane przez `contourf` |
| MLP: 2 × minimum 32 neuronów, ReLU, sigmoid | `Dense(64)`, `Dense(64)`, `Dense(1)` |
| Diagnostyka trenowania | Historia `loss`, `val_loss` i wykres granicy MLP |
| Dropout 0 / 0.2 / 0.4 × 3 ziarna | Funkcja `stworz_model` i podwójna pętla |
| Wyniki wszystkich prób, średnia i zmienność | Tabele `pandas` |
| Porównanie strat i granic | Dwa zestawy wykresów |
| Wybór wg walidacji, końcowy test | `model_koncowy` i `dane_testowe` |
| Raport | Ostatnia komórka Markdown |

---

## 20. Pytania kontrolne z odpowiedziami

Spróbuj **najpierw odpowiedzieć własnymi słowami**, a dopiero potem podejrzeć wyjaśnienie.

### Podstawy

**1. Jaki jest główny cel projektu?**

Sprawdzić, jak różne modele klasyfikują zaszumione półksiężyce, rozpoznać ograniczenia uczenia i zbadać wpływ dropout przy kontrolowanych warunkach.

**2. Co oznacza klasyfikacja binarna?**

Przewidywanie jednej z dwóch klas, u nas 0 lub 1.

**3. Co zawiera `dane`, a co `klasy`?**

`dane` to 1200 par współrzędnych `[x, y]`, a `klasy` to 1200 poprawnych etykiet 0/1.

**4. Dlaczego `dane.shape` to `(1200, 2)`?**

Bo mamy 1200 punktów i dwie cechy każdego punktu.

**5. Po co `noise=0.25`?**

Żeby punkty nie leżały na idealnych łukach. Szum utrudnia zadanie i może powodować nachodzenie klas.

**6. Po co `random_state=42`?**

Żeby móc wygenerować ten sam zbiór i odtworzyć ten sam podział danych.

### Podział i modele odniesienia

**7. Po co osobno trening, walidacja i test?**

Trening uczy wagi, walidacja pomaga wybrać model, test niezależnie ocenia wybrany model.

**8. Skąd 840 / 180 / 180 punktów?**

To 70% / 15% / 15% ze 1200 przykładów.

**9. Dlaczego dwukrotnie `train_test_split`?**

Pierwszy raz oddzielamy 70% treningu i 30% pozostałych, drugi raz dzielimy pozostałe na walidację i test po 15% całości.

**10. Co robi `stratify`?**

Utrzymuje podobne proporcje klas w powstałych zbiorach.

**11. Co to data leakage?**

Niewłaściwe użycie informacji z walidacji lub testu przy treningu, przygotowaniu danych albo doborze modelu. Wynik może wtedy wyglądać lepiej, niż model naprawdę generalizuje.

**12. Po co model naiwny?**

Żeby ustalić najprostszy punkt odniesienia. Nasz model naiwny osiągał 50% accuracy.

**13. Dlaczego model naiwny ma F1 = 0?**

Bo zawsze przewidywał 0 i nie wykrywał żadnych punktów klasy dodatniej 1.

**14. Dlaczego regresja logistyczna radzi sobie gorzej niż MLP?**

Jej granica w dwóch wymiarach jest liniowa, a półksiężyce wymagają zakrzywionego rozdzielenia.

### Sieć neuronowa

**15. Co oznacza MLP?**

Wielowarstwowa sieć neuronowa typu perceptron, złożona z kolejnych warstw przetwarzających dane.

**16. Jak zbudowana jest nasza sieć?**

2 cechy wejściowe → 64 neurony ReLU → 64 neurony ReLU → 1 neuron sigmoid.

**17. Po co ReLU?**

Wprowadza nieliniowość i pomaga tworzyć bardziej złożone granice decyzyjne.

**18. Po co sigmoid na końcu?**

Zwraca wynik z zakresu 0–1 dla klasy dodatniej, który możemy przekształcić w klasę progiem 0.5.

**19. Ile parametrów ma sieć?**

4417 — wagi i biasy, które model dopasowuje podczas uczenia.

**20. Co robi `compile`?**

Ustala optymalizator, funkcję straty i mierzone metryki.

**21. Co robi Adam?**

Aktualizuje wagi modelu na podstawie informacji o błędzie.

**22. Co to binary crossentropy?**

Funkcja straty do klasyfikacji binarnej; mocno karze pewne, ale błędne przewidywania.

**23. Co oznacza 60 epok?**

Model 60 razy przechodzi przez cały zbiór treningowy, aktualizując wagi w batchach.

**24. Co to batch size 32?**

Wagi są aktualizowane po porcjach liczących maksymalnie 32 próbki, a nie dopiero po wszystkich 840.

**25. Czy podczas walidacji w `fit` model uczy się na danych walidacyjnych?**

Nie. Keras tylko je ocenia po epoce; nie aktualizuje wag na podstawie walidacji w tym kodzie.

### Diagnostyka

**26. Co wskazuje na niedouczenie?**

Gorsze wyniki nawet na treningu i/lub granica zbyt prosta w stosunku do problemu. U nas pokazuje to ograniczenie modelu liniowego.

**27. Co wskazuje na przeuczenie?**

Coraz lepsze dopasowanie treningu przy pogorszeniu walidacji, np. spadek `loss` i wzrost `val_loss` po pewnej epoce.

**28. Czy w projekcie udało się pokazać przeuczenie?**

Nie zaobserwowaliśmy go wyraźnie. Obie straty malały; uczciwie opisaliśmy ograniczenia eksperymentu.

**29. Czy `val_loss` mniejsze od `loss` oznacza błąd?**

Nie. Mogą się różnić trudnością zbiory i moment pomiaru; przy dropout dodatkowo model inaczej działa podczas treningu i walidacji.

### Dropout i wyniki

**30. Co robi dropout 0.2?**

Podczas treningu losowo zeruje około 20% aktywacji w danej warstwie; podczas przewidywania jest wyłączony.

**31. Dlaczego użyliśmy ziaren 11, 22 i 33?**

Żeby zobaczyć, jak wyniki zmieniają się wskutek losowości treningu, i nie opierać wniosku tylko na jednym uruchomieniu.

**32. Dlaczego jest 9 treningów w eksperymencie?**

3 wartości dropout razy 3 ziarna.

**33. Co to znaczy eksperyment kontrolowany?**

Zmieniamy badany parametr dropout, a reszta istotnych warunków zostaje taka sama; powtarzamy próby na tych samych ziarnach.

**34. Po co odchylenie standardowe?**

Pokazuje, jak bardzo wyniki różnią się między trzema uruchomieniami.

**35. Który dropout był najlepszy?**

W naszym eksperymencie dropout 0.0, bo dał najwyższe średnie accuracy (95,00%) i F1 (94,86%) na walidacji.

**36. Czy dropout 0.4 na pewno powoduje niedouczenie?**

Nie. Uzyskał słabsze średnie wyniki, ale to za mało, żeby na pewno rozpoznać niedouczenie.

**37. Dlaczego wybrano ziarno 11?**

Wśród treningów z dropout 0.0 miało najlepsze walidacyjne F1. To również ograniczenie — wybór najlepszego ziarna może zawyżać ocenę na walidacji.

**38. Ile wyniósł końcowy test?**

Accuracy **93,89%**, F1 **93,79%** na 180 punktach testowych.

**39. Dlaczego nie poprawiamy modelu po obejrzeniu testu?**

Bo wtedy test staje się kolejną walidacją i przestaje być niezależnym sprawdzianem.

**40. Co jest najważniejszym wnioskiem z projektu?**

MLP lepiej oddało zakrzywiony podział klas niż regresja logistyczna. W tej serii prób dropout nie poprawił średnich wyników. Brak wyraźnego przeuczenia nie pozwala przypisać dropout korzyści z jego ograniczenia.

---

## 21. Najważniejsze pojęcia i źródła

### Mini-słownik do powtórki

| Pojęcie | Najkrótsze znaczenie |
|---|---|
| **MLP** | Wielowarstwowa sieć neuronowa |
| **Neuron** | Element wykonujący ważoną sumę i aktywację |
| **Wagi i biasy** | Liczby dopasowywane podczas treningu |
| **ReLU** | Aktywacja `max(0, x)` |
| **Sigmoid** | Aktywacja dająca wynik od 0 do 1 |
| **BCE / loss** | Miara błędu do minimalizacji |
| **Adam** | Optymalizator aktualizujący wagi |
| **Epoka** | Jedno pełne przejście przez trening |
| **Batch** | Porcja punktów używana do aktualizacji wag |
| **Accuracy** | Procent poprawnych klasyfikacji |
| **Precision** | Ile przewidzianych „jedynek” było prawdziwymi jedynkami |
| **Recall** | Ile prawdziwych „jedynek” zostało wykrytych |
| **F1** | Średnia harmoniczna precision i recall |
| **Underfitting** | Model nie umie dobrze dopasować zależności |
| **Overfitting** | Model dopasowuje trening lepiej niż nowe dane |
| **Dropout** | Losowe zerowanie aktywacji podczas treningu |
| **Ziarno** | Początek powtarzalnego losowania |
| **Granica decyzyjna** | Miejsce zmiany przewidywanej klasy |
| **Walidacja** | Zbiór do porównań i wyboru modelu |
| **Test** | Końcowa niezależna ocena |
| **Data leakage** | Przeciek informacji z danych, których model nie powinien używać |
| **Średnia (`mean`)** | Przeciętny wynik z powtórzeń |
| **Odchylenie (`std`)** | Rozrzut wyników między powtórzeniami |

### Ostateczna ściąga — same liczby

```text
Zadanie:       klasyfikacja dwóch zaszumionych półksiężyców
Dane:          1200 punktów, 2 cechy, klasy 0/1
Szum:          0.25
Ziarno danych: 42
Podział:       840 trening / 180 walidacja / 180 test

Model naiwny:  50.00% accuracy /  0.00% F1 (walidacja)
Logistyczny:   87.22% accuracy / 87.01% F1 (walidacja)

MLP:           2 wejścia → 64 ReLU → 64 ReLU → 1 sigmoid
Parametry:     4417
Optymalizator: Adam, learning rate 0.001
Strata:        binary_crossentropy
Trening:       60 epok, batch size 32

Dropout:       0.0 / 0.2 / 0.4
Ziarna:        11 / 22 / 33
Eksperyment:   3 × 3 = 9 treningów

Średnie accuracy walidacyjne:
  0.0 → 95.00%
  0.2 → 94.81%
  0.4 → 94.07%

Wybrany:       dropout 0.0, ziarno 11
Walidacja:     95.56% accuracy / 95.40% F1
Test:          93.89% accuracy / 93.79% F1

Wniosek:       MLP > model liniowy na walidacji.
               Dropout nie poprawił średniej jakości w tej próbie.
               Wyraźnego przeuczenia nie zaobserwowano.
```

### Materiały źródłowe

Notatka jest przygotowana na podstawie **Twojego ukończonego notebooka** `projekt1_michal(4).ipynb` i **oryginalnego polecenia** `projekt1_diagnostyka_uczenia.ipynb` / `.py`. Odnosi się do sposobu pracy poznanego na zajęciach (m.in. wprowadzenie do Keras i diagnostyka treningu).

Dokumentacja używanych narzędzi, jeśli zechcesz pogłębić temat:

- [Google Colab — FAQ](https://research.google.com/colaboratory/faq.html)
- [Scikit-learn — make_moons](https://scikit-learn.org/stable/modules/generated/sklearn.datasets.make_moons.html)
- [Scikit-learn — train_test_split](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.train_test_split.html)
- [Scikit-learn — accuracy_score](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.accuracy_score.html)
- [Scikit-learn — f1_score](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.f1_score.html)
- [Keras — warstwa Dense](https://keras.io/api/layers/core_layers/dense/)
- [Keras — warstwa Dropout](https://keras.io/api/layers/regularization_layers/dropout/)
- [Keras — optymalizator Adam](https://keras.io/api/optimizers/adam/)
- [Keras — ustawianie losowości](https://keras.io/api/utils/python_utils/)

> **Do zapamiętania przed obroną:** najważniejsze są **trzy różne zbiory danych**, **różnica między linią a zakrzywioną granicą**, **rozpoznawanie overfittingu na podstawie dwóch strat**, **po co 9 treningów**, **co robi dropout** i **dlaczego test jest tylko na koniec**. Jeśli potrafisz wyjaśnić te sześć rzeczy, rozumiesz sedno projektu. 😸
