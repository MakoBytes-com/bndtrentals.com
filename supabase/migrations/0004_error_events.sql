-- Burton NDT Rentals — error_events
-- Mirrors the Mako fleet pattern (bishopbend etc.). Catches runtime
-- exceptions from server code and React error boundaries before they reach
-- Sentry — useful for triage even when SENTRY_DSN isn't provisioned.

set search_path = public;

create table error_events (
  id           uuid primary key default gen_random_uuid(),
  level        text not null check (level in ('error', 'warn')),
  module       text not null,
  message      text not null,
  fingerprint  text not null,
  stack        text,
  path         text,
  user_agent   text,
  context      jsonb,
  resolved_at  timestamptz,
  resolved_by  uuid references admin_users(id) on delete set null,
  occurred_at  timestamptz not null default now()
);

create index error_events_occurred_idx   on error_events(occurred_at desc);
create index error_events_fingerprint_idx on error_events(fingerprint);
create index error_events_unresolved_idx
  on error_events(occurred_at desc) where resolved_at is null;

alter table error_events enable row level security;
