-- Linki współdzielone do prywatnych notatek + obecność przy edycji.

ALTER TABLE user_notes
  ADD COLUMN IF NOT EXISTS revision INT NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS note_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES user_notes (id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('read', 'edit')),
  label TEXT,
  created_by UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  CONSTRAINT note_shares_token_format CHECK (char_length(token) BETWEEN 20 AND 64)
);

CREATE UNIQUE INDEX IF NOT EXISTS note_shares_token_idx ON note_shares (token);
CREATE INDEX IF NOT EXISTS note_shares_note_active_idx
  ON note_shares (note_id)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS note_presence (
  note_id UUID NOT NULL REFERENCES user_notes (id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  can_edit BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (note_id, client_id),
  CONSTRAINT note_presence_client_len CHECK (char_length(client_id) BETWEEN 8 AND 80),
  CONSTRAINT note_presence_name_len CHECK (char_length(display_name) BETWEEN 1 AND 64)
);

CREATE INDEX IF NOT EXISTS note_presence_seen_idx ON note_presence (note_id, last_seen DESC);
