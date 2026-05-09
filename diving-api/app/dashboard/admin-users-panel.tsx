import {
  createAdminUserAction,
  deleteAdminUserAction,
  updateAdminUserAction,
} from "@/app/admin-users/actions";

type AdminRole = "SUPER_ADMIN" | "MANAGER" | "EDITOR" | "STAFF";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  adminRole: AdminRole | null;
  createdAt: Date;
};

const managedRoles = [
  { value: "MANAGER", label: "Manager" },
  { value: "EDITOR", label: "Editor" },
  { value: "STAFF", label: "Staff" },
] as const;

function roleLabel(role: AdminRole | null) {
  if (role === "SUPER_ADMIN") return "Super admin";
  if (role === "MANAGER") return "Manager";
  if (role === "EDITOR") return "Editor";
  if (role === "STAFF") return "Staff";
  return "Unassigned";
}

function RoleSelect({
  name,
  defaultValue,
  form,
}: {
  name: string;
  defaultValue?: Exclude<AdminRole, "SUPER_ADMIN">;
  form?: string;
}) {
  return (
    <select
      name={name}
      form={form}
      defaultValue={defaultValue || "STAFF"}
      className="h-9 rounded-md border border-white/10 bg-[#101010] px-3 text-sm font-medium text-zinc-100 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-white/10"
    >
      {managedRoles.map((role) => (
        <option key={role.value} value={role.value}>
          {role.label}
        </option>
      ))}
    </select>
  );
}

function FieldInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-9 rounded-md border border-white/10 bg-[#101010] px-3 text-sm font-medium text-zinc-100 outline-none transition placeholder:font-normal placeholder:text-zinc-600 focus:border-zinc-400 focus:ring-2 focus:ring-white/10 ${className}`}
    />
  );
}

export function AdminUsersPanel({
  users,
  canManageAdmins,
}: {
  users: AdminUser[];
  canManageAdmins: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-white/10 bg-[#151515] shadow-xl shadow-black/30">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-xs font-medium text-zinc-500">Access control</p>
          <h2 className="mt-1 text-base font-semibold text-white">
            Admin users
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Super admins manage manager, editor, and staff accounts.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-zinc-300">
          {users.length} total
        </span>
      </div>

      {canManageAdmins ? (
        <form
          action={createAdminUserAction}
          className="grid gap-3 border-b border-white/10 bg-black/10 px-5 py-4 lg:grid-cols-[1fr_1.2fr_150px_auto]"
        >
          <FieldInput name="name" required placeholder="Full name" />
          <FieldInput
            name="email"
            type="email"
            required
            placeholder="admin@example.com"
          />
          <RoleSelect name="adminRole" />
          <button
            type="submit"
            className="h-9 rounded-md bg-zinc-100 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-white"
          >
            Add Admin
          </button>
        </form>
      ) : (
        <div className="border-b border-white/10 bg-black/10 px-5 py-4 text-sm text-zinc-500">
          Admin management is available to super admins.
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-white/10 text-xs text-zinc-300">
            <tr>
              <th className="w-11 px-5 py-3 font-medium">
                <span className="block size-4 rounded border border-white/15" />
              </th>
              <th className="px-3 py-3 font-medium">Name</th>
              <th className="px-3 py-3 font-medium">Email</th>
              <th className="px-3 py-3 font-medium">Role</th>
              <th className="px-3 py-3 font-medium">Created</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {users.map((user) => {
              const canEdit = canManageAdmins && user.adminRole !== "SUPER_ADMIN";

              return (
                <tr key={user.id} className="transition hover:bg-white/[0.03]">
                  <td className="px-5 py-3">
                    <span className="block size-4 rounded border border-white/15" />
                  </td>
                  {canEdit ? (
                    <>
                      <td className="px-3 py-3">
                        <form
                          id={`update-admin-${user.id}`}
                          action={updateAdminUserAction}
                          className="contents"
                        >
                          <input type="hidden" name="id" value={user.id} />
                          <FieldInput
                            name="name"
                            defaultValue={user.name}
                            required
                            className="w-full"
                          />
                        </form>
                      </td>
                      <td className="px-3 py-3">
                        <FieldInput
                          form={`update-admin-${user.id}`}
                          name="email"
                          type="email"
                          defaultValue={user.email}
                          required
                          className="w-full"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <RoleSelect
                          name="adminRole"
                          form={`update-admin-${user.id}`}
                          defaultValue={
                            user.adminRole === "MANAGER" ||
                            user.adminRole === "EDITOR" ||
                            user.adminRole === "STAFF"
                              ? user.adminRole
                              : "STAFF"
                          }
                        />
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-3 font-medium text-zinc-100">
                        {user.name}
                      </td>
                      <td className="px-3 py-3 text-zinc-400">{user.email}</td>
                      <td className="px-3 py-3">
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-zinc-300">
                          {roleLabel(user.adminRole)}
                        </span>
                      </td>
                    </>
                  )}
                  <td className="px-3 py-3 text-zinc-500">
                    {user.createdAt.toLocaleDateString("en", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3">
                    {canEdit ? (
                      <div className="flex justify-end gap-2">
                        <button
                          type="submit"
                          form={`update-admin-${user.id}`}
                          className="h-9 rounded-md border border-white/10 bg-white/[0.03] px-3 text-sm font-medium text-zinc-200 transition hover:bg-white/10"
                        >
                          Save
                        </button>
                        <form action={deleteAdminUserAction}>
                          <input type="hidden" name="id" value={user.id} />
                          <button
                            type="submit"
                            className="h-9 rounded-md border border-red-400/20 bg-red-500/10 px-3 text-sm font-medium text-red-200 transition hover:bg-red-500/20"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="text-right text-zinc-600">...</div>
                    )}
                  </td>
                </tr>
              );
            })}
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-sm text-zinc-500"
                >
                  No manager, editor, or staff admins have been added yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
