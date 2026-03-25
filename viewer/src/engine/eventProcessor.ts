import { runInvariantChecks } from "./invariantChecker";
import type {
  CommitCell,
  InvariantResult,
  MessageAnimationState,
  RaftEvent,
  ReplayState,
  ServerRole,
  ServerViewState,
  SpeechBubbleState
} from "./types";

interface MutableServer {
  id: number;
  role: ServerRole;
  term: number;
  alive: boolean;
  approxLogLength: number;
  commitCells: Map<number, CommitCell>;
  speech?: SpeechBubbleState;
  restartUntil?: number;
}

function createServer(id: number): MutableServer {
  return {
    id,
    role: "follower",
    term: 0,
    alive: true,
    approxLogLength: 0,
    commitCells: new Map()
  };
}

function inferNumPeers(events: RaftEvent[]) {
  const initEvent = events.find((event) => event.event === "init" && typeof event.num_peers === "number");
  if (initEvent && typeof initEvent.num_peers === "number") {
    return initEvent.num_peers;
  }

  let highest = 4;
  for (const event of events) {
    const numericValues = [event.server, event.from, event.to].filter((value) => typeof value === "number") as number[];
    for (const value of numericValues) {
      if (value > highest) {
        highest = value;
      }
    }
  }
  return highest + 1;
}

function stringifyCommand(command: unknown) {
  if (typeof command === "string") {
    return command;
  }
  if (command === null || command === undefined) {
    return "null";
  }
  try {
    return JSON.stringify(command);
  } catch (error) {
    return String(command);
  }
}

function messageForEvent(event: RaftEvent): Omit<MessageAnimationState, "id" | "startedAt"> | null {
  switch (event.event) {
    case "vote_request":
      return {
        type: event.event,
        from: Number(event.from),
        to: Number(event.to),
        label: "VOTE?",
        color: "var(--msg-vote-request)",
        duration: 700
      };
    case "vote_granted":
      return {
        type: event.event,
        from: Number(event.from),
        to: Number(event.to),
        label: "YES",
        color: "var(--msg-vote-granted)",
        duration: 650
      };
    case "vote_denied":
      return {
        type: event.event,
        from: Number(event.from),
        to: Number(event.to),
        label: "NO",
        color: "var(--msg-vote-denied)",
        duration: 650
      };
    case "append_entries":
      return {
        type: event.event,
        from: Number(event.from),
        to: Number(event.to),
        label: Number(event.entry_count ?? 0) > 0 ? `LOG×${Number(event.entry_count ?? 0)}` : "HB",
        color: "var(--msg-append)",
        duration: 700
      };
    case "append_response":
      return {
        type: event.event,
        from: Number(event.from),
        to: Number(event.to),
        label: event.success ? "ACK" : "NACK",
        color: event.success ? "var(--msg-append-response)" : "var(--status-warn)",
        duration: 650
      };
    default:
      return null;
  }
}

function setSpeech(server: MutableServer, text: string, currentTs: number, level: SpeechBubbleState["level"] = "info") {
  server.speech = {
    text,
    untilTs: currentTs + 1500,
    level
  };
}

