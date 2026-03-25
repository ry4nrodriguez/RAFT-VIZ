import { getServerPositions } from "./positions";

describe("getServerPositions", () => {
  it("creates a point for each server", () => {
    expect(getServerPositions(5, 800, 400)).toHaveLength(5);
    expect(getServerPositions(7, 900, 500)).toHaveLength(7);
  });
});
