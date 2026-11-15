import { query } from './db';
import { createCatalogSubject } from './catalog';
import {
  createPublication,
  getPublicationById,
  getPublicationForSourceNote,
  updatePublication,
  type Publication,
} from './publication-notes';
import type { UserNote } from './user-notes';
import { assertSlug, slugifyTitle } from './slugs';
import { listSubjectOptions } from './subject-options';

export type PublishRequestKind = 'publish' | 'update';
export type PublishRequestStatus = 'pending' | 'accepted' | 'rejected';

export type PublishRequest = {
  id: string;
  note_id: string;
  user_id: string;
  status: PublishRequestStatus;
  kind: PublishRequestKind;
  message: string | null;
  admin_note: string | null;
  subject_slug: string | null;
  proposed_subject_title: string | null;
  proposed_subject_full_name: string | null;
  proposed_subject_description: string | null;
  snap_title: string | null;
  snap_description: string | null;
  snap_body: string | null;
  apply_title: boolean;
  apply_description: boolean;
  apply_body: boolean;
  apply_subject: boolean;
  publication_id: string | null;
  created_at: Date;
  resolved_at: Date | null;
};

export type PublishRequestView = PublishRequest & {
  username: string;
  note_title: string;
  note_slug: string;
  note_body: string;
  note_description: string | null;
  note_is_public: boolean;
};

async function subjectExists(slug: string): Promise<boolean> {
  const options = await listSubjectOptions();
  return options.some((s) => s.slug === slug);
}

async function assertPendingNone(noteId: string): Promise<void> {
  const { rows } = await query<PublishRequest>(
    `SELECT * FROM publish_requests WHERE note_id = $1 AND status = 'pending' LIMIT 1`,
    [noteId],
  );
  if (rows[0]) throw new Error('Prośba dla tej notatki już czeka.');
}

function snapFromNote(note: UserNote) {
  return {
    snap_title: note.title,
    snap_description: note.description,
    snap_body: note.body,
  };
}

