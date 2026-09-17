-- Stellar Diary V0.10.7.1 — Core Supabase schema
-- Snapshot of the schema applied manually in Supabase SQL Editor on 2026-09-17.
-- Safe to keep in source control: contains no keys or passwords.

begin;

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  sex text not null default 'unspecified' check (sex in ('male','female','unspecified')),
  locale text not null default 'zh-CN' check (locale in ('zh-CN','zh-TW','en')),
  timezone text not null default 'Asia/Taipei',
  preferences jsonb not null default '{}'::jsonb check (jsonb_typeof(preferences)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (display_name is null or char_length(display_name) between 1 and 50)
);

create table if not exists public.natal_charts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text,
  person_name text,
  calendar_mode text not null default 'solar' check (calendar_mode in ('solar','lunar')),
  birth_date date not null,
  birth_time time,
  birth_time_unknown boolean not null default false,
  birth_timezone text,
  birth_place_label text,
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  input_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(input_snapshot)='object'),
  chart_payload jsonb not null check (jsonb_typeof(chart_payload)='object'),
  fingerprint text not null,
  schema_version text not null default '1.0',
  engine_version text,
  is_favorite boolean not null default false,
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint natal_charts_user_fingerprint_unique unique (user_id,fingerprint),
  constraint natal_charts_id_user_unique unique (id,user_id)
);

create table if not exists public.synastry_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text,
  relationship_type text not null default 'dating',
  chart_a_id uuid references public.natal_charts(id) on delete set null,
  chart_b_id uuid references public.natal_charts(id) on delete set null,
  person_a jsonb not null check (jsonb_typeof(person_a)='object'),
  person_b jsonb not null check (jsonb_typeof(person_b)='object'),
  comparison_payload jsonb not null check (jsonb_typeof(comparison_payload)='object'),
  scores jsonb not null default '{}'::jsonb check (jsonb_typeof(scores)='object'),
  fingerprint text not null,
  schema_version text not null default '1.0',
  engine_version text,
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint synastry_user_fingerprint_unique unique (user_id,fingerprint),
  constraint synastry_id_user_unique unique (id,user_id)
);

create table if not exists public.ai_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_type text not null check (report_type in ('natal','synastry')),
  natal_chart_id uuid,
  synastry_report_id uuid,
  source_fingerprint text not null,
  source_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(source_snapshot)='object'),
  prompt_version text not null,
  report_schema_version text not null default '1.0',
  language text not null default 'zh-CN' check (language in ('zh-CN','zh-TW','en')),
  model_provider text,
  model_name text,
  status text not null default 'queued' check (status in ('queued','generating','completed','failed')),
  report_json jsonb check (report_json is null or jsonb_typeof(report_json)='object'),
  report_text text,
  error_message text,
  tokens_input integer check (tokens_input is null or tokens_input>=0),
  tokens_output integer check (tokens_output is null or tokens_output>=0),
  generation_meta jsonb not null default '{}'::jsonb check (jsonb_typeof(generation_meta)='object'),
  idempotency_key text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_reports_source_type_check check (
    (report_type='natal' and natal_chart_id is not null and synastry_report_id is null)
    or (report_type='synastry' and synastry_report_id is not null and natal_chart_id is null)
  ),
  constraint ai_reports_natal_owner_fk foreign key (natal_chart_id,user_id)
    references public.natal_charts(id,user_id) on delete cascade,
  constraint ai_reports_synastry_owner_fk foreign key (synastry_report_id,user_id)
    references public.synastry_reports(id,user_id) on delete cascade
);

create table if not exists public.fortune_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fortune_date date not null,
  fortune_id smallint not null check (fortune_id between 1 and 60),
  timezone text not null default 'Asia/Taipei',
  language text not null default 'zh-CN' check (language in ('zh-CN','zh-TW','en')),
  fortune_snapshot jsonb not null check (jsonb_typeof(fortune_snapshot)='object'),
  bark_sent_at timestamptz,
  drawn_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fortune_one_per_user_per_day unique (user_id,fortune_date)
);

create table if not exists public.tarot_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  spread_id text not null,
  topic text,
  question text,
  person_a_name text,
  person_b_name text,
  card_count smallint not null check (card_count between 1 and 10),
  cards jsonb not null check (jsonb_typeof(cards)='array'),
  story text,
  structure jsonb not null default '{}'::jsonb check (jsonb_typeof(structure)='object'),
  final_advice text,
  reading_snapshot jsonb not null check (jsonb_typeof(reading_snapshot)='object'),
  fingerprint text,
  language text not null default 'zh-CN' check (language in ('zh-CN','zh-TW','en')),
  reading_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tarot_question_length check (question is null or char_length(question)<=160)
);

