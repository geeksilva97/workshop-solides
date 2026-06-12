import { buildApp } from "./app.ts";
import { getPool } from "./db/pool.ts";
import { migrate } from "./db/migrate.ts";
import { seed } from "./db/seed.ts";
import { createPostgresRepositories } from "./repositories/postgres.ts";
import { createAuthService } from "./auth.ts";
import { createBenchmarkService } from "./benchmarks.ts";

const pool = getPool();
await migrate(pool);
await seed(pool);

const repos = createPostgresRepositories(pool);
// A previous process may have died mid-run; those benchmarks can never finish.
await repos.benchmarks.failOrphaned();

const app = buildApp({
  authService: createAuthService({ users: repos.users, sessions: repos.sessions }),
  service: createBenchmarkService({
    companies: repos.companies,
    benchmarks: repos.benchmarks,
  }),
});

const port = Number(process.env.PORT ?? 3000);

app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
