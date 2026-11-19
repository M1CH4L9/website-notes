-- Adres na koncie jest zawsze potwierdzony. Dotychczasowe konta mają NULL.
ALTER TABLE users ADD COLUMN email TEXT;
CREATE UNIQUE INDEX users_email_unique ON users (email) WHERE email IS NOT NULL;

CREATE TABLE account_email_links (
  purpose TEXT NOT NULL CHECK (purpose IN ('register', 'reset', 'profile')),
  email TEXT NOT NULL,
  token_hash TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE NULLS NOT DISTINCT (purpose, email, user_id),
  CHECK ((purpose = 'register') = (user_id IS NULL))
);
CREATE INDEX account_email_links_user_idx ON account_email_links (user_id);
CREATE INDEX account_email_links_expiry_idx ON account_email_links (expires_at);
