/**
 * @vitest-environment jsdom
 */
/**
 * (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ActionName, actionNamesFromLabels } from "./utils";

describe("test actionNamesFromLabels", () => {
  it("removes numbers from start of identifiers", () => {
    const expected: ActionName[] = [
      {
        actionLabel: "  123   hello",
        actionVar: "Hello",
      },
    ];
    const userDefined = ["  123   hello"];
    expect(actionNamesFromLabels(userDefined)).toEqual(expected);
  });

  it("removes invalid characters from identifier", () => {
    const expected: ActionName[] = [
      {
        actionLabel: "!£$%^&*()valid:;'@#~[{]},<.>/?¬`",
        actionVar: "Valid",
      },
    ];
    const userDefined = ["!£$%^&*()valid:;'@#~[{]},<.>/?¬`"];
    expect(actionNamesFromLabels(userDefined)).toEqual(expected);
  });

  it("generates best effort identifier if no characters are valid", () => {
    const expected: ActionName[] = [
      {
        actionLabel: "  123   £$%",
        actionVar: "Event",
      },
    ];
    const userDefined = ["  123   £$%"];
    expect(actionNamesFromLabels(userDefined)).toEqual(expected);
  });

  it("copes with empty strings", () => {
    const expected: ActionName[] = [
      {
        actionLabel: "",
        actionVar: "Event",
      },
      {
        actionLabel: "",
        actionVar: "Event1",
      },
      {
        actionLabel: "",
        actionVar: "Event2",
      },
    ];
    const userDefined = ["", "", ""];
    expect(actionNamesFromLabels(userDefined)).toEqual(expected);
  });

  it("replaces double quotes in action labels", () => {
    const expected: ActionName[] = [
      {
        actionLabel: "my 'action'",
        actionVar: "MyAction",
      },
    ];
    const userDefined = ['my "action"'];
    expect(actionNamesFromLabels(userDefined)).toEqual(expected);
  });

  it("dedups sanitized inputs to create valid identifiers", () => {
    const expected: ActionName[] = [
      {
        actionLabel: "hello",
        actionVar: "Hello",
      },
      {
        actionLabel: "hello-",
        actionVar: "Hello1",
      },
      {
        actionLabel: "hello--",
        actionVar: "Hello2",
      },
    ];
    const userDefined = ["hello", "hello-", "hello--"];
    expect(actionNamesFromLabels(userDefined)).toEqual(expected);
  });

  it("removes invalid characters from identifier", () => {
    const expected: ActionName[] = [
      {
        actionLabel: "!£$%^&*()valid:;'@#~[{]},<.>/?¬`1",
        actionVar: "Valid1",
      },
    ];
    const userDefined = ["!£$%^&*()valid:;'@#~[{]},<.>/?¬`1"];
    expect(actionNamesFromLabels(userDefined)).toEqual(expected);
  });

  it("copes with newlines", () => {
    const expected: ActionName[] = [
      {
        actionLabel: "my \naction \n",
        actionVar: "MyAction",
      },
    ];
    const userDefined = ["my \naction \n"];
    expect(actionNamesFromLabels(userDefined)).toEqual(expected);
  });

  it("copes with different languages", () => {
    const expected: ActionName[] = [
      {
        actionLabel: "내 행동",
        actionVar: "내행동",
      },
    ];
    const userDefined = ["내 행동"];
    expect(actionNamesFromLabels(userDefined)).toEqual(expected);
  });
});
