/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
/**
 * Simple feature flags.
 *
 * Features disabled here even in preview are not ready for feedback.
 *
 * Preview features are not ready for general use.
 */
import { Stage, stage as stageFromEnvironment } from "./environment";

/**
 * A union of the flag names (alphabetical order).
 */
export type Flag =
  /**
   * Flag to enable redux/zustand dev tools.
   */
  | "devtools"
  /**
   * Flag to enable e2e support.
   */
  | "e2e"
  /**
   * Flag to simulate Android native platform behavior in web for testing.
   */
  | "android"
  /**
   * Flag to add a beta warning. Enabled for review and staging site stages.
   */
  | "preReleaseNotice"
  /**
   * Flag to skip automatic tours. Useful for e2e tests that don't test tours.
   */
  | "skipTours"
  /**
   * Enables in-context Crowdin translating.
   */
  | "translate"
  /**
   * Enables languages that are ready for review.
   */
  | "translationPreview"
  /**
   * Example flags used for testing.
   */
  | "exampleOptInA"
  | "exampleOptInB"
  /**
   * Flag to simulate iOS native platform behavior in web for testing.
   */
  | "ios";

interface FlagMetadata {
  defaultOnStages: Stage[];
  name: Flag;
}

const allFlags: FlagMetadata[] = [
  // Alphabetical order.
  { name: "android", defaultOnStages: [] },
  { name: "devtools", defaultOnStages: ["local"] },
  { name: "e2e", defaultOnStages: [] },
  { name: "exampleOptInA", defaultOnStages: ["review", "staging"] },
  { name: "exampleOptInB", defaultOnStages: [] },
  { name: "ios", defaultOnStages: [] },
  { name: "preReleaseNotice", defaultOnStages: ["staging", "beta"] },
  { name: "skipTours", defaultOnStages: [] },
  { name: "translate", defaultOnStages: [] },
  { name: "translationPreview", defaultOnStages: ["beta"] },
];

type Flags = Record<Flag, boolean>;

// Exposed for testing.
export const flagsForParams = (stage: Stage, params: URLSearchParams) => {
  const enableFlags = new Set(params.getAll("flag"));
  try {
    localStorage
      .getItem("flags")
      ?.split(",")
      ?.forEach((f) => enableFlags.add(f.trim()));
  } catch (e) {
    // Ignore if there are local storage security issues
  }
  const allFlagsDefault = enableFlags.has("none")
    ? false
    : enableFlags.has("*")
    ? true
    : undefined;
  return Object.fromEntries(
    allFlags.map((f) => [
      f.name,
      isEnabled(f, stage, allFlagsDefault, enableFlags.has(f.name)),
    ])
  ) as Flags;
};

const isEnabled = (
  f: FlagMetadata,
  stage: Stage,
  allFlagsDefault: boolean | undefined,
  thisFlagOn: boolean
): boolean => {
  if (thisFlagOn) {
    return true;
  }
  if (allFlagsDefault !== undefined) {
    return allFlagsDefault;
  }
  return f.defaultOnStages.includes(stage);
};

export const flags: Flags = (() => {
  const params = new URLSearchParams(window.location.search);
  return flagsForParams(stageFromEnvironment, params);
})();
