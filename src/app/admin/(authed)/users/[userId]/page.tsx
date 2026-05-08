import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth/session";
import { UserEditForm } from "./UserEditForm";
import type { AdminUser } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Edit user",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function UserEditPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const session = await getAdminSession();
  const supa = getAdminSupabase();
  const { data, error } = await supa
    .from("admin_users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) notFound();
  const user = data as AdminUser;
  const isMe = user.id === session.userId;

  return (
    <div>
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-brand"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        All users
      </Link>

      <div className="mt-4">
        <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
          User
          {isMe && (
            <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-brand">
              You
            </span>
          )}
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold">{user.full_name}</h1>
        <p className="mt-1 text-[12.5px] text-muted-soft">
          <code className="font-mono">{user.email}</code>
          {" · "}created {fmtDate(user.created_at)}
        </p>
      </div>

      <UserEditForm initial={user} isSelf={isMe} />

      <section className="mt-8 rounded-2xl border border-line bg-canvas-tint p-5 text-[12.5px] text-muted">
        <p>
          <strong className="text-ink">Last login:</strong> {fmtDate(user.last_login_at)}
        </p>
        <p className="mt-1">
          <strong className="text-ink">Two-factor:</strong>{" "}
          {user.totp_enrolled ? "enrolled" : "not set up"}
        </p>
        <p className="mt-1">
          <strong className="text-ink">Password status:</strong>{" "}
          {user.must_change_password ? "must change on next sign-in" : "active"}
        </p>
        <p className="mt-1 text-[11.5px] text-muted-soft">
          User ID: <code className="font-mono">{user.id}</code>
        </p>
      </section>
    </div>
  );
}
