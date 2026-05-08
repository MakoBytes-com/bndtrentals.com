-- Burton NDT Rentals — in-house analytics tables
-- Mirrors the Mako fleet pattern (page_views + analytics_events) used on
-- bishopbend.com, makobot.com, etc. Server-side filters bots via `isbot`
-- before insert, so totals reflect real human traffic.
--
-- Reads happen from /admin/analytics via the service-role key. RLS is on,
-- no anon policies — the public site only writes via the /api/pv and
-- /api/event routes (which run server-side with the admin client).

set search_path = public;

-- ============================================================================
-- page_views — one row per SPA navigation
-- ============================================================================

create table page_views (
  id          uuid primary key default gen_random_uuid(),
  path        text not null,
  referrer    text,
  user_agent  text,
  session_id  text not null,
  ip          text,
  country     text,
  created_at  timestamptz not null default now()
);

create index page_views_created_idx on page_views(created_at desc);
create index page_views_path_idx on page_views(path);
create index page_views_session_idx on page_views(session_id);

alter table page_views enable row level security;

-- ============================================================================
-- analytics_events — named events (CTA clicks, web vitals, etc.)
-- ============================================================================

create table analytics_events (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  path        text not null,
  session_id  text not null,
  data        jsonb,
  created_at  timestamptz not null default now()
);

create index analytics_events_created_idx on analytics_events(created_at desc);
create index analytics_events_name_idx on analytics_events(name);
create index analytics_events_session_idx on analytics_events(session_id);

alter table analytics_events enable row level security;
