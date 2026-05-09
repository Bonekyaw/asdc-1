import Link from "next/link";
import { AdminUsersPanel } from "./admin-users-panel";
import { PlayerUsersPanel } from "./player-users-panel";
import { SignOutButton } from "./sign-out-button";

type AdminRole = "SUPER_ADMIN" | "MANAGER" | "EDITOR" | "STAFF";
type DashboardSection = "dashboard" | "admins" | "players";

type CurrentAdmin = {
  name: string;
  email: string;
  adminRole: AdminRole | null;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  adminRole: AdminRole | null;
  createdAt: Date;
};

type PlayerUser = {
  id: string;
  name: string;
  email: string;
  currentScore: number;
  highestScore: number;
  currentLevel: number;
  createdAt: Date;
  playerBanUntil: Date | null;
};

function roleLabel(role: AdminRole | null) {
  if (role === "SUPER_ADMIN") return "Super admin";
  if (role === "MANAGER") return "Manager";
  if (role === "EDITOR") return "Editor";
  if (role === "STAFF") return "Staff";
  return "Admin";
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "DA"
  );
}

function metricTone(index: number) {
  const tones = [
    "from-teal-400/10",
    "from-sky-400/10",
    "from-violet-400/10",
    "from-rose-400/10",
  ];

  return tones[index] || tones[0];
}

