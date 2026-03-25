import type { InvariantResult, RaftEvent } from "./types";

interface CommitRecord {
  server: number;
  index: number;
  command: string;
  term: number;
  eventIndex: number;
}

interface InvariantInput {
  events: RaftEvent[];
  leaderTransitions: Map<number, Set<number>>;
  commits: CommitRecord[];
  approximate: boolean;
}

function uniqueCommands(records: CommitRecord[]) {
  return Array.from(new Set(records.map((record) => `${record.term}:${record.command}`)));
}

export function runInvariantChecks(input: InvariantInput): InvariantResult[] {
  const results: InvariantResult[] = [];

  let electionFailure: InvariantResult | undefined;
  for (const [term, leaders] of input.leaderTransitions.entries()) {
    if (leaders.size > 1) {
      electionFailure = {
        id: "election-safety",
        title: "Election Safety",
        status: "fail",
        message: `Term ${term} shows multiple leaders: ${Array.from(leaders)
          .map((leader) => `S${leader}`)
          .join(", ")}.`,
        servers: Array.from(leaders)
      };
      break;
    }
  }

  results.push(
    electionFailure ?? {
      id: "election-safety",
      title: "Election Safety",
      status: "pass",
      message: "No term shows more than one observed leader."
    }
  );

  const commitsByIndex = new Map<number, CommitRecord[]>();
  for (const commit of input.commits) {
    const bucket = commitsByIndex.get(commit.index) ?? [];
    bucket.push(commit);
    commitsByIndex.set(commit.index, bucket);
  }

  let stateMachineFailure: InvariantResult | undefined;
  for (const [index, records] of commitsByIndex.entries()) {
    const commands = uniqueCommands(records);
    if (commands.length > 1) {
      stateMachineFailure = {
        id: "state-machine-safety",
        title: "State Machine Safety",
        status: "fail",
        message: `Index ${index} committed multiple commands across servers.`,
        eventIndex: records[records.length - 1]?.eventIndex,
        servers: Array.from(new Set(records.map((record) => record.server)))
      };
      break;
    }
  }

  results.push(
    stateMachineFailure ?? {
      id: "state-machine-safety",
      title: "State Machine Safety",
      status: "pass",
      message: "Observed commit events never apply different commands at the same index."
    }
  );

  results.push({
    id: "log-matching",
    title: "Log Matching",
    status: stateMachineFailure ? "fail" : input.approximate ? "warn" : "pass",
    message: stateMachineFailure
      ? "Committed prefixes diverged, so log matching is violated."
      : input.approximate
        ? "Committed prefixes look consistent, but uncommitted log matching is approximate with v1 events."
        : "No committed prefix divergence was observed."
  });

  const leaderCompletenessViolation = stateMachineFailure
    ? {
        id: "leader-completeness",
        title: "Leader Completeness",
        status: "fail" as const,
        message: "A later observed leader committed conflicting state, so leader completeness is violated."
      }
    : {
        id: "leader-completeness",
        title: "Leader Completeness",
        status: input.approximate ? ("warn" as const) : ("pass" as const),
        message: input.approximate
          ? "No clear violation was observed, but completeness is only partially inferable from baseline events."
          : "Later observed leaders stayed compatible with committed state."
      };
  results.push(leaderCompletenessViolation);

  const leaderAppendOnlyFailure = (() => {
    const byServer = new Map<number, CommitRecord[]>();
    for (const commit of input.commits) {
      const bucket = byServer.get(commit.server) ?? [];
      bucket.push(commit);
      byServer.set(commit.server, bucket);
    }

    for (const [server, records] of byServer.entries()) {
      const byIndex = new Map<number, CommitRecord[]>();
      for (const record of records) {
        const bucket = byIndex.get(record.index) ?? [];
        bucket.push(record);
        byIndex.set(record.index, bucket);
      }
      for (const [index, indexRecords] of byIndex.entries()) {
        if (uniqueCommands(indexRecords).length > 1) {
          return {
            id: "leader-append-only",
            title: "Leader Append-Only",
            status: "fail" as const,
            message: `Server S${server} appears to rewrite committed entry ${index}.`,
            eventIndex: indexRecords[indexRecords.length - 1]?.eventIndex,
            servers: [server]
          };
        }
      }
    }

    return undefined;
  })();

  results.push(
    leaderAppendOnlyFailure ?? {
      id: "leader-append-only",
      title: "Leader Append-Only",
      status: input.approximate ? "warn" : "pass",
      message: input.approximate
        ? "No self-overwrite was observed, but append-only guarantees are inferred from limited event detail."
        : "No leader self-overwrite behavior was observed."
    }
  );

  return results;
}

