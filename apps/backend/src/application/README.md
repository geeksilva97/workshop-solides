# application

Use cases. Each file orchestrates domain objects to fulfill one intent - "run a
benchmark", "authenticate an account", "build a cohort".

The application layer:

- Coordinates domain objects and calls out to ports (interfaces it *owns*) for I/O.
- Holds no transport details (no HTTP, no SQL) and no invariants of its own - those
  live in `domain`.
- Defines the boundaries that `infra` implements (e.g. a `CompanyRepository` port that
  the Postgres adapter satisfies). Dependency points inward: application defines, infra
  implements.
