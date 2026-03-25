import { buildReplayState } from "./eventProcessor";

describe("invariants", () => {
  it("flags multiple leaders in the same term", () => {
    const state = buildReplayState(
      [
        { ts: 0, event: "init", num_peers: 3 },
        { ts: 10, event: "state_change", server: 0, term: 1, from_state: "candidate", to_state: "leader" },
        { ts: 20, event: "state_change", server: 1, term: 1, from_state: "candidate", to_state: "leader" }
      ],
      2
    );

    expect(state.invariants.find((item) => item.id === "election-safety")?.status).toBe("fail");
  });
});

