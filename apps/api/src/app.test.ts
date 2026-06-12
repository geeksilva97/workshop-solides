import { describe, it, expect } from "vitest";
import { helloResponseSchema } from "@workshop/shared";
import { buildApp } from "./app.js";

describe("GET /api/hello", () => {
  it("returns a valid hello response", async () => {
    const app = buildApp();

    const response = await app.inject({ method: "GET", url: "/api/hello" });

    expect(response.statusCode).toBe(200);
    const body = helloResponseSchema.parse(response.json());
    expect(body.message).toBe("Hello from Fastify!");
  });
});
