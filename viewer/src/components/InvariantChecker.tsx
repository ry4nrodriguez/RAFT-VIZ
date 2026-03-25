import { useReplayStore } from "../stores/replayStore";

export function InvariantChecker() {
  const invariants = useReplayStore((state) => state.replayState.invariants);
  const setActiveIndex = useReplayStore((state) => state.setActiveIndex);

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-panel)] p-4">
      <h2 className="mb-3 text-lg font-semibold text-[color:var(--text-primary)]">Invariant Checker</h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {invariants.map((result) => {
          const colors =
            result.status === "fail"
              ? "border-[color:var(--status-error)] bg-[color:var(--status-error)]/10"
              : result.status === "warn"
                ? "border-[color:var(--status-warn)] bg-[color:var(--status-warn)]/10"
                : "border-[color:var(--status-ok)] bg-[color:var(--status-ok)]/10";

          return (
            <button
              key={result.id}
              onClick={() => {
                if (typeof result.eventIndex === "number") {
                  setActiveIndex(result.eventIndex);
                }
              }}
              className={`rounded-xl border p-4 text-left ${colors}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[color:var(--text-primary)]">{result.title}</span>
                <span className="text-xs uppercase tracking-wide text-[color:var(--text-secondary)]">{result.status}</span>
              </div>
              <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{result.message}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

