import { useReplayStore } from "../stores/replayStore";

const SPEEDS = [0.25, 0.5, 1, 2, 5, 10];

export function PlaybackControls() {
  const events = useReplayStore((state) => state.events);
  const activeIndex = useReplayStore((state) => state.activeIndex);
  const isPlaying = useReplayStore((state) => state.isPlaying);
  const speed = useReplayStore((state) => state.speed);
  const setSpeed = useReplayStore((state) => state.setSpeed);
  const togglePlaying = useReplayStore((state) => state.togglePlaying);
  const setActiveIndex = useReplayStore((state) => state.setActiveIndex);
  const step = useReplayStore((state) => state.step);
  const reset = useReplayStore((state) => state.reset);

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-panel)] p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button className="control-button" onClick={reset}>
            Reset
          </button>
          <button className="control-button" onClick={togglePlaying}>
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button className="control-button" onClick={() => step(1)}>
            Step
          </button>
          <div className="text-sm text-[color:var(--text-secondary)]">
            {events.length === 0 ? "0 / 0 events" : `${Math.max(activeIndex + 1, 0)} / ${events.length} events`}
          </div>
        </div>
        <input
          type="range"
          min={events.length > 0 ? 0 : -1}
          max={Math.max(events.length - 1, 0)}
          value={Math.max(activeIndex, 0)}
          onChange={(event) => setActiveIndex(Number(event.target.value))}
        />
        <div className="flex flex-wrap gap-2">
          {SPEEDS.map((candidate) => (
            <button
              key={candidate}
              className={`rounded-full border px-3 py-1 text-sm ${
                speed === candidate
                  ? "border-[color:var(--text-accent)] bg-[color:var(--bg-secondary)] text-[color:var(--text-primary)]"
                  : "border-[color:var(--border)] text-[color:var(--text-secondary)]"
              }`}
              onClick={() => setSpeed(candidate)}
            >
              {candidate}x
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

