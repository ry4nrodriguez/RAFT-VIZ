import type { Point } from "../utils/positions";
import type { SpeechBubbleState } from "../engine/types";

interface SpeechBubbleProps {
  speech: SpeechBubbleState;
  point: Point;
}

export function SpeechBubble({ speech, point }: SpeechBubbleProps) {
  const fill =
    speech.level === "error" ? "rgba(255,68,68,0.9)" : speech.level === "warn" ? "rgba(255,204,2,0.9)" : "rgba(20,24,48,0.95)";

  return (
    <g transform={`translate(${point.x - 48}, ${point.y - 98})`}>
      <rect width={96} height={34} rx={12} fill={fill} stroke="var(--border-accent)" />
      <path d="M40 34 L48 44 L56 34" fill={fill} stroke="var(--border-accent)" />
      <text x={48} y={21} textAnchor="middle" fill="white" fontSize={11} fontWeight={700}>
        {speech.text}
      </text>
    </g>
  );
}

