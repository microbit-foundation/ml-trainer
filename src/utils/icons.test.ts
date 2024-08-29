import { describe, expect, it } from "vitest";
import { iconToLedMatrix } from "./icons";

const x = true;
const _ = false;

describe("iconToLedMatrix", () => {
  it("convers correctly", () => {
    expect(iconToLedMatrix("Happy")).toEqual([
      [_, _, _, _, _],
      [_, x, _, x, _],
      [_, _, _, _, _],
      [x, _, _, _, x],
      [_, x, x, x, _],
    ]);
  });
});
