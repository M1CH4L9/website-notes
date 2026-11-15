-- Preferencje wyglądu na koncie (sync z localStorage).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pref_theme TEXT;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pref_cute BOOLEAN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_pref_theme_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_pref_theme_check
      CHECK (pref_theme IS NULL OR pref_theme IN ('dark', 'light'));
  END IF;
END $$;
