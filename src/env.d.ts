import type { AuthContext } from './lib/server/sessions';
import type { User } from './lib/server/users';

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      csrf: string | null;
      dbReady: boolean;
      auth?: AuthContext;
    }
  }
}

export {};
