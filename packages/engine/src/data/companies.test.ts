import { test } from "node:test";
import assert from "node:assert/strict";
import { indicatorEnum } from "@workshop/shared";
import {
  CLIENT_COMPANIES,
  CORPUS,
  CORPUS_SIZE,
  catalogFromCorpus,
  companyOptions,
  findClientCompany,
  generateCorpus,
} from "./companies.ts";

const INDICATORS = indicatorEnum.options;

test("corpus has the default size and is reproducible", () => {
  assert.equal(CORPUS.length, CORPUS_SIZE);
  assert.deepEqual(generateCorpus(10, 42), generateCorpus(10, 42));
});

test("a custom size is honored", () => {
  assert.equal(generateCorpus(7).length, 7);
});

test("different seeds produce different indicator values", () => {
  const a = generateCorpus(1, 1)[0]!;
  const b = generateCorpus(1, 2)[0]!;
  assert.notDeepEqual(a.indicators, b.indicators);
  // The categorical fields are index-based, so they stay identical.
  assert.equal(a.setor, b.setor);
});

test("first company is generated deterministically (pinned snapshot)", () => {
  assert.deepEqual(generateCorpus()[0], {
    id: "peer-001",
    name: "Tecnologia SP 1",
    anonymizedName: "Empresa 001",
    setor: "Tecnologia",
    porte: "50–100",
    uf: "SP",
    regiao: "Sudeste",
    modelo: "B2B",
    description:
      "Empresa de tecnologia com modelo B2B, porte 50–100 funcionários, sediada em SP na região Sudeste.",
    indicators: {
      turnover_voluntario: 14.3,
      turnover_involuntario: 6.1,
      absenteismo: 3.1,
      time_to_hire: 27,
      enps: 32,
      cost_per_hire: 7100,
      tenure_medio: 23,
    },
  });
});

test("categorical fields cycle through their lists by index (modulo)", () => {
  const corpus = generateCorpus(4);
  // i = 1 -> 2nd of each list; uf is the 2nd UF of the Sul region.
  assert.equal(corpus[1]!.setor, "Serviços financeiros");
  assert.equal(corpus[1]!.porte, "100–500");
  assert.equal(corpus[1]!.modelo, "B2C");
  assert.equal(corpus[1]!.regiao, "Sul");
  assert.equal(corpus[1]!.uf, "SC");
  // i = 2 -> 3rd of each list; uf is the 3rd UF of the Nordeste region.
  assert.equal(corpus[2]!.setor, "Saúde");
  assert.equal(corpus[2]!.porte, "500–1000");
  assert.equal(corpus[2]!.modelo, "B2B2C");
  assert.equal(corpus[2]!.regiao, "Nordeste");
  assert.equal(corpus[2]!.uf, "CE");
});

test("every company carries all seven indicators as finite numbers", () => {
  for (const company of CORPUS) {
    for (const indicator of INDICATORS) {
      const value = company.indicators[indicator];
      assert.equal(typeof value, "number");
      assert.ok(Number.isFinite(value), `${indicator} should be finite`);
    }
  }
});

test("corpus covers every sector", () => {
  const sectors = new Set(CORPUS.map((c) => c.setor));
  assert.equal(sectors.size, 7);
});

test("each company description mentions its sector and UF", () => {
  for (const company of CORPUS) {
    assert.ok(company.description.includes(company.setor.toLowerCase()));
    assert.ok(company.description.includes(company.uf));
  }
});

test("anonymized names are zero-padded and sequential", () => {
  const corpus = generateCorpus(12);
  assert.equal(corpus[0]!.anonymizedName, "Empresa 001");
  assert.equal(corpus[11]!.anonymizedName, "Empresa 012");
});

test("findClientCompany resolves known ids and rejects unknown ones", () => {
  assert.equal(findClientCompany("client-solipse")!.name, "Solípse Tecnologia");
  assert.equal(findClientCompany("nope"), undefined);
});

test("companyOptions exposes id, name and description for each client", () => {
  const options = companyOptions();
  assert.equal(options.length, CLIENT_COMPANIES.length);
  assert.deepEqual(options[0], {
    id: "client-solipse",
    name: "Solípse Tecnologia",
    description: CLIENT_COMPANIES[0]!.description,
  });
});

test("catalogFromCorpus derives sorted, de-duplicated filter options", () => {
  const catalog = catalogFromCorpus([
    generateCorpus(1, 1)[0]!,
    generateCorpus(1, 1)[0]!, // duplicate -> collapsed
  ]);
  assert.deepEqual(catalog.setores, ["Tecnologia"]);
  assert.equal(new Set(catalog.portes).size, catalog.portes.length);

  const full = catalogFromCorpus();
  assert.equal(full.setores.length, 7); // every sector
  // sorted ascending (pt-BR)
  assert.deepEqual(full.setores, [...full.setores].sort((a, b) => a.localeCompare(b, "pt-BR")));
  assert.ok(full.regioes.includes("Sudeste"));
});
