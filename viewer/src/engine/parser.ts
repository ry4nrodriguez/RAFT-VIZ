import type { ParsedLog, RaftEvent } from "./types";

function normalizeEvent(raw: Record<string, unknown>): RaftEvent | null {
  if (typeof raw.event !== "string") {
    return null;
  }

  const ts = typeof raw.ts === "number" ? raw.ts : Number(raw.ts ?? 0);
  if (!Number.isFinite(ts)) {
    return null;
  }

  return {
    ...raw,
    event: raw.event,
    ts
  } as RaftEvent;
}

export function parseJsonl(text: string): ParsedLog {
  const warnings: string[] = [];
  const events: RaftEvent[] = [];

  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .forEach((line, index) => {
      if (!line) {
        return;
      }

      try {
        const raw = JSON.parse(line) as Record<string, unknown>;
        const event = normalizeEvent(raw);
        if (!event) {
          warnings.push(`Line ${index + 1} is missing a valid event or timestamp.`);
          return;
        }
        events.push(event);
      } catch (error) {
        warnings.push(`Line ${index + 1} could not be parsed as JSON.`);
      }
    });

  events.sort((left, right) => left.ts - right.ts);

  return { events, warnings };
}

