-- Burton NDT Rentals — initial schema
-- Project: bndt-prod (zgevzjlavbaxpirpautf)
-- Created: 2026-05-07
--
-- Conventions:
-- * RLS is enabled on every table. Server-side code uses the service_role
--   key and bypasses RLS by design; anon-key (browser) only gets the
--   policies explicitly granted below.
-- * Updated-at triggers keep the timestamps honest.
-- * Storage bucket `catalog-pdfs` is created at the bottom; admin uploads
--   via service_role, public can read.
--
-- Phases this enables:
--   Phase 2 — replace mailto with server action that writes quote_leads
--   Phase 3 — admin panel CRUD over catalog/calibration/content/leads
--   Phase 4 — calibration recall cron reads `due_date < now()+30d`

set search_path = public;

-- ============================================================================
-- Common helpers
-- ============================================================================

create extension if not exists "pgcrypto";  -- for gen_random_uuid()
create extension if not exists "citext";    -- case-insensitive emails

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- Auth: admin_users + login_attempts
-- ============================================================================
-- We use iron-session for cookies (encrypted, no DB session row needed) plus
-- bcrypt password hashes + optional TOTP. Sessions don't live in the DB.

create table admin_users (
  id              uuid primary key default gen_random_uuid(),
  email           citext unique not null,
  full_name       text not null,
  password_hash   text not null,
  role            text not null default 'admin' check (role in ('admin','staff')),
  totp_secret     text,                            -- null until TOTP enrolled
  totp_enrolled   boolean not null default false,
  must_change_password boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  last_login_at   timestamptz
);

create trigger admin_users_set_updated_at
  before update on admin_users
  for each row execute function set_updated_at();

create table login_attempts (
  id          bigserial primary key,
  email       citext,
  ip          inet,
  user_agent  text,
  success     boolean not null,
  reason      text,                                -- 'bad_password', 'rate_limited', 'totp_failed'
  created_at  timestamptz not null default now()
);

create index login_attempts_email_created on login_attempts (email, created_at desc);
create index login_attempts_ip_created    on login_attempts (ip, created_at desc);

alter table admin_users    enable row level security;
alter table login_attempts enable row level security;
-- No policies: everything goes through the service_role key from server actions.

-- ============================================================================
-- Public site data: catalog (categories + products)
-- ============================================================================

