-- Execute no Supabase: SQL Editor > New query > Run.
create table if not exists public.docs (
  path text primary key,
  parent text generated always as (regexp_replace(path, '/[^/]+$', '')) stored,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists docs_parent_idx on public.docs(parent);

alter table public.docs enable row level security;
drop policy if exists "publico le conteudo" on public.docs;
drop policy if exists "usuario le o proprio" on public.docs;
drop policy if exists "admin faz tudo" on public.docs;
drop policy if exists "usuario envia o proprio" on public.docs;
drop policy if exists "usuario atualiza o proprio" on public.docs;

-- Conteudo oficial: qualquer visitante le.
create policy "publico le conteudo" on public.docs for select to anon, authenticated
  using (path like 'events/%' or path like 'notices/%' or path like 'faqs/%' or path like 'gallery/%' or path like 'site/%');
-- Perguntas, inscricoes e respostas: cada usuario le so o que e dele.
create policy "usuario le o proprio" on public.docs for select to authenticated
  using ((path like 'inbox/%' or path like 'answers/%') and split_part(path,'/',2) = auth.uid()::text);
-- Administrador (e-mail validado no servidor): le e escreve tudo.
create policy "admin faz tudo" on public.docs for all to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email','')) = 'igortb.zimba@gmail.com') with check (lower(coalesce(auth.jwt() ->> 'email','')) = 'igortb.zimba@gmail.com');
-- Usuario comum: so escreve na propria caixa (inbox/<seu-id>/...).
create policy "usuario envia o proprio" on public.docs for insert to authenticated
  with check (path like 'inbox/%' and split_part(path,'/',2) = auth.uid()::text);
create policy "usuario atualiza o proprio" on public.docs for update to authenticated
  using (path like 'inbox/%' and split_part(path,'/',2) = auth.uid()::text)
  with check (path like 'inbox/%' and split_part(path,'/',2) = auth.uid()::text);

-- Galeria: leitura publica, envio e exclusao so do administrador.
insert into storage.buckets (id, name, public) values ('galeria','galeria', true) on conflict (id) do nothing;
drop policy if exists "galeria admin escreve" on storage.objects;
create policy "galeria admin escreve" on storage.objects for all to authenticated
  using (bucket_id = 'galeria' and lower(coalesce(auth.jwt() ->> 'email','')) = 'igortb.zimba@gmail.com') with check (bucket_id = 'galeria' and lower(coalesce(auth.jwt() ->> 'email','')) = 'igortb.zimba@gmail.com');
