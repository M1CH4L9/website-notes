CREATE TABLE user_note_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  UNIQUE (user_id, id)
);
CREATE UNIQUE INDEX user_note_folders_name_idx ON user_note_folders (user_id, lower(name));

ALTER TABLE user_notes ADD COLUMN folder_id UUID;
ALTER TABLE user_notes ADD CONSTRAINT user_notes_owned_folder
  FOREIGN KEY (user_id, folder_id) REFERENCES user_note_folders(user_id, id)
  ON DELETE SET NULL (folder_id);
CREATE INDEX user_notes_folder_idx ON user_notes (user_id, folder_id);
