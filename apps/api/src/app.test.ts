import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import {
  benchmarkListSchema,
  benchmarkSchema,
  catalogSchema,
  cohortSchema,
  companyOptionSchema,
  diagnosticSchema,
  helloResponseSchema,
  type NewBenchmarkInput,
  pipelineStatusSchema,
  trendsSchema,
} from "@workshop/shared";
import { createFakeEmbedder, createFakeReranker } from "@workshop/engine";
import { buildApp } from "./app.ts";
import { createBenchmarkService } from "./benchmarks.ts";
import { createAuthService } from "./auth.ts";

const validInput: NewBenchmarkInput = {
  companyId: "client-solipse",
  filters: { setor: "Tecnologia", porte: "100–500", regiao: "Sudeste" },
  indicators: ["turnover_voluntario", "absenteismo", "enps"],
};

const TEST_ACCOUNT = {
  name: "Tester",
  email: "tester@solides.com",
  password: "secret123",
  company: "Solídes",
} as const;

/**
 * Build an app whose pipeline runs on deterministic fakes, log in the test
 * account and return an Authorization header for the protected routes.
 * `now` increments by one second per call so successive runs are ordered.
 */
const buildTestApp = async () => {
  let counter = 0;
  let tick = 0;
  const authService = createAuthService({
    tokenFactory: () => "test-token",
    seedAccounts: [TEST_ACCOUNT],
  });
  const service = createBenchmarkService({
    embedder: createFakeEmbedder(),
    reranker: createFakeReranker(),
    now: () => new Date(Date.UTC(2026, 5, 12, 0, 0, tick++)).toISOString(),
    idFactory: () => `bm-${++counter}`,
  });
  const app = buildApp({ service, authService });

  const login = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email: TEST_ACCOUNT.email, password: TEST_ACCOUNT.password },
  });
  const { token } = login.json() as { token: string };
  const auth = { authorization: `Bearer ${token}` };
  return { app, service, auth };
};

const createAndFinish = async (
  app: ReturnType<typeof buildApp>,
  service: ReturnType<typeof createBenchmarkService>,
  auth: Record<string, string>,
  body: unknown = validInput,
): Promise<string> => {
  const created = await app.inject({
    method: "POST",
    url: "/api/benchmarks",
    headers: auth,
    payload: body,
  });
  assert.equal(created.statusCode, 201);
  const { id } = created.json() as { id: string };
  await service.waitFor(id);
  return id;
};

test("GET /api/hello returns a valid hello response", async () => {
  const { app } = await buildTestApp();
  const response = await app.inject({ method: "GET", url: "/api/hello" });
  assert.equal(response.statusCode, 200);
  assert.equal(helloResponseSchema.parse(response.json()).message, "Hello from Fastify!");
});

test("protected routes reject requests without a session token with 401", async () => {
  const { app } = await buildTestApp();
  const response = await app.inject({ method: "GET", url: "/api/benchmarks" });
  assert.equal(response.statusCode, 401);
});

test("protected routes reject an invalid token with 401", async () => {
  const { app } = await buildTestApp();
  const response = await app.inject({
    method: "GET",
    url: "/api/benchmarks",
    headers: { authorization: "Bearer nope" },
  });
  assert.equal(response.statusCode, 401);
});

test("GET /api/companies lists the client companies", async () => {
  const { app, auth } = await buildTestApp();
  const response = await app.inject({ method: "GET", url: "/api/companies", headers: auth });
  assert.equal(response.statusCode, 200);
  const companies = z.array(companyOptionSchema).parse(response.json());
  assert.ok(companies.some((c) => c.id === "client-solipse"));
});

test("GET /api/catalogs returns the corpus-derived filter options", async () => {
  const { app, auth } = await buildTestApp();
  const response = await app.inject({ method: "GET", url: "/api/catalogs", headers: auth });
  assert.equal(response.statusCode, 200);
  const catalog = catalogSchema.parse(response.json());
  assert.ok(catalog.setores.includes("Tecnologia"));
  assert.ok(catalog.portes.length > 0);
  assert.ok(catalog.regioes.includes("Sudeste"));
});

test("POST /api/benchmarks starts a run and returns its id", async () => {
  const { app, service, auth } = await buildTestApp();
  const response = await app.inject({
    method: "POST",
    url: "/api/benchmarks",
    headers: auth,
    payload: validInput,
  });
  assert.equal(response.statusCode, 201);
  const body = z.object({ id: z.string() }).parse(response.json());
  assert.equal(body.id, "bm-1");
  await service.waitFor(body.id);
});

test("POST /api/benchmarks rejects an invalid payload with 400", async () => {
  const { app, auth } = await buildTestApp();
  const response = await app.inject({
    method: "POST",
    url: "/api/benchmarks",
    headers: auth,
    payload: { companyId: "", filters: {}, indicators: [] },
  });
  assert.equal(response.statusCode, 400);
});

test("POST /api/benchmarks returns 404 for an unknown company", async () => {
  const { app, auth } = await buildTestApp();
  const response = await app.inject({
    method: "POST",
    url: "/api/benchmarks",
    headers: auth,
    payload: { ...validInput, companyId: "nope" },
  });
  assert.equal(response.statusCode, 404);
});

