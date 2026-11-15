-- Publikacje na homepage (snapshoty) + rozszerzone prośby (przedmiot, update).

CREATE TABLE IF NOT EXISTS catalog_subjects (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  full_name TEXT,
  description TEXT,
  sort_order INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT catalog_subjects_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT catalog_subjects_title_len CHECK (char_length(title) BETWEEN 1 AND 80)
);

CREATE TABLE IF NOT EXISTS publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_slug TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  body TEXT NOT NULL DEFAULT '',
  author_user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  author_username TEXT NOT NULL,
  source_note_id UUID REFERENCES user_notes (id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT publications_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT publications_title_len CHECK (char_length(title) BETWEEN 1 AND 200),
  UNIQUE (subject_slug, slug)
);

CREATE INDEX IF NOT EXISTS publications_subject_active_idx
  ON publications (subject_slug)
  WHERE is_active;

CREATE INDEX IF NOT EXISTS publications_source_note_idx
  ON publications (source_note_id)
  WHERE source_note_id IS NOT NULL;

ALTER TABLE publish_requests
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'publish',
  ADD COLUMN IF NOT EXISTS subject_slug TEXT,
  ADD COLUMN IF NOT EXISTS proposed_subject_title TEXT,
  ADD COLUMN IF NOT EXISTS proposed_subject_full_name TEXT,
  ADD COLUMN IF NOT EXISTS proposed_subject_description TEXT,
  ADD COLUMN IF NOT EXISTS snap_title TEXT,
  ADD COLUMN IF NOT EXISTS snap_description TEXT,
  ADD COLUMN IF NOT EXISTS snap_body TEXT,
  ADD COLUMN IF NOT EXISTS apply_title BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS apply_description BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS apply_body BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS apply_subject BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS publication_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'publish_requests_kind_check'
  ) THEN
    ALTER TABLE publish_requests
      ADD CONSTRAINT publish_requests_kind_check
      CHECK (kind IN ('publish', 'update'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'publish_requests_publication_id_fkey'
  ) THEN
    ALTER TABLE publish_requests
      ADD CONSTRAINT publish_requests_publication_id_fkey
      FOREIGN KEY (publication_id) REFERENCES publications (id) ON DELETE SET NULL;
  END IF;
END $$;

-- Jedna oczekująca prośba na notatkę (niezależnie od rodzaju).
DROP INDEX IF EXISTS publish_requests_one_pending_idx;
CREATE UNIQUE INDEX IF NOT EXISTS publish_requests_one_pending_idx
  ON publish_requests (note_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS publish_requests_kind_status_idx
  ON publish_requests (kind, status, created_at DESC);
