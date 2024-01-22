/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { writable, Writable, get, derived } from 'svelte/store';
import { format } from 'svelte-i18n';
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

const messageFormatter = get(format);
const appName = 'micro:bit machine learning tool';
export const getTitle = (path: PathType, t: typeof messageFormatter) => {
  switch (path) {
    case '/': {
      return appName;
    }
    case 'data': {
      return `${t('content.index.toolProcessCards.data.title')} | ${appName}`;
    }
    case 'training': {
      return `${t('content.index.toolProcessCards.train.title')} | ${appName}`;
    }
    case 'model': {
      return `${t('content.index.toolProcessCards.model.title')} | ${appName}`;
    }
    default:
      return appName;
  }
};
