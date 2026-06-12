import Fastify from "fastify";
import { type HelloResponse, newBenchmarkSchema } from "@workshop/shared";
import {
  type BenchmarkService,
  type BenchmarkServiceDeps,
  UnknownCompanyError,
  createBenchmarkService,
} from "./benchmarks.ts";

export interface BuildAppOptions extends BenchmarkServiceDeps {
  /** Provide a pre-built service (tests); otherwise one is created from deps. */
  readonly service?: BenchmarkService;
}

export function buildApp(options: BuildAppOptions = {}) {
  const app = Fastify({ logger: true });
  const service = options.service ?? createBenchmarkService(options);

  // Exposed for tests to await a benchmark's background run.
  app.decorate("benchmarks", service);

  app.get("/api/hello", async (): Promise<HelloResponse> => {
    return { message: "Hello from Fastify!" };
  });

  app.get("/api/companies", async () => service.listCompanies());

  app.get("/api/benchmarks", async () => service.listBenchmarks());

  app.post("/api/benchmarks", async (request, reply) => {
    const parsed = newBenchmarkSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Payload inválido", issues: parsed.error.issues });
    }
    try {
      return reply.code(201).send(service.createBenchmark(parsed.data));
    } catch (error) {
      if (error instanceof UnknownCompanyError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get("/api/benchmarks/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const benchmark = service.getBenchmark(id);
    if (benchmark === undefined) {
      return reply.code(404).send({ error: "Benchmark não disponível" });
    }
    return benchmark;
  });

  app.get("/api/benchmarks/:id/status", async (request, reply) => {
    const { id } = request.params as { id: string };
    const status = service.getStatus(id);
    if (status === undefined) {
      return reply.code(404).send({ error: "Benchmark não encontrado" });
    }
    return status;
  });

  app.get("/api/benchmarks/:id/cohort", async (request, reply) => {
    const { id } = request.params as { id: string };
    const cohort = service.getCohort(id);
    if (cohort === undefined) {
      return reply.code(404).send({ error: "Cohort não disponível" });
    }
    return cohort;
  });

  app.get("/api/benchmarks/:id/diagnostic", async (request, reply) => {
    const { id } = request.params as { id: string };
    const diagnostic = service.getDiagnostic(id);
    if (diagnostic === undefined) {
      return reply.code(404).send({ error: "Diagnóstico não disponível" });
    }
    return diagnostic;
  });

  return app;
}
