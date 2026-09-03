/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
/// <reference types="vite-plugin-svgr/client" />
/// <reference types="vite/client" />

/**
 * Brand-optional theme images (see resolveThemeImage in vite.config.ts):
 * the URL when the branded theme package ships the file, `undefined`
 * otherwise. This pattern is more specific than vite/client's "*.svg", so
 * TypeScript prefers it for these imports — components must handle the
 * undefined case by hiding the affected UI.
 */
declare module "theme-package/images/optional/*" {
  const url: string | undefined;
  export default url;
}

interface ImportMetaEnv {
  readonly VITE_VERSION: string;
  readonly VITE_STAGE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
