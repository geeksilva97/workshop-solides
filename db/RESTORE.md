# Tom Ranks - dump do banco e restore

Fixture de banco pronto pra restaurar, com as tabelas, dados reais e contas de login.

## Arquivos

| Arquivo | O que é |
|---------|---------|
| `tom-ranks.dump.sql` | Dump lógico (plain SQL, ~1,3 MB). `companies` com **dados e embeddings reais** (107 empresas) + tabela `accounts` com 2 contas de login. |
| `seed-accounts.mjs` | Gerador do bloco `accounts` (hashes `scrypt` reais). Regenera o trecho de login do dump. |

> O dump é um `pg_dump --format=plain` da `companies` real + o bloco `accounts` anexado.
> Os ~1,3 MB são quase todos os **embeddings** (107 × vetor de 1024 dims em texto), não os dados.

## Pré-requisito

Postgres **17 + pgvector** (o dump roda `CREATE EXTENSION vector`). Imagem usada:
`pgvector/pgvector:pg17`.

## Restore - opção A: container novo (do zero)

```bash
# sobe um Postgres+pgvector limpo
docker run -d --name tomranks-db \
  -e POSTGRES_USER=tomranks -e POSTGRES_PASSWORD=tomranks -e POSTGRES_DB=tomranks \
  -p 5432:5432 pgvector/pgvector:pg17

# espera ficar pronto e restaura
until docker exec tomranks-db pg_isready -U tomranks -d tomranks; do sleep 1; done
docker exec -i tomranks-db psql -U tomranks -d tomranks -v ON_ERROR_STOP=1 < tom-ranks.dump.sql
```

## Restore - opção B: banco isolado num container já existente (testado)

Útil pra não mexer no banco principal. Restaura num banco separado:

```bash
docker exec tomranks-db psql -U tomranks -d postgres \
  -c "DROP DATABASE IF EXISTS restore_test;" -c "CREATE DATABASE restore_test;"
docker exec -i tomranks-db psql -U tomranks -d restore_test -v ON_ERROR_STOP=1 < tom-ranks.dump.sql
```

## Restore - opção C: psql direto (sem docker)

```bash
psql "postgresql://user:pass@host:5432/dbname" -v ON_ERROR_STOP=1 -f tom-ranks.dump.sql
```

## Credenciais de login (contas demo)

| E-mail | Senha | Empresa (company_cnpj) |
|--------|-------|------------------------|
| `gestor@solipse.com.br` | `solipse123` | Solípse (`client-solipse`) |
| `gestor@ciandt.com.br` | `ciandt123` | CI&T Software (`00609634000146`) |

## Esquema de senha (scrypt)

O `password_hash` é `salt:hash` em hex. O código de login (`apps/api`) **deve** verificar assim:

```js
import { scryptSync, timingSafeEqual } from "node:crypto";

function verifyPassword(password, stored) {       // stored = "saltHex:hashHex"
  const [saltHex, hashHex] = stored.split(":");
  const expected = Buffer.from(hashHex, "hex");
  const got = scryptSync(password, Buffer.from(saltHex, "hex"), 64); // N=16384,r=8,p=1 (default)
  return expected.length === got.length && timingSafeEqual(expected, got);
}
```

Pra regerar as contas (ex.: trocar senhas ou empresas), edite `seed-accounts.mjs` e rode:

```bash
node seed-accounts.mjs > /tmp/accounts.sql   # cola no lugar do bloco accounts do dump
```

## Tabelas

```
companies  -- pool de comparáveis (dados reais, com embedding VECTOR(1024))
accounts   -- id, name, email UNIQUE, password_hash, company_cnpj FK companies(id), created_at
```

## Verificação feita (2026-06-09)

Restaurado num banco isolado dentro do `pgvector/pgvector:pg17` e conferido:

- `companies = 107`, `accounts = 2`.
- Login real: `solipse123` valida (`true`), senha errada é rejeitada (`false`).
- Integridade FK: 0 contas órfãs.
- Banco principal intocado pelo teste; `restore_test` derrubado no fim.
