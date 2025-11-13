/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */

// See CI & package.json scripts.
export const version = import.meta.env.VITE_VERSION || "local";
export type Stage = "local" | "review" | "staging" | "beta" | "production";
export const isLocalStage = () => stage === "local";
export const isPublicFacingStage = () =>
  stage === "beta" || stage === "production";
/**
 * Prefer the functions in environment.ts.
 */
export const stage: Stage = (() => {
  const value = (import.meta.env.VITE_STAGE || "LOCAL").toLowerCase();
  if (
    ["local", "review", "staging", "beta", "production"].indexOf(value) === -1
  ) {
    throw new Error(`Unknown stage: ${value}`);
  }
  return value as Stage;
})();
