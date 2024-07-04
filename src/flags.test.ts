import { flagsForParams } from "./flags";

describe("flags", () => {
  it("enables nothing in production", () => {
    const params = new URLSearchParams([]);

    const flags = flagsForParams("production", params);

    expect(Object.values(flags).every((x) => !x)).toEqual(true);
  });

  it("enables by stage", () => {
    const params = new URLSearchParams([]);

    const flags = flagsForParams("staging", params);

    expect(flags.exampleOptInA).toEqual(true);
  });

  it("enable specific flag", () => {
    const params = new URLSearchParams([["flag", "exampleOptInA"]]);

    const flags = flagsForParams("production", params);

    expect(
      Object.entries(flags).every(
        ([flag, status]) => (flag === "exampleOptInA") === status
      )
    ).toEqual(true);
  });

  it("enable everything", () => {
    const params = new URLSearchParams([["flag", "*"]]);
    const flags = flagsForParams("production", params);
    expect(Object.values(flags).every((x) => x)).toEqual(true);
  });

  it("enable nothing", () => {
    const params = new URLSearchParams([["flag", "none"]]);
    const flags = flagsForParams("review", params);
    expect(Object.values(flags).every((x) => !x)).toEqual(true);
  });

  it("can combine none with specific enabled flags in review", () => {
    const params = new URLSearchParams([
      ["flag", "none"],
      ["flag", "exampleOptInB"],
    ]);

    const flags = flagsForParams("review", params);

    expect(flags.exampleOptInA).toBe(false);
    expect(flags.exampleOptInB).toBe(true);
  });
});
