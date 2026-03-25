import type { MessageAnimationState } from "../engine/types";
import type { Point } from "../utils/positions";

interface MessageAnimationProps {
  message: MessageAnimationState;
  points: Point[];
  currentTs: number;
}

function interpolate(start: Point, end: Point, progress: number) {
  const midX = (start.x + end.x) / 2;
  const arcHeight = -50;
  const x = (1 - progress) * (1 - progress) * start.x + 2 * (1 - progress) * progress * midX + progress * progress * end.x;
  const y =
    (1 - progress) * (1 - progress) * start.y +
    2 * (1 - progress) * progress * ((start.y + end.y) / 2 + arcHeight) +
    progress * progress * end.y;
  return { x, y };
}

export function MessageAnimation({ message, points, currentTs }: MessageAnimationProps) {
  const start = points[message.from];
  const end = points[message.to];
  if (!start || !end) {
    return null;
  }

  const progress = Math.max(0, Math.min(1, (currentTs - message.startedAt) / message.duration));
  const point = interpolate(start, end, progress);

  return (
    <g transform={`translate(${point.x}, ${point.y})`}>
      <circle r={18} fill={message.color} opacity={0.9} />
      <text textAnchor="middle" dy="0.35em" fill="#08111f" fontSize={10} fontWeight={700}>
        {message.label}
      </text>
    </g>
  );
}
