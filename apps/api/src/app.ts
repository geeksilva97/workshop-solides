import Fastify from "fastify";
import { type HelloResponse } from "@workshop/shared";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.get("/api/hello", async (): Promise<HelloResponse> => {
    return { message: "Hello from Fastify!" };
  });

  return app;
}
