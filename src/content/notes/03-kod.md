---
title: "Pierwsze kroki z kodem"
description: "Czytelne przykłady, podświetlanie składni i kod zawsze pod ręką."
subject: "BSI"
category: "Programowanie"
tags: ["TypeScript", "kod"]
order: 3
icon: "code"
demo: true
---

## Kod, który ma swoje miejsce
Przykłady mają oznaczenie języka i przycisk kopiowania. Ten fragment to tylko prosty demonstrator formatowania.

```typescript
interface Note {
  title: string;
  subject: string;
  tags: string[];
}

const note: Note = {
  title: "Małe kroki, wielkie odkrycia",
  subject: "BSI",
  tags: ["nauka", "przykład"],
};

function describeNote(note: Note): string {
  return `${note.subject}: ${note.title}`;
}

console.log(describeNote(note));
```

## Drugi język
Podświetlanie może dopasować się także do Pythona:

```python
notes = ["Podstawy", "Kod", "Powtórka"]

for index, title in enumerate(notes, start=1):
    print(f"{index}. {title}")
```

### Długie linie
Poniższa linia celowo jest długa. Nie powinna rozciągać strony — przewija się tylko blok kodu.

```typescript
const example = "To jest celowo długa linia demonstracyjna, która sprawdza wygodne przewijanie kodu na telefonie bez przesuwania całej strony w poziomie.";
```

## Co dalej?
Właściwe fragmenty kodu dodamy razem z notatkami. Do krótkich nazw użyjemy zapisu `inline`, a do większych przykładów osobnych bloków.
