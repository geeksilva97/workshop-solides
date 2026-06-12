-- Idempotent schema for the Solides Run API. Applied on boot by migrate.ts.

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  company     TEXT NOT NULL,
  salt        TEXT NOT NULL,
  hash        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);

CREATE TABLE IF NOT EXISTS companies (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  anonymized_name TEXT NOT NULL,
  description     TEXT NOT NULL,
  setor           TEXT NOT NULL,
  porte           TEXT NOT NULL,
  uf              TEXT NOT NULL,
  regiao          TEXT NOT NULL,
  modelo          TEXT NOT NULL,
  indicators      JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS benchmarks (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id    TEXT NOT NULL,
  status        TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  filters       JSONB NOT NULL,
  indicators    JSONB NOT NULL,
  summary       JSONB NOT NULL,
  benchmark     JSONB,
  diagnostic    JSONB
);
CREATE INDEX IF NOT EXISTS benchmarks_user_company_idx
  ON benchmarks (user_id, company_id, created_at);
