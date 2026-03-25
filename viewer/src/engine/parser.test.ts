import { parseJsonl } from "./parser";

describe("parseJsonl", () => {
  it("parses valid lines and preserves unknown events", () => {
    const parsed = parseJsonl(`{"ts":0,"event":"init","num_peers":5}\n{"ts":2,"event":"mystery","detail":"x"}`);
    expect(parsed.events).toHaveLength(2);
    expect(parsed.events[1]?.event).toBe("mystery");
  });

  it("collects warnings for malformed lines", () => {
    const parsed = parseJsonl(`{"ts":0,"event":"init"}\nnot-json`);
    expect(parsed.warnings).toHaveLength(1);
  });
});

