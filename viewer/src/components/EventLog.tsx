import { useReplayStore } from "../stores/replayStore";
import { formatEvent, formatTimestamp } from "../utils/formatters";

const orderedTypes = [
  "state_change",
  "election_timeout",
  "vote_request",
  "vote_granted",
  "vote_denied",
  "append_entries",
  "append_response",
  "commit",
  "crash",
  "restart",
  "custom"
];

export function EventLog() {
  const events = useReplayStore((state) => state.events);
  const activeIndex = useReplayStore((state) => state.activeIndex);
  const activeTypes = useReplayStore((state) => state.activeTypes);
  const selectedServer = useReplayStore((state) => state.selectedServer);
  const search = useReplayStore((state) => state.search);
  const toggleEventType = useReplayStore((state) => state.toggleEventType);
  const setSearch = useReplayStore((state) => state.setSearch);
  const setActiveIndex = useReplayStore((state) => state.setActiveIndex);

  const filtered = events.filter((event) => {
    if (activeTypes[event.event] === false) {
      return false;
    }
    if (
      selectedServer !== null &&
      event.server !== selectedServer &&
      event.from !== selectedServer &&
      event.to !== selectedServer
    ) {
      return false;
    }
    if (!search.trim()) {
      return true;
    }
    return formatEvent(event).toLowerCase().includes(search.toLowerCase());
  });

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-panel)] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Event Log</h2>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search commands"
          className="w-full max-w-52 rounded-xl border border-[color:var(--border-accent)] bg-[color:var(--bg-secondary)] px-3 py-2 text-sm text-[color:var(--text-primary)] outline-none"
        />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {orderedTypes.map((type) => (
          <button
            key={type}
            onClick={() => toggleEventType(type)}
            className={`rounded-full border px-3 py-1 text-xs ${
              activeTypes[type]
                ? "border-[color:var(--text-accent)] bg-[color:var(--bg-secondary)] text-[color:var(--text-primary)]"
                : "border-[color:var(--border)] text-[color:var(--text-muted)]"
            }`}
          >
            {type}
          </button>
        ))}
      </div>
      <div className="max-h-[460px] space-y-2 overflow-y-auto pr-2">
        {filtered.map((event, index) => {
          const realIndex = events.indexOf(event);
          const active = realIndex === activeIndex;
          return (
            <button
              key={`${event.ts}-${index}-${event.event}`}
              onClick={() => setActiveIndex(realIndex)}
              className={`w-full rounded-xl border-l-4 px-3 py-3 text-left transition ${
                active
                  ? "border-[color:var(--text-accent)] bg-[color:var(--bg-secondary)]"
                  : event.event === "crash"
                    ? "border-[color:var(--status-error)] bg-white/[0.02]"
                    : event.event === "state_change" && event.to_state === "leader"
                      ? "border-[color:var(--msg-vote-request)] bg-white/[0.02]"
                      : "border-[color:var(--border)] bg-white/[0.01]"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-[color:var(--text-secondary)]">
                <span>{event.event}</span>
                <span>{formatTimestamp(event.ts)}</span>
              </div>
              <div className="mt-2 text-sm text-[color:var(--text-primary)]">{formatEvent(event)}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

