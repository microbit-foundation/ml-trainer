/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { SvelteComponent } from 'svelte';
import { Writable, writable } from 'svelte/store';
import Homepage from '../pages/Homepage.svelte';

export const currentPageComponent: Writable<typeof SvelteComponent<any>> =
  writable(Homepage);
