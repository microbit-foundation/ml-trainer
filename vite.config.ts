/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import WindiCSS from 'vite-plugin-windicss';
import { sveltePreprocess } from 'svelte-preprocess/dist/autoProcess';
import EnvironmentPlugin from 'vite-plugin-environment';

/** @type {import('vite').UserConfig} */
export default defineConfig({
  base: process.env.BASE_URL ?? '/',
  plugins: [
    svelte({
      preprocess: sveltePreprocess({ typescript: true }),

      onwarn(warning, defaultHandler) {
        if (warning.code.includes('a11y')) return; // Ignores the a11y warnings when compiling. This does not apply to the editor, see comment at bottom for vscode instructions

        // handle all other warnings normally
        defaultHandler!(warning);
      },
    }),
    WindiCSS(),
    EnvironmentPlugin('all'),
  ],
  build: {
    rollupOptions: {
      input: 'index.html',
    },
  },
});

/**
To disable a11y warnings in vscode:

create file .vscode/settings.json and place

{
    "svelte.plugin.svelte.compilerWarnings": {
      "a11y-aria-attributes": "ignore",
      "a11y-incorrect-aria-attribute-type": "ignore",
      "a11y-unknown-aria-attribute": "ignore",
      "a11y-hidden": "ignore",
      "a11y-misplaced-role": "ignore",
      "a11y-unknown-role": "ignore",
      "a11y-no-abstract-role": "ignore",
      "a11y-no-redundant-roles": "ignore",
      "a11y-role-has-required-aria-props": "ignore",
      "a11y-accesskey": "ignore",
      "a11y-autofocus": "ignore",
      "a11y-misplaced-scope": "ignore",
      "a11y-positive-tabindex": "ignore",
      "a11y-invalid-attribute": "ignore",
      "a11y-missing-attribute": "ignore",
      "a11y-img-redundant-alt": "ignore",
      "a11y-label-has-associated-control": "ignore",
      "a11y-media-has-caption": "ignore",
      "a11y-distracting-elements": "ignore",
      "a11y-structure": "ignore",
      "a11y-click-events-have-key-events": "ignore",
      "a11y-missing-content": "ignore",
    }
  }

  Add configuration values as needed.
 */