create index if not exists idx_natal_charts_user_created on public.natal_charts (user_id,created_at desc);
create index if not exists idx_natal_charts_user_favorite on public.natal_charts (user_id,is_favorite) where is_favorite=true;
create index if not exists idx_synastry_user_created on public.synastry_reports (user_id,created_at desc);
create index if not exists idx_synastry_relationship_type on public.synastry_reports (user_id,relationship_type);
create index if not exists idx_ai_reports_user_created on public.ai_reports (user_id,created_at desc);
create index if not exists idx_ai_reports_status on public.ai_reports (status,created_at);
create unique index if not exists idx_ai_reports_idempotency on public.ai_reports (user_id,idempotency_key) where idempotency_key is not null;
create unique index if not exists idx_ai_reports_completed_cache on public.ai_reports (user_id,report_type,source_fingerprint,prompt_version,report_schema_version,language) where status='completed';
create index if not exists idx_fortune_user_date on public.fortune_history (user_id,fortune_date desc);
create index if not exists idx_tarot_user_reading_at on public.tarot_history (user_id,reading_at desc);
create unique index if not exists idx_tarot_user_fingerprint on public.tarot_history (user_id,fingerprint) where fingerprint is not null;

create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end;
$$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','natal_charts','synastry_reports','ai_reports','fortune_history','tarot_history']
  LOOP
    EXECUTE format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    EXECUTE format('create trigger trg_%I_updated_at before update on public.%I for each row execute function private.set_updated_at()', t, t);
  END LOOP;
END $$;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.profiles(id,display_name)
  values(new.id,nullif(left(trim(coalesce(new.raw_user_meta_data->>'display_name','')),50),''))
  on conflict(id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

insert into public.profiles(id,display_name)
select u.id,nullif(left(trim(coalesce(u.raw_user_meta_data->>'display_name','')),50),'')
from auth.users u on conflict(id) do nothing;

alter table public.profiles enable row level security;
alter table public.natal_charts enable row level security;
alter table public.synastry_reports enable row level security;
alter table public.ai_reports enable row level security;
alter table public.fortune_history enable row level security;
alter table public.tarot_history enable row level security;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists natal_charts_own_rows on public.natal_charts;
drop policy if exists synastry_reports_own_rows on public.synastry_reports;
drop policy if exists ai_reports_select_own on public.ai_reports;
drop policy if exists ai_reports_delete_own on public.ai_reports;
drop policy if exists fortune_history_own_rows on public.fortune_history;
drop policy if exists tarot_history_own_rows on public.tarot_history;

create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid())=id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
create policy natal_charts_own_rows on public.natal_charts for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy synastry_reports_own_rows on public.synastry_reports for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy ai_reports_select_own on public.ai_reports for select to authenticated using ((select auth.uid())=user_id);
create policy ai_reports_delete_own on public.ai_reports for delete to authenticated using ((select auth.uid())=user_id);
create policy fortune_history_own_rows on public.fortune_history for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy tarot_history_own_rows on public.tarot_history for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

grant usage on schema public to authenticated,service_role;
revoke all on table public.profiles from public,anon,authenticated;
revoke all on table public.natal_charts from public,anon,authenticated;
revoke all on table public.synastry_reports from public,anon,authenticated;
revoke all on table public.ai_reports from public,anon,authenticated;
revoke all on table public.fortune_history from public,anon,authenticated;
revoke all on table public.tarot_history from public,anon,authenticated;

grant select,update on table public.profiles to authenticated;
grant select,insert,update,delete on table public.natal_charts to authenticated;
grant select,insert,update,delete on table public.synastry_reports to authenticated;
grant select,delete on table public.ai_reports to authenticated;
grant select,insert,update,delete on table public.fortune_history to authenticated;
grant select,insert,update,delete on table public.tarot_history to authenticated;
grant all privileges on table public.profiles,public.natal_charts,public.synastry_reports,public.ai_reports,public.fortune_history,public.tarot_history to service_role;

revoke all on function private.set_updated_at() from public,anon,authenticated;
revoke all on function private.handle_new_user() from public,anon,authenticated;

commit;