test("GET /api/benchmarks/:id/status reports a valid, completed status", async () => {
  const { app, service, auth } = await buildTestApp();
  const id = await createAndFinish(app, service, auth);
  const response = await app.inject({
    method: "GET",
    url: `/api/benchmarks/${id}/status`,
    headers: auth,
  });
  assert.equal(response.statusCode, 200);
  const status = pipelineStatusSchema.parse(response.json());
  assert.equal(status.done, true);
  assert.equal(status.percent, 100);
});

test("GET /api/benchmarks/:id/status is 404 for an unknown id", async () => {
  const { app, auth } = await buildTestApp();
  const response = await app.inject({
    method: "GET",
    url: "/api/benchmarks/missing/status",
    headers: auth,
  });
  assert.equal(response.statusCode, 404);
});

test("GET /api/benchmarks/:id returns the finished benchmark", async () => {
  const { app, service, auth } = await buildTestApp();
  const id = await createAndFinish(app, service, auth);
  const response = await app.inject({
    method: "GET",
    url: `/api/benchmarks/${id}`,
    headers: auth,
  });
  assert.equal(response.statusCode, 200);
  const benchmark = benchmarkSchema.parse(response.json());
  assert.equal(benchmark.id, id);
  assert.equal(benchmark.companyName, "Solípse Tecnologia");
  assert.equal(benchmark.kpis.length, validInput.indicators.length);
});

test("GET /api/benchmarks/:id is 404 before the run finishes / when unknown", async () => {
  const { app, auth } = await buildTestApp();
  const response = await app.inject({
    method: "GET",
    url: "/api/benchmarks/missing",
    headers: auth,
  });
  assert.equal(response.statusCode, 404);
});

test("GET /api/benchmarks/:id/cohort returns a valid cohort", async () => {
  const { app, service, auth } = await buildTestApp();
  const id = await createAndFinish(app, service, auth);
  const response = await app.inject({
    method: "GET",
    url: `/api/benchmarks/${id}/cohort`,
    headers: auth,
  });
  assert.equal(response.statusCode, 200);
  const cohort = cohortSchema.parse(response.json());
  assert.equal(cohort.size, 10);
  assert.ok(cohort.companies.every((c) => c.setor === "Tecnologia"));
});

test("GET /api/benchmarks/:id/diagnostic returns a valid diagnostic", async () => {
  const { app, service, auth } = await buildTestApp();
  const id = await createAndFinish(app, service, auth);
  const response = await app.inject({
    method: "GET",
    url: `/api/benchmarks/${id}/diagnostic`,
    headers: auth,
  });
  assert.equal(response.statusCode, 200);
  const diagnostic = diagnosticSchema.parse(response.json());
  assert.equal(diagnostic.benchmarkId, id);
});

test("GET /api/benchmarks/:id/trends returns a valid trend view", async () => {
  const { app, service, auth } = await buildTestApp();
  const id = await createAndFinish(app, service, auth);
  const response = await app.inject({
    method: "GET",
    url: `/api/benchmarks/${id}/trends`,
    headers: auth,
  });
  assert.equal(response.statusCode, 200);
  const trends = trendsSchema.parse(response.json());
  assert.equal(trends.benchmarkId, id);
  assert.equal(trends.periods.length, 2);
  assert.equal(trends.indicators.length, validInput.indicators.length);
  // No prior run yet: the first benchmark is reported as the first period.
  assert.ok(trends.indicators.every((i) => i.statusText === "Primeiro período medido"));
});

test("trends compare a run against the previous run for the same company", async () => {
  const { app, service, auth } = await buildTestApp();
  await createAndFinish(app, service, auth); // first period (history)
  const second = await createAndFinish(app, service, auth);
  const response = await app.inject({
    method: "GET",
    url: `/api/benchmarks/${second}/trends`,
    headers: auth,
  });
  assert.equal(response.statusCode, 200);
  const trends = trendsSchema.parse(response.json());
  // A prior run exists, so the trend is computed from real history rather than
  // reported as the first period.
  assert.ok(trends.indicators.every((i) => i.statusText !== "Primeiro período medido"));
});

test("GET /api/benchmarks/:id/trends is 404 when the benchmark is unknown", async () => {
  const { app, auth } = await buildTestApp();
  const response = await app.inject({
    method: "GET",
    url: "/api/benchmarks/missing/trends",
    headers: auth,
  });
  assert.equal(response.statusCode, 404);
});

test("GET /api/benchmarks lists prior runs", async () => {
  const { app, service, auth } = await buildTestApp();
  const id = await createAndFinish(app, service, auth);
  const response = await app.inject({ method: "GET", url: "/api/benchmarks", headers: auth });
  assert.equal(response.statusCode, 200);
  const list = benchmarkListSchema.parse(response.json());
  const summary = list.find((b) => b.id === id);
  assert.ok(summary);
  assert.equal(summary!.status, "done");
});
