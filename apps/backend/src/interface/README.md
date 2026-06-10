# interface

Adapters that translate the outside world into application calls and back.

The HTTP layer (`http/`) lives here: the Fastify server, routes, request/response
schemas. A route's job is to parse and validate input, invoke an application use case,
and shape the response. No business rules, no invariants - those belong to `domain`,
the orchestration to `application`.

Other delivery mechanisms (CLI, queue consumers) would also live here if added.