export function Dashboard({
  currentAdmin,
  adminUsers,
  playerUsers,
  activeSection,
  nowMs,
}: {
  currentAdmin: CurrentAdmin;
  adminUsers: AdminUser[];
  playerUsers: PlayerUser[];
  activeSection: DashboardSection;
  nowMs: number;
}) {
  const canManageAdmins = currentAdmin.adminRole === "SUPER_ADMIN";
  const canModeratePlayers =
    Boolean(currentAdmin.adminRole) && currentAdmin.adminRole !== "STAFF";
  const managedAdmins = adminUsers.filter(
    (user) => user.adminRole !== "SUPER_ADMIN",
  ).length;
  const activePlayerBans = playerUsers.filter(
    (user) => user.playerBanUntil && user.playerBanUntil.getTime() > nowMs,
  ).length;
  const sectionDetails = {
    dashboard: {
      title: "Dashboard",
      description:
        "Monitor the current admin role, managed accounts, player volume, and active restrictions.",
    },
    admins: {
      title: "Admin Management",
      description:
        "Manage dashboard access, assign operational roles, and keep admin permissions tidy.",
    },
    players: {
      title: "Player Management",
      description:
        "Review mobile player accounts, score progress, and temporary ban status.",
    },
  } satisfies Record<
    DashboardSection,
    {
      title: string;
      description: string;
    }
  >;
  const activeTitle = sectionDetails[activeSection].title;
  const activeDescription = sectionDetails[activeSection].description;
  const navItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      href: "/?section=dashboard",
      count: metricsCount(managedAdmins, playerUsers.length, activePlayerBans),
      marker: "D",
    },
    {
      key: "admins",
      label: "Admin Management",
      href: "/?section=admins",
      count: adminUsers.length,
      marker: "A",
    },
    {
      key: "players",
      label: "Player Management",
      href: "/?section=players",
      count: playerUsers.length,
      marker: "P",
    },
  ] as const;
  const metrics = [
    {
      label: "Admin Role",
      value: roleLabel(currentAdmin.adminRole),
      detail: "Current dashboard permission",
      trend: canManageAdmins ? "Full access" : "Limited access",
    },
    {
      label: "Managed Admins",
      value: managedAdmins.toString(),
      detail: "Manager, editor, and staff accounts",
      trend: `${adminUsers.length} total`,
    },
    {
      label: "Total Players",
      value: playerUsers.length.toString(),
      detail: "Registered from the mobile app",
      trend: "Read only creation",
    },
    {
      label: "Active Player Bans",
      value: activePlayerBans.toString(),
      detail: "Temporary restrictions in effect",
      trend: canModeratePlayers ? "Moderation enabled" : "View only",
    },
  ];

  return (
    <main className="min-h-dvh bg-[#080808] p-2 text-zinc-100 sm:p-3">
      <div className="mx-auto grid min-h-[calc(100dvh-1rem)] w-full max-w-[1510px] overflow-hidden rounded-lg border border-white/10 bg-[#101010] shadow-2xl shadow-black/60 lg:grid-cols-[288px_1fr]">
        <aside className="flex flex-col border-b border-white/10 bg-[#181818] px-4 py-5 lg:min-h-[calc(100dvh-1.5rem)] lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 px-2">
            <span className="grid size-5 place-items-center rounded-full border border-zinc-300 text-[10px] font-bold text-zinc-100">
              D
            </span>
            <div>
              <p className="text-base font-semibold text-white">
                Diving Admin
              </p>
            </div>
          </div>

          <nav className="mt-6 space-y-1">
            {navItems.map((item) => {
              const active = activeSection === item.key;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex h-10 items-center justify-between rounded-md px-2.5 text-sm transition ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-zinc-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={`grid size-5 shrink-0 place-items-center rounded border text-[11px] font-semibold ${
                        active
                          ? "border-zinc-300 bg-zinc-200 text-zinc-950"
                          : "border-white/15 text-zinc-400"
                      }`}
                    >
                      {item.marker}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-300">
                    {item.count}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-8">
            <p className="px-2 text-xs font-medium text-zinc-500">Overview</p>
            <div className="mt-2 space-y-1">
              <div className="flex h-9 items-center gap-3 rounded-md px-2.5 text-sm text-zinc-300">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                {managedAdmins} managed admins
              </div>
              <div className="flex h-9 items-center gap-3 rounded-md px-2.5 text-sm text-zinc-300">
                <span className="size-1.5 rounded-full bg-sky-400" />
                {playerUsers.length} mobile players
              </div>
              <div className="flex h-9 items-center gap-3 rounded-md px-2.5 text-sm text-zinc-300">
                <span className="size-1.5 rounded-full bg-rose-400" />
                {activePlayerBans} active bans
              </div>
            </div>
          </div>

          <div className="mt-auto pt-8">
            <div className="rounded-md border border-white/10 bg-[#101010] p-3">
              <div className="flex items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-md bg-zinc-800 text-sm font-bold text-zinc-100">
                  {initials(currentAdmin.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {currentAdmin.name}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {currentAdmin.email}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
                <span className="text-xs text-zinc-500">Role</span>
                <span className="text-xs font-medium text-zinc-200">
                  {roleLabel(currentAdmin.adminRole)}
                </span>
              </div>
              <div className="mt-3">
                <SignOutButton />
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 bg-[#0b0b0b]">
          <header className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#090909] px-5 py-3">
            <div className="flex items-center gap-4">
              <span className="grid size-8 place-items-center rounded-md border border-white/10 text-sm text-zinc-300">
                ||
              </span>
              <div>
                <h1 className="text-base font-semibold text-white">
                  {activeTitle}
                </h1>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {activeDescription}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              {roleLabel(currentAdmin.adminRole)}
            </div>
          </header>

          <div className="space-y-6 px-4 py-5 sm:px-6 lg:px-6">
            {activeSection === "dashboard" ? (
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric, index) => (
                  <div
                    key={metric.label}
                    className={`rounded-lg border border-white/10 bg-gradient-to-b ${metricTone(index)} to-[#1d1d1d] p-5 shadow-xl shadow-black/20`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-zinc-500">{metric.label}</p>
                      <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-xs font-medium text-zinc-200">
                        {metric.trend}
                      </span>
                    </div>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-white">
                      {metric.value}
                    </p>
                    <p className="mt-5 text-sm font-medium text-zinc-200">
                      {metric.detail}
                    </p>
                  </div>
                ))}
              </section>
            ) : activeSection === "admins" ? (
              <AdminUsersPanel
                users={adminUsers}
                canManageAdmins={canManageAdmins}
              />
            ) : (
              <PlayerUsersPanel
                users={playerUsers}
                canModeratePlayers={canModeratePlayers}
                nowMs={nowMs}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function metricsCount(
  managedAdmins: number,
  playerCount: number,
  activePlayerBans: number,
) {
  return managedAdmins + playerCount + activePlayerBans;
}