create table catalog_categories (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  short        text,
  tagline      text,
  description  text,
  hero_image   text,                               -- filename in /public/images
  sort_order   int not null default 0,
  parent_id    uuid references catalog_categories(id) on delete set null,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger catalog_categories_set_updated_at
  before update on catalog_categories
  for each row execute function set_updated_at();

create index catalog_categories_parent on catalog_categories (parent_id);

create table catalog_products (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null,
  category_id     uuid not null references catalog_categories(id) on delete restrict,
  subcategory     text,                            -- inline name (no separate table for now)
  name            text not null,
  manufacturer    text,
  description     text,
  applications    text[] not null default '{}',
  image           text,                            -- filename in /public/images or storage URL
  pdf             text,                            -- filename in /public/pdfs or storage URL
  specs           jsonb not null default '{}'::jsonb,
  is_published    boolean not null default true,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (category_id, slug)
);

create trigger catalog_products_set_updated_at
  before update on catalog_products
  for each row execute function set_updated_at();

create index catalog_products_category    on catalog_products (category_id);
create index catalog_products_published   on catalog_products (is_published) where is_published = true;

alter table catalog_categories enable row level security;
alter table catalog_products   enable row level security;

-- Public read for published rows; admin writes via service_role (bypasses RLS).
create policy catalog_categories_public_read
  on catalog_categories
  for select
  to anon
  using (is_published = true);

create policy catalog_products_public_read
  on catalog_products
  for select
  to anon
  using (is_published = true);

-- ============================================================================
-- Quote leads (incoming from public quote form)
-- ============================================================================

create table quote_leads (
  id              uuid primary key default gen_random_uuid(),
  ordered_by      text,
  company         text,
  email           citext not null,
  phone           text,
  shipping        text,
  date_needed     date,
  duration        text,
  erpp            text,
  po_or_cc        text,
  shipping_account text,
  instructions    text,
  interests       text[] not null default '{}',
  cart            jsonb not null default '[]'::jsonb,    -- snapshot of cart at submission
  source_url      text,                                  -- which page they submitted from
  user_agent      text,
  ip              inet,
  turnstile_ok    boolean,
  status          text not null default 'new' check (status in (
    'new', 'in_progress', 'quoted', 'won', 'lost', 'spam'
  )),
  assigned_to     uuid references admin_users(id) on delete set null,
  internal_notes  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  resolved_at     timestamptz
);

create trigger quote_leads_set_updated_at
  before update on quote_leads
  for each row execute function set_updated_at();

create index quote_leads_status_created on quote_leads (status, created_at desc);
create index quote_leads_email_created  on quote_leads (email, created_at desc);

alter table quote_leads enable row level security;

-- Public anonymous insert (the quote form posts here via server action with
-- service_role, but we also allow anon as a defense-in-depth fallback if a
-- future client-side path needs it). Reads/updates: service_role only.
create policy quote_leads_anon_insert
  on quote_leads
  for insert
  to anon
  with check (true);

-- ============================================================================
-- Calibration recalls
-- ============================================================================

create table calibration_recalls (
  id                 uuid primary key default gen_random_uuid(),
  customer_email     citext not null,
  customer_name      text,
  customer_company   text,
  equipment_ref      text not null,                   -- product slug or free text
  equipment_label    text,                            -- friendly display name
  serial_number      text,
  last_calibrated    date,
  due_date           date not null,
  notification_sent_at timestamptz,                   -- last reminder email
  notification_count int not null default 0,
  status             text not null default 'pending' check (status in (
    'pending', 'reminded', 'overdue', 'completed', 'cancelled'
  )),
  assigned_to        uuid references admin_users(id) on delete set null,
  internal_notes     text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  completed_at       timestamptz
);

create trigger calibration_recalls_set_updated_at
  before update on calibration_recalls
  for each row execute function set_updated_at();

create index calibration_recalls_due       on calibration_recalls (due_date);
create index calibration_recalls_status    on calibration_recalls (status);
create index calibration_recalls_customer  on calibration_recalls (customer_email);

alter table calibration_recalls enable row level security;
-- No public policies; admin-only via service_role.

-- ============================================================================
-- Editable page sections (about copy, team bios, project case studies, etc.)
-- ============================================================================

create table page_sections (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,                -- e.g. 'about-mission', 'team-mark-burton'
  title        text not null,
  body_html    text not null default '',
  metadata     jsonb not null default '{}'::jsonb,  -- arbitrary structured fields per section
  version      int not null default 1,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  published_at timestamptz
);

create trigger page_sections_set_updated_at
  before update on page_sections
  for each row execute function set_updated_at();

create index page_sections_published on page_sections (is_published) where is_published = true;

alter table page_sections enable row level security;

create policy page_sections_public_read
  on page_sections
  for select
  to anon
  using (is_published = true);

-- ============================================================================
-- Storage: catalog-pdfs bucket
-- ============================================================================
-- Bucket creation lives in storage.buckets; policies live in storage.objects.
-- Public read so spec-sheet links work without auth; admin write via
-- service_role (server-side upload from /admin/catalog).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catalog-pdfs',
  'catalog-pdfs',
  true,
  20971520,                                          -- 20 MB per file ceiling
  array['application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Anyone can read PDFs in the bucket (they're spec sheets, public docs).
create policy "catalog_pdfs_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'catalog-pdfs');

-- Storage writes go through the service_role from server actions, so no
-- client-side write policy needed. The bucket itself rejects non-PDF mime
-- types via allowed_mime_types above.
