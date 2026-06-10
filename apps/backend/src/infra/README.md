# infra

Concrete implementations of the ports the `application` layer defines: the outermost
ring, where the system touches the real world.

This is where Postgres + pgvector access, the Anthropic SDK client, and any external
integrations live. An adapter here implements an application port (e.g. a
`PgCompanyRepository implements CompanyRepository`) so the inner layers stay ignorant
of the technology. Swap Postgres for something else and only `infra` changes.
