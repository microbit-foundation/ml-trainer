/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

// See CI & package.json scripts.
export const version = import.meta.env.VITE_VERSION || 'local';
export type Stage = 'local' | 'review' | 'staging' | 'production';
export const stage: Stage = (() => {
  const value = (import.meta.env.VITE_STAGE || 'local').toLowerCase();
  if (['local', 'review', 'staging', 'production'].indexOf(value) === -1) {
    throw new Error(`Unknown stage: ${value}`);
  }
  return value as Stage;
})();
export const isDevMode = stage === 'local';
