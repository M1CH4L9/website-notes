import type { APIRoute } from 'astro';
import {
  assertSafeMutation,
  parseForm,
  readFormString,
  redirect,
  requireUser,
} from '../../../lib/server/http';
import { getNoteByUserAndSlug } from '../../../lib/server/user-notes';
import { requestPublish, requestUpdatePublication } from '../../../lib/server/publications';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const auth = await requireUser(context);
  if (auth instanceof Response) return auth;

  const formOrErr = await parseForm(context.request);
  if (formOrErr instanceof Response) return formOrErr;
  const form = formOrErr;

  const slug = readFormString(form, 'slug');
  const unsafe = assertSafeMutation(context, auth, form);
  if (unsafe) {
    return redirect(`/moje/${slug}/?error=` + encodeURIComponent(unsafe));
  }

  const note = await getNoteByUserAndSlug(auth.user.id, slug);
  if (!note) {
    return redirect('/moje/?error=' + encodeURIComponent('Nie ma takiej notatki.'));
  }

  const kind = readFormString(form, 'kind') || 'publish';
  const subjectMode = readFormString(form, 'subject_mode');
  const subjectSlug = subjectMode === 'existing' ? readFormString(form, 'subject_slug') : '';
  const proposedSubjectTitle =
    subjectMode === 'new' ? readFormString(form, 'proposed_subject_title') : '';
  const proposedSubjectFullName =
    subjectMode === 'new' ? readFormString(form, 'proposed_subject_full_name') : '';
  const proposedSubjectDescription =
    subjectMode === 'new' ? readFormString(form, 'proposed_subject_description') : '';

  try {
    if (kind === 'update') {
      await requestUpdatePublication({
        userId: auth.user.id,
        note,
        message: readFormString(form, 'message'),
        subjectSlug: subjectSlug || undefined,
        proposedSubjectTitle: proposedSubjectTitle || undefined,
        proposedSubjectFullName: proposedSubjectFullName || undefined,
        proposedSubjectDescription: proposedSubjectDescription || undefined,
        applyTitle: form.get('apply_title') === 'on',
        applyDescription: form.get('apply_description') === 'on',
        applyBody: form.get('apply_body') === 'on',
        applySubject: form.get('apply_subject') === 'on',
      });
      return redirect(
        `/moje/${slug}/?ok=` + encodeURIComponent('Wysłano prośbę o aktualizację publikacji.'),
      );
    }

    await requestPublish({
      userId: auth.user.id,
      note,
      message: readFormString(form, 'message'),
      subjectSlug: subjectSlug || undefined,
      proposedSubjectTitle: proposedSubjectTitle || undefined,
      proposedSubjectFullName: proposedSubjectFullName || undefined,
      proposedSubjectDescription: proposedSubjectDescription || undefined,
    });
    return redirect(`/moje/${slug}/?ok=` + encodeURIComponent('Wysłano prośbę o upublicznienie.'));
  } catch (error) {
    return redirect(
      `/moje/${slug}/?error=` +
        encodeURIComponent(error instanceof Error ? error.message : 'Nie udało się wysłać prośby.'),
    );
  }
};
