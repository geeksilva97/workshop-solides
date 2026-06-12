/**
 * Idempotent seed: the client companies the UI offers as benchmark targets and
 * the demo accounts the workshop logs in with. Re-running never overwrites
 * existing rows (ON CONFLICT DO NOTHING), so passwords stay stable.
 */
import { randomUUID } from "node:crypto";
import type pg from "pg";
import { CLIENT_COMPANIES } from "@workshop/engine";
import { DEFAULT_ACCOUNTS } from "../auth.ts";
import { hashPassword, newSalt } from "../password.ts";

export const seed = async (db: Pick<pg.Pool, "query">): Promise<void> => {
  for (const c of CLIENT_COMPANIES) {
    await db.query(
      `INSERT INTO companies
         (id, name, anonymized_name, description, setor, porte, uf, regiao, modelo, indicators)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [
        c.id,
        c.name,
        c.anonymizedName,
        c.description,
        c.setor,
        c.porte,
        c.uf,
        c.regiao,
        c.modelo,
        JSON.stringify(c.indicators),
      ],
    );
  }

  for (const account of DEFAULT_ACCOUNTS) {
    const salt = newSalt();
    await db.query(
      `INSERT INTO users (id, name, email, company, salt, hash)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING`,
      [
        randomUUID(),
        account.name,
        account.email.toLowerCase(),
        account.company,
        salt,
        hashPassword(account.password, salt),
      ],
    );
  }
};
