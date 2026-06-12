import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import {
  benchmarkListSchema,
  benchmarkSchema,
  cohortSchema,
  companyOptionSchema,
  diagnosticSchema,
  helloResponseSchema,
  type NewBenchmarkInput,
  pipelineStatusSchema,
} from "@workshop/shared";
import { createFakeEmbedder, createFakeReranker } from "@workshop/engine";
import { buildApp } from "./app.ts";
import { createBenchmarkService } from "./benchmarks.ts";

const validInput: NewBenchmarkInput = {
  companyId: "client-solipse",
  filters: { setor: "Tecnologia", porte: "100–500", regiao: "Sudeste" },
  indicators: ["turnover_voluntario", "absenteismo", "enps"],
};

/** Build an app whose pipeline runs on deterministic fakes. */
const buildTestApp = () => {
  let counter = 0;
  const service = createBenchmarkService({
    embedder: createFakeEmbedder(),
    reranker: createFakeReranker(),
    now: () => "2026-06-12T00:00:00.000Z",
    idFactory: () => `bm-${++counter}`,
  });
  return { app: buildApp({ service }), service };
};

const createAndFinish = async (
  app: ReturnType<typeof buildApp>,
  service: ReturnType<typeof createBenchmarkService>,
  body: unknown = validInput,
): Promise<string> => {
  const created = await app.inject({ method: "POST", url: "/api/benchmarks", payload: body });
  assert.equal(created.statusCode, 201);
  const { id } = created.json() as { id: string };
  await service.waitFor(id);
  return id;
};

test("GET /api/hello returns a valid hello response", async () => {
  const { app } = buildTestApp();
  const response = await app.inject({ method: "GET", url: "/api/hello" });
  assert.equal(response.statusCode, 200);
  assert.equal(helloResponseSchema.parse(response.json()).message, "Hello from Fastify!");
});

test("GET /api/companies lists the client companies", async () => {
  const { app } = buildTestApp();
  const response = await app.inject({ method: "GET", url: "/api/companies" });
  assert.equal(response.statusCode, 200);
  const companies = z.array(companyOptionSchema).parse(response.json());
  assert.ok(companies.some((c) => c.id === "client-solipse"));
});

test("POST /api/benchmarks starts a run and returns its id", async () => {
  const { app, service } = buildTestApp();
  const response = await app.inject({ method: "POST", url: "/api/benchmarks", payload: validInput });
  assert.equal(response.statusCode, 201);
  const body = z.object({ id: z.string() }).parse(response.json());
  assert.equal(body.id, "bm-1");
  await service.waitFor(body.id);
});

test("POST /api/benchmarks rejects an invalid payload with 400", async () => {
  const { app } = buildTestApp();
  const response = await app.inject({
    method: "POST",
    url: "/api/benchmarks",
    payload: { companyId: "", filters: {}, indicators: [] },
  });
  assert.equal(response.statusCode, 400);
});

test("POST /api/benchmarks returns 404 for an unknown company", async () => {
  const { app } = buildTestApp();
  const response = await app.inject({
    method: "POST",
    url: "/api/benchmarks",
    payload: { ...validInput, companyId: "nope" },
  });
  assert.equal(response.statusCode, 404);
});

test("GET /api/benchmarks/:id/status reports a valid, completed status", async () => {
  const { app, service } = buildTestApp();
  const id = await createAndFinish(app, service);
  const response = await app.inject({ method: "GET", url: `/api/benchmarks/${id}/status` });
  assert.equal(response.statusCode, 200);
  const status = pipelineStatusSchema.parse(response.json());
  assert.equal(status.done, true);
  assert.equal(status.percent, 100);
});

test("GET /api/benchmarks/:id/status is 404 for an unknown id", async () => {
  const { app } = buildTestApp();
  const response = await app.inject({ method: "GET", url: "/api/benchmarks/missing/status" });
  assert.equal(response.statusCode, 404);
});

test("GET /api/benchmarks/:id returns the finished benchmark", async () => {
  const { app, service } = buildTestApp();
  const id = await createAndFinish(app, service);
  const response = await app.inject({ method: "GET", url: `/api/benchmarks/${id}` });
  assert.equal(response.statusCode, 200);
  const benchmark = benchmarkSchema.parse(response.json());
  assert.equal(benchmark.id, id);
  assert.equal(benchmark.companyName, "Solípse Tecnologia");
  assert.equal(benchmark.kpis.length, validInput.indicators.length);
});

test("GET /api/benchmarks/:id is 404 before the run finishes / when unknown", async () => {
  const { app } = buildTestApp();
  const response = await app.inject({ method: "GET", url: "/api/benchmarks/missing" });
  assert.equal(response.statusCode, 404);
});

test("GET /api/benchmarks/:id/cohort returns a valid cohort", async () => {
  const { app, service } = buildTestApp();
  const id = await createAndFinish(app, service);
  const response = await app.inject({ method: "GET", url: `/api/benchmarks/${id}/cohort` });
  assert.equal(response.statusCode, 200);
  const cohort = cohortSchema.parse(response.json());
  assert.equal(cohort.size, 10);
  assert.ok(cohort.companies.every((c) => c.setor === "Tecnologia"));
});

test("GET /api/benchmarks/:id/diagnostic returns a valid diagnostic", async () => {
  const { app, service } = buildTestApp();
  const id = await createAndFinish(app, service);
  const response = await app.inject({ method: "GET", url: `/api/benchmarks/${id}/diagnostic` });
  assert.equal(response.statusCode, 200);
  const diagnostic = diagnosticSchema.parse(response.json());
  assert.equal(diagnostic.benchmarkId, id);
});

test("GET /api/benchmarks lists prior runs", async () => {
  const { app, service } = buildTestApp();
  const id = await createAndFinish(app, service);
  const response = await app.inject({ method: "GET", url: "/api/benchmarks" });
  assert.equal(response.statusCode, 200);
  const list = benchmarkListSchema.parse(response.json());
  const summary = list.find((b) => b.id === id);
  assert.ok(summary);
  assert.equal(summary!.status, "done");
});
