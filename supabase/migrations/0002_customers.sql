-- Customer registry for Burton NDT — first-class entity with contact info,
-- history, and tags. Quote leads + calibration recalls remain primary
-- sources of truth for those events; this table is the people-and-companies
-- side of the relationship.

set search_path = public;

create table customers (
  id                uuid primary key default gen_random_uuid(),
  email             citext unique not null,
  full_name         text,
  company           text,
  phone             text,
  shipping_address  text,
  internal_notes    text,
  status            text not null default 'active' check (status in (
    'active', 'prospect', 'inactive', 'do_not_contact'
  )),
  source            text,                 -- 'quote_form', 'manual', 'imported', 'recall'
  tags              text[] not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  last_contact_at   timestamptz
);

create trigger customers_set_updated_at
  before update on customers
  for each row execute function set_updated_at();

create index customers_company_idx     on customers (company);
create index customers_status_idx      on customers (status);
create index customers_last_contact    on customers (last_contact_at desc);

alter table customers enable row level security;
-- Admin-only via service_role; no anon policies.

-- Seed from existing quote_leads. Deduplicate by lower(email), pick the
-- most-recent name/company/phone for each.
insert into customers (email, full_name, company, phone, source, last_contact_at)
select distinct on (lower(l.email))
  lower(l.email)              as email,
  l.ordered_by                as full_name,
  l.company                   as company,
  l.phone                     as phone,
  'quote_form'                as source,
  l.created_at                as last_contact_at
from quote_leads l
where l.status != 'spam'
order by lower(l.email), l.created_at desc
on conflict (email) do nothing;

-- Seed from calibration_recalls for any customers not already captured.
insert into customers (email, full_name, company, phone, source, last_contact_at)
select distinct on (lower(r.customer_email))
  lower(r.customer_email)     as email,
  r.customer_name             as full_name,
  r.customer_company          as company,
  null                        as phone,
  'recall'                    as source,
  r.created_at                as last_contact_at
from calibration_recalls r
order by lower(r.customer_email), r.created_at desc
on conflict (email) do nothing;
