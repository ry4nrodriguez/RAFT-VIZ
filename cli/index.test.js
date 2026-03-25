import test from "node:test";
import assert from "node:assert/strict";
import { buildStatusPayload, parseArgs } from "./index.js";

test("parseArgs handles positional path and flags", () => {
  const parsed = parseArgs(["/tmp/events.jsonl", "--port", "9000", "--no-open"]);
  assert.equal(parsed.positionalPath, "/tmp/events.jsonl");
  assert.equal(parsed.port, 9000);
  assert.equal(parsed.noOpen, true);
});

test("buildStatusPayload falls back to sample mode when file does not exist", () => {
  const payload = buildStatusPayload({
    watchPath: "/tmp/definitely-missing-raftviz-events.jsonl",
    sample: "happy-path"
  });

  assert.equal(payload.mode, "sample");
  assert.ok(typeof payload.initialText === "string");
});
