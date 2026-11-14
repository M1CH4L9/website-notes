---
title: Kod i terminal
description: Przykładowa notatka z blokami kodu w kilku językach, długimi liniami i przyciskiem kopiowania.
updated: 2026-11-12
---

Notatka przykładowa. Każdy blok kodu ma nagłówek z nazwą języka albo pliku i przycisk kopiowania.

## Python

Hasła przechowuje się jako wynik funkcji wyprowadzania klucza, nigdy jawnie. Funkcja `hashlib.scrypt` jest w bibliotece standardowej:

```python title="hasla.py"
import hashlib
import hmac
import secrets

SCRYPT = {"n": 2**15, "r": 8, "p": 1, "dklen": 32}


def hash_password(password: str) -> tuple[bytes, bytes]:
    """Zwraca (sól, skrót). Sól jest losowa dla każdego hasła."""
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode("utf-8"), salt=salt, **SCRYPT)
    return salt, digest


def verify_password(password: str, salt: bytes, expected: bytes) -> bool:
    digest = hashlib.scrypt(password.encode("utf-8"), salt=salt, **SCRYPT)
    # Porównanie w stałym czasie, żeby nie zdradzać, ile bajtów się zgadza.
    return hmac.compare_digest(digest, expected)


if __name__ == "__main__":
    salt, digest = hash_password("poprawny koń bateria zszywka")
    print(f"sól={salt.hex()} skrót={digest.hex()} zgodne={verify_password('poprawny koń bateria zszywka', salt, digest)}")
```

## Terminal

Długie polecenia przewijają się w poziomie, strona zostaje na miejscu:

```bash
# Klucz prywatny i certyfikat z własnym podpisem, ważny rok
openssl req -x509 -newkey rsa:4096 -sha256 -days 365 -nodes -keyout klucz.pem -out certyfikat.pem -subj "/C=PL/ST=Mazowieckie/L=Warszawa/O=Laboratorium BSI/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

# Skan najczęściej używanych portów w sieci laboratoryjnej
nmap -sV --top-ports 100 -oN skan.txt 192.168.56.0/24
```

Wynik polecenia bez podświetlania składni:

```text
PORT     STATE SERVICE  VERSION
22/tcp   open  ssh      OpenSSH 9.6p1 Ubuntu 3ubuntu13 (Ubuntu Linux; protocol 2.0)
80/tcp   open  http     nginx 1.24.0 (Ubuntu)
443/tcp  open  ssl/http nginx 1.24.0 (Ubuntu)
3306/tcp open  mysql    MySQL 8.0.36-0ubuntu0.24.04.1
```

## C

Klasyczne przepełnienie bufora na stosie:

```c title="overflow.c"
#include <stdio.h>
#include <string.h>

static int check(const char *input) {
    char buffer[16];
    int authorized = 0;

    strcpy(buffer, input); /* brak kontroli długości */

    if (strcmp(buffer, "tajne") == 0) {
        authorized = 1;
    }
    return authorized;
}

int main(int argc, char **argv) {
    if (argc < 2) {
        fprintf(stderr, "użycie: %s <hasło>\n", argv[0]);
        return 2;
    }
    puts(check(argv[1]) ? "dostęp przyznany" : "odmowa");
    return 0;
}
```

## SQL

```sql
-- Podatne: dane użytkownika sklejane z zapytaniem
SELECT id, login FROM users WHERE login = 'admin' --' AND password = '';

-- Poprawnie: zapytanie parametryzowane
PREPARE find_user (text, text) AS
  SELECT id, login
  FROM users
  WHERE login = $1 AND password_hash = crypt($2, password_hash);
```

## JavaScript i TypeScript

```ts
type Role = 'student' | 'prowadzący' | 'admin';

interface Session {
  userId: number;
  role: Role;
  expiresAt: Date;
}

export function canEdit(session: Session | null, ownerId: number): boolean {
  if (!session || session.expiresAt.getTime() < Date.now()) return false;
  return session.role === 'admin' || session.userId === ownerId;
}
```

## Zmiany w plikach

```diff
 server {
-    listen 80;
+    listen 443 ssl;
+    ssl_protocols TLSv1.2 TLSv1.3;
     server_name notatki.example;
 }
```

## Konfiguracja

```json
{
  "minLength": 12,
  "requireMfa": true,
  "lockout": { "attempts": 5, "windowMinutes": 15 },
  "allowedOrigins": ["https://notatki.example"]
}
```

```yaml
services:
  web:
    image: nginx:1.27-alpine
    ports:
      - "443:443"
    read_only: true
    cap_drop: [ALL]
```

## Kod w tekście i w listach

Polecenie `chmod 600 ~/.ssh/id_ed25519` ogranicza dostęp do klucza prywatnego. Blok kodu może też stać w liście:

1. Wygeneruj klucz:

   ```bash
   ssh-keygen -t ed25519 -C "michal@laptop"
   ```

2. Skopiuj klucz publiczny na serwer poleceniem `ssh-copy-id`.

> [!WARNING]
> Przykłady ataków uruchamiaj tylko na własnych maszynach wirtualnych.
