/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

/**
 * Features disabled here even in preview are not ready for feedback.
 *
 * Preview features are not ready for general use.
 */

import { Stage, stage as stageFromEnvironment } from './environment';

/**
 * A union of the flag names (alphabetical order).
 */
export type Flag =
  /**
   * Changes radio bridge hexes to one that acts as a sender and receiver for radio bridge testing.
   */
  | 'radioLocal'
  /**
   * Changes the remote radio bridge hex to one that uses button A to stop sending data.
   */
  | 'radioRemoteDev';

interface FlagMetadata {
  defaultOnStages: Stage[];
  name: Flag;
}

const allFlags: FlagMetadata[] = [
  // Alphabetical order.
  { name: 'radioLocal', defaultOnStages: [] },
  { name: 'radioRemoteDev', defaultOnStages: [] },
];

type Flags = Record<Flag, boolean>;

// Exposed for testing.
export const flagsForParams = (stage: Stage, params: URLSearchParams) => {
  const enableFlags = new Set(params.getAll('flag'));
  const allFlagsDefault = enableFlags.has('none')
    ? false
    : enableFlags.has('*')
      ? true
      : undefined;
  return Object.fromEntries(
    allFlags.map(f => [
      f.name,
      isEnabled(f, stage, allFlagsDefault, enableFlags.has(f.name)),
    ]),
  ) as Flags;
};

const isEnabled = (
  f: FlagMetadata,
  stage: Stage,
  allFlagsDefault: boolean | undefined,
  thisFlagOn: boolean,
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