export async function requestPublish(input: {
  userId: string;
  note: UserNote;
  message?: string;
  subjectSlug?: string;
  proposedSubjectTitle?: string;
  proposedSubjectFullName?: string;
  proposedSubjectDescription?: string;
}): Promise<PublishRequest> {
  if (input.note.user_id !== input.userId) throw new Error('To nie jest Twoja notatka.');

  const existingPub = await getPublicationForSourceNote(input.note.id);
  if (existingPub) {
    throw new Error('Notatka ma już publikację. Użyj „Zaktualizuj publikację”.');
  }

  await assertPendingNone(input.note.id);

  const message = input.message?.trim() || null;
  if (message && message.length > 500) throw new Error('Wiadomość jest za długa.');

  const subjectSlug = input.subjectSlug?.trim() || null;
  const proposedTitle = input.proposedSubjectTitle?.trim() || null;
  const proposedFull = input.proposedSubjectFullName?.trim() || null;
  const proposedDesc = input.proposedSubjectDescription?.trim() || null;

  if (subjectSlug && proposedTitle) {
    throw new Error('Wybierz istniejący przedmiot albo zgłoś nowy, nie oba naraz.');
  }
  if (!subjectSlug && !proposedTitle) {
    throw new Error('Wybierz przedmiot albo podaj nazwę nowego.');
  }
  if (subjectSlug) {
    const err = assertSlug(subjectSlug);
    if (err) throw new Error(err);
    if (!(await subjectExists(subjectSlug))) throw new Error('Nie ma takiego przedmiotu.');
  }
  if (proposedTitle) {
    if (proposedTitle.length > 80) throw new Error('Nazwa przedmiotu jest za długa.');
    if (proposedFull && proposedFull.length > 200) throw new Error('Pełna nazwa jest za długa.');
    if (proposedDesc && proposedDesc.length > 500) throw new Error('Opis przedmiotu jest za długi.');
  }

  const snap = snapFromNote(input.note);
  const { rows } = await query<PublishRequest>(
    `INSERT INTO publish_requests (
       note_id, user_id, kind, message, subject_slug,
       proposed_subject_title, proposed_subject_full_name, proposed_subject_description,
       snap_title, snap_description, snap_body
     ) VALUES ($1,$2,'publish',$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      input.note.id,
      input.userId,
      message,
      subjectSlug,
      proposedTitle,
      proposedFull,
      proposedDesc,
      snap.snap_title,
      snap.snap_description,
      snap.snap_body,
    ],
  );
  return rows[0];
}

export async function requestUpdatePublication(input: {
  userId: string;
  note: UserNote;
  message?: string;
  subjectSlug?: string;
  proposedSubjectTitle?: string;
  proposedSubjectFullName?: string;
  proposedSubjectDescription?: string;
  applyTitle?: boolean;
  applyDescription?: boolean;
  applyBody?: boolean;
  applySubject?: boolean;
}): Promise<PublishRequest> {
  if (input.note.user_id !== input.userId) throw new Error('To nie jest Twoja notatka.');

  const publication = await getPublicationForSourceNote(input.note.id);
  if (!publication) {
    throw new Error('Brak aktywnej publikacji dla tej notatki.');
  }

  await assertPendingNone(input.note.id);

  const applyTitle = input.applyTitle !== false;
  const applyDescription = input.applyDescription !== false;
  const applyBody = input.applyBody !== false;
  const applySubject = Boolean(input.applySubject);

  if (!applyTitle && !applyDescription && !applyBody && !applySubject) {
    throw new Error('Zaznacz przynajmniej jedno pole do aktualizacji.');
  }

  const message = input.message?.trim() || null;
  if (message && message.length > 500) throw new Error('Wiadomość jest za długa.');

  let subjectSlug = input.subjectSlug?.trim() || null;
  const proposedTitle = input.proposedSubjectTitle?.trim() || null;
  const proposedFull = input.proposedSubjectFullName?.trim() || null;
  const proposedDesc = input.proposedSubjectDescription?.trim() || null;

  if (applySubject) {
    if (subjectSlug && proposedTitle) {
      throw new Error('Wybierz istniejący przedmiot albo zgłoś nowy, nie oba naraz.');
    }
    if (!subjectSlug && !proposedTitle) {
      throw new Error('Przy zmianie przedmiotu wybierz istniejący albo podaj nowy.');
    }
    if (subjectSlug) {
      const err = assertSlug(subjectSlug);
      if (err) throw new Error(err);
      if (!(await subjectExists(subjectSlug))) throw new Error('Nie ma takiego przedmiotu.');
    }
  } else {
    subjectSlug = null;
  }

  const snap = snapFromNote(input.note);
  const { rows } = await query<PublishRequest>(
    `INSERT INTO publish_requests (
       note_id, user_id, kind, message, subject_slug,
       proposed_subject_title, proposed_subject_full_name, proposed_subject_description,
       snap_title, snap_description, snap_body,
       apply_title, apply_description, apply_body, apply_subject,
       publication_id
     ) VALUES ($1,$2,'update',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING *`,
    [
      input.note.id,
      input.userId,
      message,
      subjectSlug,
      proposedTitle,
      proposedFull,
      proposedDesc,
      snap.snap_title,
      snap.snap_description,
      snap.snap_body,
      applyTitle,
      applyDescription,
      applyBody,
      applySubject,
      publication.id,
    ],
  );
  return rows[0];
}

const requestSelect = `
  SELECT r.*, u.username,
         n.title AS note_title, n.slug AS note_slug, n.body AS note_body,
         n.description AS note_description, n.is_public AS note_is_public
  FROM publish_requests r
  JOIN users u ON u.id = r.user_id
  JOIN user_notes n ON n.id = r.note_id
`;

export async function listPendingRequests(
  kind?: PublishRequestKind,
): Promise<PublishRequestView[]> {
  const params: unknown[] = [];
  let where = `WHERE r.status = 'pending'`;
  if (kind) {
    params.push(kind);
    where += ` AND r.kind = $${params.length}`;
  }
  const { rows } = await query<PublishRequestView>(
    `${requestSelect} ${where} ORDER BY r.created_at ASC`,
    params,
  );
  return rows;
}

export async function listRequestsForUser(userId: string): Promise<PublishRequestView[]> {
  const { rows } = await query<PublishRequestView>(
    `${requestSelect} WHERE r.user_id = $1 ORDER BY r.created_at DESC LIMIT 50`,
    [userId],
  );
  return rows;
}

export async function latestRequestForNote(noteId: string): Promise<PublishRequest | null> {
  const { rows } = await query<PublishRequest>(
    `SELECT * FROM publish_requests WHERE note_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [noteId],
  );
  return rows[0] ?? null;
}

async function resolveSubjectSlug(req: PublishRequest): Promise<string> {
  if (req.subject_slug) {
    if (!(await subjectExists(req.subject_slug))) {
      throw new Error('Wybrany przedmiot już nie istnieje.');
    }
    return req.subject_slug;
  }
  if (req.proposed_subject_title) {
    const created = await createCatalogSubject({
      title: req.proposed_subject_title,
      fullName: req.proposed_subject_full_name,
      description: req.proposed_subject_description,
      slug: slugifyTitle(req.proposed_subject_title),
    });
    return created.slug;
  }
  throw new Error('Prośba nie ma przedmiotu.');
}

export async function resolveRequest(input: {
  requestId: string;
  accept: boolean;
  adminNote?: string;
}): Promise<{ request: PublishRequest; publication?: Publication }> {
  const { rows } = await query<PublishRequest>(
    `SELECT * FROM publish_requests WHERE id = $1 LIMIT 1`,
    [input.requestId],
  );
  const req = rows[0];
  if (!req) throw new Error('Nie ma takiej prośby.');
  if (req.status !== 'pending') throw new Error('Prośba jest już rozpatrzona.');

  const status: PublishRequestStatus = input.accept ? 'accepted' : 'rejected';
  const adminNote = input.adminNote?.trim() || null;

  if (!input.accept) {
    const { rows: updated } = await query<PublishRequest>(
      `UPDATE publish_requests
       SET status = $2, admin_note = $3, resolved_at = now()
       WHERE id = $1
       RETURNING *`,
      [input.requestId, status, adminNote],
    );
    return { request: updated[0] };
  }

  const title = req.snap_title?.trim();
  const body = req.snap_body ?? '';
  if (!title) throw new Error('Prośba nie ma zrzutu tytułu.');

  let publication: Publication | undefined;

  if (req.kind === 'publish') {
    const subjectSlug = await resolveSubjectSlug(req);
    const { rows: notes } = await query<UserNote>(
      `SELECT * FROM user_notes WHERE id = $1 LIMIT 1`,
      [req.note_id],
    );
    const note = notes[0];
    if (!note) throw new Error('Notatka źródłowa zniknęła.');

    const { rows: users } = await query<{ username: string }>(
      `SELECT username FROM users WHERE id = $1 LIMIT 1`,
      [req.user_id],
    );
    const username = users[0]?.username;
    if (!username) throw new Error('Autor zniknął.');

    publication = await createPublication({
      subjectSlug,
      slugPreferred: note.slug || slugifyTitle(title),
      title,
      description: req.snap_description,
      body,
      authorUserId: req.user_id,
      authorUsername: username,
      sourceNoteId: note.id,
    });

    await query(`UPDATE user_notes SET is_public = TRUE, updated_at = now() WHERE id = $1`, [
      note.id,
    ]);
  } else {
    if (!req.publication_id) throw new Error('Prośba update bez publikacji.');
    const current = await getPublicationById(req.publication_id);
    if (!current || !current.is_active) throw new Error('Publikacja nie istnieje lub jest zdjęta.');

    let subjectSlug = current.subject_slug;
    if (req.apply_subject) {
      subjectSlug = await resolveSubjectSlug(req);
    }

    publication = await updatePublication(current.id, {
      subjectSlug: req.apply_subject ? subjectSlug : undefined,
      title: req.apply_title ? title : undefined,
      description: req.apply_description ? req.snap_description : undefined,
      body: req.apply_body ? body : undefined,
    });
  }

  const { rows: updated } = await query<PublishRequest>(
    `UPDATE publish_requests
     SET status = $2, admin_note = $3, resolved_at = now(), publication_id = $4
     WHERE id = $1
     RETURNING *`,
    [input.requestId, status, adminNote, publication.id],
  );

  return { request: updated[0], publication };
}
