/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { t } from 'svelte-i18n';
import { writable, Writable, get, derived } from 'svelte/store';

export const Paths = {
  HOME: '/',
  PLAYGROUND: 'playground',
  DATA: 'data',
  TRAINING: 'training',
  MODEL: 'model',
  FILTERS: 'training/filters',
} as const;

export type PathType = (typeof Paths)[keyof typeof Paths];

export const currentPathPrivate: Writable<PathType> = writable(Paths.HOME);
export const currentPath = derived(currentPathPrivate, path => path);

export function navigate(path: PathType) {
  if (path === get(currentPath)) {
    return;
  }
  currentPathPrivate.set(path);
}

const appName = 'micro:bit machine learning tool';
let text: (key: string, vars?: object) => string;
t.subscribe(t => (text = t));
export const getTitle = (path: PathType) => {
  switch (path) {
    case '/': {
      return appName;
    }
    case 'data': {
      return `${text('content.index.toolProcessCards.data.title')} | ${appName}`;
    }
    case 'training': {
      return `${text('content.index.toolProcessCards.train.title')} | ${appName}`;
    }
    case 'model': {
      return `${text('content.index.toolProcessCards.model.title')} | ${appName}`;
    }
    default:
      return appName;
  }
};

currentPath.subscribe(path => {
  const announceRouteEl = document.querySelector('#announce-route');
  if (announceRouteEl) {
    announceRouteEl.textContent = getTitle(path);
  }
});
