import { EventEmitter } from "node:events";
import { db, adminSessions, eq, sql } from "@swami/database";

export interface FastifySessionStore {
  set(sessionId: string, session: any, callback: (err?: any) => void): void;
  get(sessionId: string, callback: (err: any, session?: any) => void): void;
  destroy(sessionId: string, callback: (err?: any) => void): void;
}

export class PostgresSessionStore extends EventEmitter implements FastifySessionStore {
  /**
   * Fetch session by sessionId.
   * If not found or expired, returns null.
   */
  get(sessionId: string, callback: (err: any, session?: any) => void): void {
    db.select()
      .from(adminSessions)
      .where(eq(adminSessions.id, sessionId))
      .limit(1)
      .then(async ([row]) => {
        if (!row) {
          return callback(null, null);
        }

        const now = new Date();
        if (row.expiresAt && row.expiresAt.getTime() <= now.getTime()) {
          // Expired session: delete asynchronously and return null
          db.delete(adminSessions)
            .where(eq(adminSessions.id, sessionId))
            .catch(() => {});
          return callback(null, null);
        }

        try {
          const parsed = JSON.parse(row.data);
          callback(null, parsed);
        } catch (parseErr) {
          callback(parseErr, null);
        }
      })
      .catch((err) => callback(err));
  }

  /**
   * Save session data to PostgreSQL.
   * Calculates expiresAt from session.cookie.expires or cookie.maxAge (default 7 days).
   */
  set(sessionId: string, session: any, callback: (err?: any) => void): void {
    try {
      let expiresAt: Date;

      if (session?.cookie?.expires) {
        expiresAt = new Date(session.cookie.expires);
      } else if (session?.cookie?.maxAge) {
        expiresAt = new Date(Date.now() + session.cookie.maxAge);
      } else {
        expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days fallback
      }

      // Serialize session object preserving user data and cookie metadata
      const serializedData = JSON.stringify(session);

      db.insert(adminSessions)
        .values({
          id: sessionId,
          data: serializedData,
          expiresAt,
        })
        .onConflictDoUpdate({
          target: adminSessions.id,
          set: {
            data: serializedData,
            expiresAt,
          },
        })
        .then(() => callback())
        .catch((err) => callback(err));
    } catch (err) {
      callback(err);
    }
  }

  /**
   * Destroy session on logout or invalidation.
   */
  destroy(sessionId: string, callback: (err?: any) => void): void {
    db.delete(adminSessions)
      .where(eq(adminSessions.id, sessionId))
      .then(() => callback())
      .catch((err) => callback(err));
  }
}
