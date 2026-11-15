import type { APIRoute } from 'astro';
import {
  assertSafeMutation,
  parseForm,
  readFormString,
  redirect,
  requireAdmin,
} from '../../../lib/server/http';
import { setPublicationActive } from '../../../lib/server/publication-notes';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const auth = await requireAdmin(context);
  if (auth instanceof Response) return auth;

  const formOrErr = await parseForm(context.request);
  if (formOrErr instanceof Response) return formOrErr;
  const form = formOrErr;

  const tab = readFormString(form, 'tab') || 'publikacje';
  const back = `/admin/prosby/?tab=${encodeURIComponent(tab)}`;

  const unsafe = assertSafeMutation(context, auth, form);
  if (unsafe) {
    return redirect(`${back}&error=` + encodeURIComponent(unsafe));
  }

  const publicationId = readFormString(form, 'publication_id');
  const active = readFormString(form, 'active') === '1';

  try {
    const pub = await setPublicationActive(publicationId, active);
    return redirect(
      `${back}&ok=` +
        encodeURIComponent(
          active
            ? `Przywrócono: /przedmioty/${pub.subject_slug}/${pub.slug}/`
            : `Zdjęto publikację: ${pub.title}`,
        ),
    );
  } catch (error) {
    return redirect(
      `${back}&error=` +
        encodeURIComponent(error instanceof Error ? error.message : 'Nie udało się zmienić.'),
    );
  }
};
