import { useReplayStore } from "../stores/replayStore";
import { getServerPositions } from "../utils/positions";
import { MessageAnimation } from "./MessageAnimation";
import { ServerSprite } from "./ServerSprite";
import { SpeechBubble } from "./SpeechBubble";

export function Canvas() {
  const replayState = useReplayStore((state) => state.replayState);
  const selectedServer = useReplayStore((state) => state.selectedServer);
  const setSelectedServer = useReplayStore((state) => state.setSelectedServer);
  const width = 820;
  const height = 460;
  const positions = getServerPositions(replayState.numPeers, width, height);
  const leaders = replayState.servers.filter((server) => server.role === "leader");

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-panel)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Cluster Replay</h2>
          <p className="text-sm text-[color:var(--text-secondary)]">Term {Math.max(0, ...replayState.servers.map((server) => server.term))}</p>
        </div>
        <div className="rounded-xl border border-[color:var(--border-accent)] px-3 py-2 text-sm text-[color:var(--text-secondary)]">
          {replayState.currentIndex + 1} / {replayState.visibleEvents.length || 0} processed
        </div>
      </div>
      <div className={`relative overflow-hidden rounded-2xl ${replayState.highlightedServers.length > 0 ? "ring-2 ring-[color:var(--status-error)]" : ""}`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[460px] w-full bg-[color:var(--bg-primary)]">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--grid)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={width} height={height} fill="url(#grid)" />
          {positions.map((from, fromIndex) =>
            positions.map((to, toIndex) => {
              if (toIndex <= fromIndex) {
                return null;
              }
              const active = leaders.some((leader) => leader.id === fromIndex || leader.id === toIndex);
              return (
                <line
                  key={`${fromIndex}-${toIndex}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={active ? "rgba(136,170,255,0.45)" : "rgba(80,90,140,0.28)"}
                  strokeDasharray={active ? "0" : "8 10"}
                  strokeWidth={active ? 2.5 : 1.5}
                />
              );
            })
          )}

          {replayState.messages.map((message) => (
            <MessageAnimation key={message.id} message={message} points={positions} currentTs={replayState.currentTs} />
          ))}

          {replayState.servers.map((server) => (
            <g key={server.id}>
              <ServerSprite
                server={server}
                position={positions[server.id]}
                highlighted={replayState.highlightedServers.includes(server.id)}
                selected={selectedServer === server.id}
                onClick={() => setSelectedServer(selectedServer === server.id ? null : server.id)}
              />
              {server.speech ? <SpeechBubble speech={server.speech} point={positions[server.id]} /> : null}
            </g>
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_50%,transparent_50%)] bg-[length:100%_6px] opacity-15" />
      </div>
    </section>
  );
}
