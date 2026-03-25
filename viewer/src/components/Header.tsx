import type { StoreSource } from "../engine/types";

interface HeaderProps {
  source: StoreSource;
}

export function Header({ source }: HeaderProps) {
  return (
    <header className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-panel)] px-5 py-4 shadow-[0_0_30px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-lg text-[color:var(--text-accent)]">RAFTVIZ</p>
          <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
            Replay your real Raft cluster, not a toy simulation.
          </p>
        </div>
        <div className="rounded-xl border border-[color:var(--border-accent)] bg-black/20 px-4 py-3 text-sm">
          <div className="font-semibold text-[color:var(--text-primary)]">{source.label}</div>
          {source.banner ? <div className="mt-1 text-[color:var(--text-secondary)]">{source.banner}</div> : null}
        </div>
      </div>
    </header>
  );
}
