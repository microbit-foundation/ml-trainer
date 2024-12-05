/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
/// <reference types="vite-plugin-svgr/client" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VERSION: string;
  readonly VITE_STAGE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
