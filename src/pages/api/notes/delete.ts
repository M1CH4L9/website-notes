import type { APIRoute } from 'astro';
import {
  assertSafeMutation,
  parseForm,
  readFormString,
  redirect,
  requireUser,
} from '../../../lib/server/http';
import { deleteNote } from '../../../lib/server/user-notes';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const auth = await requireUser(context);
  if (auth instanceof Response) return auth;

  const formOrErr = await parseForm(context.request);
  if (formOrErr instanceof Response) return formOrErr;
  const form = formOrErr;

  const unsafe = assertSafeMutation(context, auth, form);
  if (unsafe) {
    return redirect('/moje/?error=' + encodeURIComponent(unsafe));
  }

  const slug = readFormString(form, 'slug');
  await deleteNote(auth.user.id, slug);
  return redirect('/moje/?ok=' + encodeURIComponent('Usunięto notatkę.'));
};
