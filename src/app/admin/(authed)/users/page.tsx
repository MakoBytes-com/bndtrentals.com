import type { Metadata } from "next";
import Link from "next/link";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Users",
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

export default async function UsersListPage() {
  const session = await getAdminSession();
  const supa = getAdminSupabase();

  const { data: users, error } = await supa
    .from("admin_users")
    .select("id, email, full_name, role, totp_enrolled, must_change_password, last_login_at, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <div className="rounded-xl border border-accent/40 bg-accent/5 p-5">
        <p className="font-bold text-accent">Could not load users.</p>
        <p className="mt-1 text-[13px] text-muted">{error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-widest text-accent">
            Account
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold">Users</h1>
          <p className="mt-2 text-[14.5px] text-muted">
            {users?.length ?? 0} admin user{users?.length === 1 ? "" : "s"}.
            Click any row to manage.
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[14px] font-bold text-white hover:bg-accent-dark"
        >
          + Invite user
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
        {users && users.length > 0 ? (
          <table className="w-full text-[14px]">
            <thead className="bg-canvas-tint text-[12px] font-bold uppercase tracking-widest text-muted">
              <tr>
                <th className="px-5 py-3 text-left">User</th>
                <th className="px-5 py-3 text-left">Role</th>
                <th className="px-5 py-3 text-left">Two-factor</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Last login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => {
                const isMe = u.id === session.userId;
                return (
                  <tr key={u.id} className="hover:bg-canvas-tint/50">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="block font-semibold text-ink hover:text-brand"
                      >
                        {u.full_name}
                        {isMe && (
                          <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-brand">
                            You
                          </span>
                        )}
                      </Link>
                      <p className="text-[12.5px] text-muted-soft">{u.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-bold uppercase tracking-wider ${
                          u.role === "admin"
                            ? "bg-brand/10 text-brand ring-1 ring-brand/20"
                            : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[13.5px]">
                      {u.totp_enrolled ? (
                        <span className="text-emerald-700 font-semibold">✓ enrolled</span>
                      ) : (
                        <span className="text-muted-soft">not set up</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-[12.5px]">
                      {u.must_change_password ? (
                        <span className="text-amber-700 font-semibold">
                          must change password
                        </span>
                      ) : (
                        <span className="text-muted">active</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right text-[12.5px] text-muted">
                      {fmtDate(u.last_login_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="text-[15px] font-semibold">No admin users yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
