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
   * Flag to add a beta warning. Enabled for review and staging site stages.
   */
  | "preReleaseNotice"
  /**
   * Flag to show the home page projects section which lacks content.
   */
  | "homePageProjects"
  /**
   * Flag to show fingerprints view option.
   */
  | "fingerprints"
  /**
   * Example flags used for testing.
   */
  | "exampleOptInA"
  | "exampleOptInB";

interface FlagMetadata {
  defaultOnStages: Stage[];
  name: Flag;
}

const allFlags: FlagMetadata[] = [
  // Alphabetical order.
  { name: "devtools", defaultOnStages: ["local"] },
  { name: "homePageProjects", defaultOnStages: ["local", "review", "staging"] },
  {
    name: "preReleaseNotice",
    defaultOnStages: ["review", "staging", "production"],
  },
  { name: "fingerprints", defaultOnStages: ["local"] },
  { name: "exampleOptInA", defaultOnStages: ["review", "staging"] },
  { name: "exampleOptInB", defaultOnStages: [] },
];

type Flags = Record<Flag, boolean>;

// Exposed for testing.
export const flagsForParams = (stage: Stage, params: URLSearchParams) => {
  const enableFlags = new Set(params.getAll("flag"));
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
