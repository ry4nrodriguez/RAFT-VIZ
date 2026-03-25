import type { Point } from "../utils/positions";
import type { ServerRole, ServerViewState } from "../engine/types";

interface ServerSpriteProps {
  server: ServerViewState;
  position: Point;
  highlighted: boolean;
  selected: boolean;
  onClick: () => void;
}

const roleColors: Record<ServerRole, { body: string; border: string }> = {
  follower: { body: "var(--follower-bg)", border: "var(--follower-border)" },
  candidate: { body: "var(--candidate-bg)", border: "var(--candidate-border)" },
  leader: { body: "var(--leader-bg)", border: "var(--leader-border)" },
  crashed: { body: "var(--dead-bg)", border: "var(--dead-border)" },
  restarting: { body: "var(--candidate-bg)", border: "var(--text-accent)" },
  unknown: { body: "var(--bg-secondary)", border: "var(--border-accent)" }
};

export function ServerSprite({ server, position, highlighted, selected, onClick }: ServerSpriteProps) {
  const palette = roleColors[server.role];
  const title = server.role.toUpperCase();
  const face = server.role === "crashed" ? "x x" : server.role === "candidate" ? "o o" : "^ ^";
  const mouth = server.role === "crashed" ? "____" : server.role === "leader" ? "\\__/" : "__";

  return (
    <g transform={`translate(${position.x - 44}, ${position.y - 54})`} onClick={onClick} className="cursor-pointer">
      <rect
        x={0}
        y={0}
        width={88}
        height={72}
        rx={18}
        fill={palette.body}
        stroke={highlighted ? "var(--status-error)" : selected ? "var(--text-accent)" : palette.border}
        strokeWidth={selected || highlighted ? 4 : 3}
        opacity={server.role === "restarting" ? 0.82 : 1}
      />
      <rect x={10} y={10} width={68} height={42} rx={12} fill="rgba(10,10,26,0.65)" />
      <text x={24} y={28} fill="white" fontSize={10} fontFamily="var(--font-mono)">
        {face}
      </text>
      <text x={28} y={44} fill="white" fontSize={10} fontFamily="var(--font-mono)">
        {mouth}
      </text>
      <rect x={34} y={72} width={20} height={12} rx={4} fill={palette.border} />
      <rect x={24} y={84} width={40} height={8} rx={4} fill={palette.border} />
      {server.role === "leader" ? (
        <g transform="translate(24,-16)">
          <path d="M0 16 L8 0 L16 10 L24 0 L32 16 Z" fill="#ffcc02" stroke="#7b5d00" strokeWidth={2} />
        </g>
      ) : null}
      <circle cx={72} cy={18} r={5} fill={server.alive ? "#7bff8a" : "#ff4444"} />
      <text x={44} y={108} textAnchor="middle" fill="var(--text-primary)" fontSize={13} fontWeight={700}>
        S{server.id}
      </text>
      <text x={44} y={124} textAnchor="middle" fill="var(--text-secondary)" fontSize={10}>
        {title}
      </text>
      <text x={44} y={138} textAnchor="middle" fill="var(--text-muted)" fontSize={10}>
        term {server.term}
      </text>
    </g>
  );
}

