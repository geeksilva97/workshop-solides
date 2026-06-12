--
-- PostgreSQL database dump
--

\restrict dDTxlUC0o10dtoKsZ9R16QjPspoxcJuCT7O22sCOUskRvqye8Wub8LQiBWYjwQB

-- Dumped from database version 17.10 (Debian 17.10-1.pgdg13+1)
-- Dumped by pg_dump version 17.10 (Debian 17.10-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: benchmarks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.benchmarks (
    id text NOT NULL,
    user_id text NOT NULL,
    company_id text NOT NULL,
    status text NOT NULL,
    created_at text NOT NULL,
    filters jsonb NOT NULL,
    indicators jsonb NOT NULL,
    summary jsonb NOT NULL,
    benchmark jsonb,
    diagnostic jsonb
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id text NOT NULL,
    name text NOT NULL,
    anonymized_name text NOT NULL,
    description text NOT NULL,
    setor text NOT NULL,
    porte text NOT NULL,
    uf text NOT NULL,
    regiao text NOT NULL,
    modelo text NOT NULL,
    indicators jsonb NOT NULL
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    token text NOT NULL,
    user_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    company text NOT NULL,
    salt text NOT NULL,
    hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.companies VALUES ('client-solipse', 'Solípse Tecnologia', 'Cliente Solípse', 'Empresa de tecnologia com modelo B2B, porte 100–500 funcionários, sediada em SP na região Sudeste.', 'Tecnologia', '100–500', 'SP', 'Sudeste', 'B2B', '{"enps": -5, "absenteismo": 5.2, "tenure_medio": 18, "time_to_hire": 32, "cost_per_hire": 9500, "turnover_voluntario": 28.4, "turnover_involuntario": 8.1}');
INSERT INTO public.companies VALUES ('client-norvik', 'Norvik Saúde', 'Cliente Norvik', 'Empresa de saúde com modelo B2C, porte 500–1000 funcionários, sediada em MG na região Sudeste.', 'Saúde', '500–1000', 'MG', 'Sudeste', 'B2C', '{"enps": 6, "absenteismo": 6.1, "tenure_medio": 20, "time_to_hire": 28, "cost_per_hire": 5200, "turnover_voluntario": 31, "turnover_involuntario": 12}');
INSERT INTO public.companies VALUES ('client-atlas', 'Atlas Indústria', 'Cliente Atlas', 'Empresa de indústria com modelo B2B, porte 500–1000 funcionários, sediada em PR na região Sul.', 'Indústria', '500–1000', 'PR', 'Sul', 'B2B', '{"enps": 18, "absenteismo": 3.6, "tenure_medio": 42, "time_to_hire": 47, "cost_per_hire": 5800, "turnover_voluntario": 16.5, "turnover_involuntario": 8}');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES ('eb15bb83-e866-4367-b4be-f292c21a693a', 'Ana Souza', 'ana@solides.com', 'Solídes', 'add18d682f13b6f3a07decabfc23c81a', '616ffea46f076ef566fd99ddfc0e3914d8b7d2fe83ce1c45f9a3a68dcfc5c80a54d833f5c6a91206b0d73fcd4f404cb3ca076459bd3fc0cfc1930c163838b3c3', '2026-06-12 17:11:00.723929+00');
INSERT INTO public.users VALUES ('ea381d95-06ba-422d-893e-b6c3d5c2bf51', 'Bruno Lima', 'bruno@acme.com', 'Acme', 'e16488fe1bb0d98d664a54b03a5df57a', '4f9955b7c7fac6412e181efe2142e4160b68415fc92fb9d46670b9e150278fe079fd2adba8d6437351a1272c5440b106d7e16273f0a8b6760733b3ce4dfba42d', '2026-06-12 17:11:00.749781+00');


--
-- Name: benchmarks benchmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.benchmarks
    ADD CONSTRAINT benchmarks_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (token);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: benchmarks_user_company_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX benchmarks_user_company_idx ON public.benchmarks USING btree (user_id, company_id, created_at);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_user_id_idx ON public.sessions USING btree (user_id);


--
-- Name: benchmarks benchmarks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.benchmarks
    ADD CONSTRAINT benchmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict dDTxlUC0o10dtoKsZ9R16QjPspoxcJuCT7O22sCOUskRvqye8Wub8LQiBWYjwQB

