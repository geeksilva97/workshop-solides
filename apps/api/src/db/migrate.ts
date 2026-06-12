/** Apply the idempotent schema. Safe to run on every boot. */
import { readFileSync } from "node:fs";
import type pg from "pg";

const SCHEMA = readFileSync(new URL("./schema.sql", import.meta.url), "utf8");

export const migrate = async (db: Pick<pg.Pool, "query">): Promise<void> => {
  await db.query(SCHEMA);
};
