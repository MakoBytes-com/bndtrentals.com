-- Burton NDT Rentals — distributed rate limit + customer audit log
-- Both tables are per-row append-only with auto-cleanup driven by the
-- /api/cron/cleanup route. Indexes target the hot paths.

set search_path = public;

-- ============================================================================
-- rate_limit_log — sliding-window rate-limit counter store
-- ============================================================================
-- Replaces the in-memory token-bucket helper that didn't share state across
-- Vercel function instances. Each request inserts one row; the limiter
-- counts rows in the last `window_ms` for the same bucket_key.
--
-- For Burton's traffic profile (B2B catalog, low volume) the write rate is
-- well under 1/sec even at 100x peak. The auto-cleanup cron deletes rows
-- older than 24 hours so the table stays compact regardless.

create table rate_limit_log (
  id           bigserial primary key,
  bucket_key   text not null,
  occurred_at  timestamptz not null default now()
);

create index rate_limit_log_bucket_idx on rate_limit_log(bucket_key, occurred_at desc);

alter table rate_limit_log enable row level security;

-- Atomic check-and-record. Returns true if request is allowed (and the row
-- is recorded), false if the bucket is over-limit. Two operations folded
-- into one SQL call so the round-trip count drops from 2 to 1 per request.
create or replace function check_and_record_rate(
  p_bucket_key text,
  p_window_ms  integer,
  p_max        integer
) returns boolean
language plpgsql
as $$
declare
  v_count integer;
begin
  select count(*)
    into v_count
    from rate_limit_log
   where bucket_key = p_bucket_key
     and occurred_at > now() - (p_window_ms || ' milliseconds')::interval;

  if v_count >= p_max then
    return false;
  end if;

  insert into rate_limit_log (bucket_key) values (p_bucket_key);
  return true;
end;
$$;

-- ============================================================================
-- customer_audit_log — who-edited-what audit trail on customers
-- ============================================================================
-- Append-only history of every create/update/delete on the customers table.
-- Surfaced in /admin/customers/[id] under "Activity" so admins can answer
-- "who changed this and when."

create table customer_audit_log (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null,           -- not FK: keep history if customer is deleted
  actor_user_id uuid references admin_users(id) on delete set null,
  actor_email   text,                    -- snapshot at time of action
  action        text not null check (action in ('create', 'update', 'delete')),
  changes       jsonb,                   -- field-level diff for updates; full row snapshot for create/delete
  occurred_at   timestamptz not null default now()
);

create index customer_audit_log_customer_idx on customer_audit_log(customer_id, occurred_at desc);
create index customer_audit_log_occurred_idx on customer_audit_log(occurred_at desc);

alter table customer_audit_log enable row level security;
