import { buildReplayState } from "./eventProcessor";

const sample = [
  { ts: 0, event: "init", num_peers: 3 },
  { ts: 10, event: "state_change", server: 1, term: 1, from_state: "follower", to_state: "candidate" },
  { ts: 20, event: "vote_request", server: 1, from: 1, to: 0, term: 1 },
  { ts: 30, event: "vote_granted", server: 0, from: 0, to: 1, term: 1 },
  { ts: 40, event: "state_change", server: 1, term: 1, from_state: "candidate", to_state: "leader" },
  { ts: 50, event: "commit", server: 1, term: 1, index: 1, command: "set x 3" }
];

describe("buildReplayState", () => {
  it("reconstructs current server role and commits", () => {
    const state = buildReplayState(sample, sample.length - 1);
    expect(state.servers[1]?.role).toBe("leader");
    expect(state.servers[1]?.commitCells[0]?.command).toBe("set x 3");
    expect(state.commitIndex).toBe(1);
  });
});

