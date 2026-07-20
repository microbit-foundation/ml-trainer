/**
 * @vitest-environment jsdom
 */

/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { describe, expect, it } from "vitest";
import { getHint } from "./hints";
import { ActionData, RecordingData } from "./model";

let idCounter = 0;
const nextId = () => `id-${idCounter++}`;

const recording = (): RecordingData => ({
  id: nextId(),
  data: { x: [0], y: [0], z: [0] },
  createdAt: 0,
});

const action = (
  name: string,
  numRecordings: number,
  overrides: Partial<ActionData> = {}
): ActionData => ({
  name,
  id: nextId(),
  icon: "Heart",
  createdAt: 0,
  recordings: Array.from({ length: numRecordings }, recording),
  ...overrides,
});

describe("getHint", () => {
  it("returns null when there are no actions", () => {
    expect(getHint([], false)).toBeNull();
  });

  describe("naming hints", () => {
    it("prompts to name the first action without samples", () => {
      expect(getHint([action("", 0)], false)).toEqual({
        type: "name-action",
        actionIdx: 0,
      });
    });

    it("prompts to name the second action without samples", () => {
      expect(getHint([action("Still", 3), action("", 0)], false)).toEqual({
        type: "name-action",
        actionIdx: 1,
      });
    });

    it("uses the short naming hint for an unnamed last action past idx 1", () => {
      const actions = [action("Shake", 3), action("Still", 3), action("", 0)];
      expect(getHint(actions, false)).toEqual({
        type: "name-action-short",
        actionIdx: 2,
      });
    });

    it("prompts to name the last unnamed action with samples", () => {
      expect(getHint([action("Shake", 3), action("", 2)], false)).toEqual({
        type: "name-action-with-samples",
        actionIdx: 1,
      });
      const actions = [action("Shake", 3), action("Still", 3), action("", 2)];
      expect(getHint(actions, false)).toEqual({
        type: "name-action-with-samples",
        actionIdx: 2,
      });
    });

    it("uses the short naming hint for an earlier unnamed empty action", () => {
      const actions1 = [action("", 0), action("Still", 0)];
      expect(getHint(actions1, false)).toEqual({
        type: "name-action-short",
        actionIdx: 0,
      });
      const actions2 = [
        action("Shake", 3),
        action("Still", 3),
        action("", 0),
        action("Circle", 3),
      ];
      expect(getHint(actions2, false)).toEqual({
        type: "name-action-short",
        actionIdx: 2,
      });
    });

    it("no prompts for naming if unnamed action is not the last action and have recordings", () => {
      const actions = [action("", 3), action("Shake", 3), action("Circle", 2)];
      expect(getHint(actions, false)).toEqual(null);
    });
  });

  describe("recording hints", () => {
    it("prompts to record for a named action with no recordings", () => {
      expect(getHint([action("Shake", 0)], false)).toEqual({
        type: "record-action",
        actionIdx: 0,
      });
    });

    it("prompts to record more when the last action has too few samples", () => {
      expect(getHint([action("Shake", 3), action("Still", 1)], false)).toEqual({
        type: "record-more-action",
      });
    });
  });

  describe("add-action and train hints", () => {
    it("prompts to add an action after the first is fully recorded", () => {
      expect(getHint([action("Shake", 3)], false)).toEqual({
        type: "add-action",
      });
    });

    it("prompts to train when there is sufficient data", () => {
      const actions = [action("Shake", 3), action("Still", 3)];
      expect(getHint(actions, false)).toEqual({ type: "train" });
    });

    it("suppresses the train hint when requested", () => {
      const actions = [action("Shake", 3), action("Still", 3)];
      expect(getHint(actions, true)).toBeNull();
    });

    it("suppresses the add-action hint when requested", () => {
      expect(getHint([action("Shake", 3)], true)).toBeNull();
    });

    // > 2 actions: remaining (non-naming) hints are not shown, only train.
    it("shows the train hint with > 2 fully recorded actions", () => {
      const actions = [
        action("Shake", 3),
        action("Still", 3),
        action("Circle", 3),
      ];
      expect(getHint(actions, false)).toEqual({ type: "train" });
    });

    it("shows no hint with > 2 actions lacking sufficient data", () => {
      const actions = [
        action("Shake", 3),
        action("Still", 3),
        action("Circle", 1),
      ];
      expect(getHint(actions, false)).toBeNull();
    });
  });
});
