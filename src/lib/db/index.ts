import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { APP_CONFIG } from '../config';

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  db: DbInstance | undefined;
};

function createDb(): DbInstance {
  const sqlite = new Database(APP_CONFIG.dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  return drizzle(sqlite, { schema });
}

/** Lazy-initialized DB — defers connection until first use so Next.js build
 *  can collect page data without requiring the SQLite data/ directory. */
export const db: DbInstance = new Proxy({} as DbInstance, {
  get(_target, prop, receiver) {
    if (!globalForDb.db) {
      globalForDb.db = createDb();
    }
    return Reflect.get(globalForDb.db, prop, receiver);
  },
});
