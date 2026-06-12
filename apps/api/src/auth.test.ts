import { test } from "node:test";
import assert from "node:assert/strict";
import { resetPasswordResponseSchema, sessionSchema } from "@workshop/shared";
import { buildApp } from "./app.ts";
import { createAuthService } from "./auth.ts";

const buildAuthApp = () =>
  buildApp({
    authService: createAuthService({ tokenFactory: () => "test-token" }),
  });

test("POST /api/auth/login returns a session for valid credentials", async () => {
  const app = buildAuthApp();
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email: "ana@solides.com", password: "solides123" },
  });
  assert.equal(response.statusCode, 200);
  const session = sessionSchema.parse(response.json());
  assert.equal(session.token, "test-token");
  assert.equal(session.user.email, "ana@solides.com");
  assert.equal(session.user.company, "Solídes");
});

test("POST /api/auth/login rejects a wrong password with 401", async () => {
  const app = buildAuthApp();
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email: "ana@solides.com", password: "wrongpass" },
  });
  assert.equal(response.statusCode, 401);
});

test("POST /api/auth/login rejects an invalid payload with 400", async () => {
  const app = buildAuthApp();
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email: "not-an-email", password: "x" },
  });
  assert.equal(response.statusCode, 400);
});

test("POST /api/auth/signup creates an account and returns a session", async () => {
  const app = buildAuthApp();
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/signup",
    payload: { name: "Carla Dias", email: "Carla@Novacorp.com", password: "supersafe1" },
  });
  assert.equal(response.statusCode, 201);
  const session = sessionSchema.parse(response.json());
  assert.equal(session.user.email, "carla@novacorp.com"); // normalized
  assert.equal(session.user.company, "Novacorp"); // derived from the domain
});

test("POST /api/auth/signup rejects an already-registered email with 409", async () => {
  const app = buildAuthApp();
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/signup",
    payload: { name: "Ana Souza", email: "ana@solides.com", password: "anotherpass" },
  });
  assert.equal(response.statusCode, 409);
});

test("POST /api/auth/signup rejects a short password with 400", async () => {
  const app = buildAuthApp();
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/signup",
    payload: { name: "Carla Dias", email: "carla@novacorp.com", password: "short" },
  });
  assert.equal(response.statusCode, 400);
});

test("POST /api/auth/reset always returns a generic message", async () => {
  const app = buildAuthApp();
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/reset",
    payload: { email: "whoever@example.com" },
  });
  assert.equal(response.statusCode, 200);
  const body = resetPasswordResponseSchema.parse(response.json());
  assert.ok(body.message.length > 0);
});
