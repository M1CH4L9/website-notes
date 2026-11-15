import { defineMiddleware } from 'astro:middleware';
import { isDatabaseConfigured } from './lib/server/env';
import { getAuthFromCookies, csrfTokenFor } from './lib/server/sessions';

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = null;
  context.locals.csrf = null;
  context.locals.dbReady = isDatabaseConfigured();

  if (context.locals.dbReady) {
    try {
      const auth = await getAuthFromCookies(context.cookies);
      if (auth) {
        context.locals.user = auth.user;
        context.locals.csrf = csrfTokenFor(auth.session);
        context.locals.auth = auth;
      }
    } catch (error) {
      console.error('[middleware] auth', error);
    }
  }

  return next();
});
