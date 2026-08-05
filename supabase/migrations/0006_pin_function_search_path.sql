-- Pin the search_path on our two functions that were missing it.
--
-- Flagged by Supabase's security advisor (Aug 2026) as
-- function_search_path_mutable. Without an explicit setting, an unqualified
-- name inside the function body resolves against whatever search_path the
-- caller happens to have. check_and_record_rate() is the rate limiter that
-- stands in front of the quote form, so it is worth removing that variable.
--
-- Not changed: the citext extension living in the public schema, also flagged.
-- citext is the column type on admin_users.email, customers.email,
-- login_attempts.email, quote_leads.email and calibration_recalls
-- .customer_email. Relocating an extension that live column types depend on
-- risks breaking type resolution on those tables, which is a real outage in
-- exchange for a namespace-hygiene warning. It stays where it is.

alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.check_and_record_rate(text, integer, integer) set search_path = public, pg_temp;
