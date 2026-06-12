import Fastify from "fastify";
import type { FastifyReply, FastifyRequest } from "fastify";
import {
  type AuthUser,
  type HelloResponse,
  newBenchmarkSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@workshop/shared";
import {
  type BenchmarkService,
  type BenchmarkServiceDeps,
  UnknownCompanyError,
  createBenchmarkService,
} from "./benchmarks.ts";
import {
  type AuthService,
  EmailTakenError,
  InvalidCredentialsError,
  createAuthService,
} from "./auth.ts";

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export interface BuildAppOptions extends BenchmarkServiceDeps {
  /** Provide a pre-built service (tests); otherwise one is created from deps. */
  readonly service?: BenchmarkService;
  readonly authService?: AuthService;
}

export function buildApp(options: BuildAppOptions = {}) {
  const app = Fastify({ logger: true });
  const service = options.service ?? createBenchmarkService(options);
  const auth = options.authService ?? createAuthService();

  // Exposed for tests to await a benchmark's background run.
  app.decorate("benchmarks", service);

  // Validate the bearer token and attach the user; 401 when absent/invalid.
  const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
    const user = token === undefined ? undefined : await auth.authenticate(token);
    if (user === undefined) {
      return reply.code(401).send({ error: "Não autenticado" });
    }
    request.user = user;
  };
  const authed = { preHandler: requireAuth };

  app.get("/api/hello", async (): Promise<HelloResponse> => {
    return { message: "Hello from Fastify!" };
  });

  app.post("/api/auth/login", async (request, reply) => {
    const parsed = signInSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Payload inválido", issues: parsed.error.issues });
    }
    try {
      return await auth.login(parsed.data);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        return reply.code(401).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/api/auth/signup", async (request, reply) => {
    const parsed = signUpSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Payload inválido", issues: parsed.error.issues });
    }
    try {
      return reply.code(201).send(await auth.signup(parsed.data));
    } catch (error) {
      if (error instanceof EmailTakenError) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/api/auth/reset", async (request, reply) => {
    const parsed = resetPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Payload inválido", issues: parsed.error.issues });
    }
    return auth.reset(parsed.data);
  });

  app.get("/api/companies", authed, async () => service.listCompanies());

  app.get("/api/catalogs", authed, async () => service.listCatalog());

  app.get("/api/benchmarks", authed, async (request) =>
    service.listBenchmarks(request.user!.id),
  );

  app.post("/api/benchmarks", authed, async (request, reply) => {
    const parsed = newBenchmarkSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Payload inválido", issues: parsed.error.issues });
    }
    try {
      return reply.code(201).send(await service.createBenchmark(parsed.data, request.user!.id));
    } catch (error) {
      if (error instanceof UnknownCompanyError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get("/api/benchmarks/:id", authed, async (request, reply) => {
    const { id } = request.params as { id: string };
    const benchmark = await service.getBenchmark(id);
    if (benchmark === undefined) {
      return reply.code(404).send({ error: "Benchmark não disponível" });
    }
    return benchmark;
  });

  app.get("/api/benchmarks/:id/status", authed, async (request, reply) => {
    const { id } = request.params as { id: string };
    const status = await service.getStatus(id);
    if (status === undefined) {
      return reply.code(404).send({ error: "Benchmark não encontrado" });
    }
    return status;
  });

  app.get("/api/benchmarks/:id/cohort", authed, async (request, reply) => {
    const { id } = request.params as { id: string };
    const cohort = await service.getCohort(id);
    if (cohort === undefined) {
      return reply.code(404).send({ error: "Cohort não disponível" });
    }
    return cohort;
  });

  app.get("/api/benchmarks/:id/diagnostic", authed, async (request, reply) => {
    const { id } = request.params as { id: string };
    const diagnostic = await service.getDiagnostic(id);
    if (diagnostic === undefined) {
      return reply.code(404).send({ error: "Diagnóstico não disponível" });
    }
    return diagnostic;
  });

  app.get("/api/benchmarks/:id/trends", authed, async (request, reply) => {
    const { id } = request.params as { id: string };
    const trends = await service.getTrends(id);
    if (trends === undefined) {
      return reply.code(404).send({ error: "Tendências não disponíveis" });
    }
    return trends;
  });

  return app;
}
