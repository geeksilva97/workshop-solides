import { test } from "node:test";
import assert from "node:assert/strict";
import { helloResponseSchema } from "@workshop/shared";
import { buildApp } from "./app.ts";

test("GET /api/hello returns a valid hello response", async () => {
  const app = buildApp();

  const response = await app.inject({ method: "GET", url: "/api/hello" });

  assert.equal(response.statusCode, 200);
  const body = helloResponseSchema.parse(response.json());
  assert.equal(body.message, "Hello from Fastify!");
});
