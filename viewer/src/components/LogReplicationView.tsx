import { useReplayStore } from "../stores/replayStore";

export function LogReplicationView() {
  const replayState = useReplayStore((state) => state.replayState);
  const maxCells = Math.max(
    replayState.commitIndex,
    ...replayState.servers.map((server) => Math.max(server.approxLogLength, server.commitCells.length))
  );
  const leaderIds = replayState.servers.filter((server) => server.role === "leader").map((server) => server.id);

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-panel)] p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Log Replication View</h2>
          <p className="text-sm text-[color:var(--text-secondary)]">
            Committed entries are exact. Uncommitted cells are approximate based on append traffic.
          </p>
        </div>
        {replayState.approximate ? (
          <span className="rounded-full border border-[color:var(--status-warn)] px-3 py-1 text-xs text-[color:var(--status-warn)]">
            Approximate
          </span>
        ) : null}
      </div>
      <div className="space-y-4">
        {replayState.servers.map((server) => {
          const cells = [];
          for (let index = 1; index <= maxCells; index++) {
            const commit = server.commitCells.find((cell) => cell.index === index);
            if (commit) {
              cells.push(
                <div
                  key={`${server.id}-${index}`}
                  className="min-w-[92px] rounded-lg border border-[color:var(--leader-border)] bg-[color:var(--leader-bg)]/25 px-2 py-2 text-xs text-[color:var(--text-primary)]"
                  title={commit.command}
                >
                  <div className="font-semibold">#{index}</div>
                  <div className="truncate">{commit.command}</div>
                </div>
              );
            } else if (index <= server.approxLogLength) {
              cells.push(
                <div
                  key={`${server.id}-${index}`}
                  className="min-w-[92px] rounded-lg border border-dashed border-[color:var(--status-warn)] bg-[color:var(--status-warn)]/10 px-2 py-2 text-xs text-[color:var(--text-secondary)]"
                >
                  <div className="font-semibold">~#{index}</div>
                  <div>in flight</div>
                </div>
              );
            } else {
              cells.push(
                <div
                  key={`${server.id}-${index}`}
                  className="min-w-[92px] rounded-lg border border-[color:var(--border)] bg-black/15 px-2 py-2 text-xs text-[color:var(--text-muted)]"
                >
                  <div className="font-semibold">#{index}</div>
                  <div>empty</div>
                </div>
              );
            }
          }

          return (
            <div key={server.id}>
              <div className="mb-2 flex items-center gap-3">
                <div className="w-14 font-semibold text-[color:var(--text-primary)]">S{server.id}</div>
                <div className="text-xs text-[color:var(--text-secondary)]">
                  {leaderIds.includes(server.id) ? "leader" : server.role}
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">{cells}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

