import type { NestExpressApplication } from '@nestjs/platform-express';
import connectPgSimple from 'connect-pg-simple';
import flash from 'connect-flash';
import session from 'express-session';
import { Pool } from 'pg';
import { CMS_SESSION_COOKIE } from 'src/domain/auth/auth.constants';

declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

const SESSION_TABLE = 'cms_sessions';
const SESSION_MAX_AGE = 8 * 60 * 60 * 1000;

export function setupSession(app: NestExpressApplication) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is required');

  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) app.set('trust proxy', 1);

  const PgStore = connectPgSimple(session);
  app.use(
    session({
      name: CMS_SESSION_COOKIE,
      secret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      store: new PgStore({
        pool: new Pool({
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT ?? '5432'),
          user: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
        }),
        tableName: SESSION_TABLE,
        createTableIfMissing: true,
      }),
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
        maxAge: SESSION_MAX_AGE,
      },
    }),
  );
  app.use('/cms', flash());
}
