import type { InvariantResult, RaftEvent } from "../engine/types";

export function formatEvent(event: RaftEvent) {
  switch (event.event) {
    case "init":
      return `Cluster initialized with ${event.num_peers ?? "?"} peers`;
    case "state_change":
      return `S${event.server} ${event.from_state ?? "?"} -> ${event.to_state} (term ${event.term ?? "?"})`;
    case "election_timeout":
      return `S${event.server} election timeout in term ${event.term ?? "?"}`;
    case "vote_request":
      return `S${event.from} asked S${event.to} for a vote in term ${event.term ?? "?"}`;
    case "vote_granted":
      return `S${event.from} granted S${event.to} a vote in term ${event.term ?? "?"}`;
    case "vote_denied":
      return `S${event.from} denied S${event.to} a vote in term ${event.term ?? "?"}`;
    case "append_entries":
      return Number(event.entry_count ?? 0) > 0
        ? `S${event.from} sent ${event.entry_count} log entr${Number(event.entry_count) === 1 ? "y" : "ies"} to S${event.to}`
        : `S${event.from} heartbeat to S${event.to}`;
    case "append_response":
      return `S${event.from} replied ${event.success ? "ACK" : "NACK"} to S${event.to}`;
    case "commit":
      return `S${event.server} committed index ${event.index}: ${stringifyValue(event.command)}`;
    case "crash":
      return `S${event.server} crashed`;
    case "restart":
      return `S${event.server} restarted`;
    default:
      return `${event.event}: ${stringifyValue(event.detail ?? "")}`;
  }
}

export function formatTimestamp(ts: number) {
  return `${ts.toString().padStart(5, "0")}ms`;
}

export function stringifyValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }
  if (value === null || value === undefined) {
    return "null";
  }
  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
}

export function formatInvariant(result: InvariantResult) {
  return `${result.title}: ${result.message}`;
}

