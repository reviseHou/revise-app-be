import { csrfSync } from 'csrf-sync';

export const { generateToken, isRequestValid } = csrfSync({
  getTokenFromRequest: (request) =>
    (request.body as { _csrf?: string } | undefined)?._csrf,
});
