import {
  banPlayerAction,
  unbanPlayerAction,
} from "@/app/player-users/actions";

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

function formatDate(value: Date) {
  return value.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isActiveBan(value: Date | null, nowMs: number) {
  return Boolean(value && value.getTime() > nowMs);
}

export function PlayerUsersPanel({
  users,
  canModeratePlayers,
  nowMs,
}: {
  users: PlayerUser[];
  canModeratePlayers: boolean;
  nowMs: number;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-white/10 bg-[#151515] shadow-xl shadow-black/30">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-xs font-medium text-zinc-500">Player access</p>
          <h2 className="mt-1 text-base font-semibold text-white">Players</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Mobile app accounts are view-only here. Admins can manage temporary
            ban status.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-zinc-300">
          {users.length} total
        </span>
      </div>

      {!canModeratePlayers ? (
        <div className="border-b border-white/10 bg-black/10 px-5 py-4 text-sm text-zinc-500">
          Staff admins can view players but cannot ban or unban them.
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="bg-white/10 text-xs text-zinc-300">
            <tr>
              <th className="w-11 px-5 py-3 font-medium">
                <span className="block size-4 rounded border border-white/15" />
              </th>
              <th className="px-3 py-3 font-medium">Player</th>
              <th className="px-3 py-3 font-medium">Level</th>
              <th className="px-3 py-3 font-medium">Score</th>
              <th className="px-3 py-3 font-medium">Joined</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {users.map((user) => {
              const banned = isActiveBan(user.playerBanUntil, nowMs);

              return (
                <tr key={user.id} className="transition hover:bg-white/[0.03]">
                  <td className="px-5 py-3">
                    <span className="block size-4 rounded border border-white/15" />
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-zinc-100">{user.name}</p>
                    <p className="mt-1 break-all text-xs text-zinc-500">
                      {user.email}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-zinc-300">
                    {user.currentLevel}
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-medium text-zinc-100">
                      {user.highestScore}
                    </span>
                    <span className="text-zinc-600"> best</span>
                  </td>
                  <td className="px-3 py-3 text-zinc-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-3 py-3">
                    {banned && user.playerBanUntil ? (
                      <span className="rounded-full border border-red-400/20 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-200">
                        Banned until {formatDate(user.playerBanUntil)}
                      </span>
                    ) : (
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-200">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {canModeratePlayers ? (
                      <div className="flex justify-end gap-2">
                        {banned ? (
                          <form action={unbanPlayerAction}>
                            <input type="hidden" name="id" value={user.id} />
                            <button
                              type="submit"
                              className="h-9 rounded-md border border-white/10 bg-white/[0.03] px-3 text-sm font-medium text-zinc-200 transition hover:bg-white/10"
                            >
                              Unban
                            </button>
                          </form>
                        ) : (
                          <form
                            action={banPlayerAction}
                            className="flex justify-end gap-2"
                          >
                            <input type="hidden" name="id" value={user.id} />
                            <select
                              name="banDays"
                              defaultValue="7"
                              className="h-9 rounded-md border border-white/10 bg-[#101010] px-3 text-sm font-medium text-zinc-100 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-white/10"
                            >
                              <option value="1">1 day</option>
                              <option value="7">7 days</option>
                              <option value="14">14 days</option>
                              <option value="30">30 days</option>
                            </select>
                            <button
                              type="submit"
                              className="h-9 rounded-md border border-red-400/20 bg-red-500/10 px-3 text-sm font-medium text-red-200 transition hover:bg-red-500/20"
                            >
                              Ban
                            </button>
                          </form>
                        )}
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
                  colSpan={7}
                  className="px-5 py-12 text-center text-sm text-zinc-500"
                >
                  No mobile app players have registered yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