export function buildReplayState(events: RaftEvent[], currentIndex: number, warnings: string[] = []): ReplayState {
  const boundedIndex = events.length === 0 ? -1 : Math.max(0, Math.min(currentIndex, events.length - 1));
  const visibleEvents = boundedIndex >= 0 ? events.slice(0, boundedIndex + 1) : [];
  const numPeers = inferNumPeers(events);
  const servers = Array.from({ length: numPeers }, (_, index) => createServer(index));
  const leaderTransitions = new Map<number, Set<number>>();
  const commits: Array<{ server: number; index: number; command: string; term: number; eventIndex: number }> = [];
  const messages: MessageAnimationState[] = [];
  let currentTs = visibleEvents[visibleEvents.length - 1]?.ts ?? 0;
  let maxCommitIndex = 0;
  let approximate = false;

  visibleEvents.forEach((event, eventIndex) => {
    const serverId = typeof event.server === "number" ? event.server : undefined;
    const server = serverId !== undefined && servers[serverId] ? servers[serverId] : undefined;

    const message = messageForEvent(event);
    if (message) {
      messages.push({
        id: `${eventIndex}-${event.event}-${message.from}-${message.to}`,
        ...message,
        startedAt: event.ts
      });
    }

    switch (event.event) {
      case "state_change": {
        if (!server) {
          break;
        }
        server.term = typeof event.term === "number" ? event.term : server.term;
        server.alive = true;
        server.role = (event.to_state as ServerRole) ?? server.role;
        if (event.to_state === "candidate") {
          setSpeech(server, "Vote 4 me!", event.ts);
        } else if (event.to_state === "leader") {
          setSpeech(server, "I'm the boss!", event.ts);
          const leaders = leaderTransitions.get(server.term) ?? new Set<number>();
          leaders.add(server.id);
          leaderTransitions.set(server.term, leaders);
        } else if (event.to_state === "follower" && event.from_state === "leader") {
          setSpeech(server, "Okay fine...", event.ts, "warn");
        }
        break;
      }
      case "election_timeout":
        if (server) {
          server.term = typeof event.term === "number" ? event.term : server.term;
          setSpeech(server, "My turn!", event.ts);
        }
        break;
      case "vote_denied": {
        const voter = typeof event.from === "number" ? servers[event.from] : undefined;
        if (voter) {
          setSpeech(voter, "Nope.", event.ts, "warn");
        }
        break;
      }
      case "append_entries": {
        const to = typeof event.to === "number" ? servers[event.to] : undefined;
        const from = typeof event.from === "number" ? servers[event.from] : undefined;
        const entryCount = Number(event.entry_count ?? 0);
        if (to) {
          const leaderLength = from ? Math.max(from.approxLogLength, from.commitCells.size) : 0;
          if (entryCount > 0) {
            approximate = true;
            to.approxLogLength = Math.max(to.approxLogLength, leaderLength, to.commitCells.size + entryCount);
          }
        }
        break;
      }
      case "append_response": {
        if (event.success === false) {
          approximate = true;
        }
        break;
      }
      case "commit": {
        if (!server || typeof event.index !== "number") {
          break;
        }
        const command = stringifyCommand(event.command);
        const term = typeof event.term === "number" ? event.term : server.term;
        server.term = term;
        server.commitCells.set(event.index, {
          index: event.index,
          command,
          term,
          committed: true
        });
        server.approxLogLength = Math.max(server.approxLogLength, event.index);
        maxCommitIndex = Math.max(maxCommitIndex, event.index);
        commits.push({
          server: server.id,
          index: event.index,
          command,
          term,
          eventIndex
        });
        if (server.commitCells.size === 1) {
          setSpeech(server, "Committed!", event.ts);
        }
        break;
      }
      case "crash":
        if (server) {
          server.role = "crashed";
          server.alive = false;
          setSpeech(server, "Aaagh!", event.ts, "error");
        }
        break;
      case "restart":
        if (server) {
          server.role = "restarting";
          server.alive = true;
          server.restartUntil = event.ts + 1000;
          setSpeech(server, "I'm back!", event.ts);
        }
        break;
      default:
        break;
    }
  });

  for (const server of servers) {
    if (server.restartUntil && currentTs > server.restartUntil && server.role === "restarting") {
      server.role = "follower";
    }
    if (server.speech && server.speech.untilTs < currentTs) {
      server.speech = undefined;
    }
  }

  const invariants = runInvariantChecks({
    events: visibleEvents,
    leaderTransitions,
    commits,
    approximate
  });

  const highlightedServers = Array.from(
    new Set(
      invariants
        .filter((result) => result.status === "fail")
        .flatMap((result) => result.servers ?? [])
    )
  );

  const visibleMessages = messages.filter((message) => currentTs - message.startedAt <= message.duration);

  return {
    numPeers,
    currentIndex: boundedIndex,
    currentTs,
    visibleEvents,
    servers: servers.map<ServerViewState>((server) => ({
      id: server.id,
      role: server.role,
      term: server.term,
      alive: server.alive,
      approxLogLength: Math.max(server.approxLogLength, server.commitCells.size),
      commitCells: Array.from(server.commitCells.values()).sort((left, right) => left.index - right.index),
      speech: server.speech
    })),
    messages: visibleMessages,
    invariants,
    warnings,
    approximate,
    leadersByTerm: Object.fromEntries(
      Array.from(leaderTransitions.entries()).map(([term, leaders]) => [term, Array.from(leaders.values())])
    ),
    commitIndex: maxCommitIndex,
    highlightedServers
  };
}

