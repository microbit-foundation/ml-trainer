/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { writable, Writable, get, derived } from 'svelte/store';
import type { MessageFormatter } from '../i18n';
import { appName } from '../script/environment';
export const Paths = {
  HOME: '/',
  PLAYGROUND: 'playground',
  INTRODUCING_TOOL: 'resources/introducing-the-microbit-machine-learning-tool',
  GET_STARTED: 'resources/get-started',
  DATA: 'add-data',
  TRAINING: 'train-model',
  PROCESS: 'process-data',
  MODEL: 'test-model',
  FILTERS: 'training/filters',
} as const;

export type PathType = (typeof Paths)[keyof typeof Paths];

export const isValidPath = (s: string): s is PathType => {
  return Object.values(Paths).includes(s as PathType);
};

export const currentPathPrivate: Writable<PathType> = writable(Paths.HOME);
export const currentPath = derived(currentPathPrivate, path => path);

export function navigate(path: PathType) {
  if (path === get(currentPath)) {
    return;
  }
  currentPathPrivate.set(path);
}

export const getTitle = (path: PathType, t: MessageFormatter) => {
  switch (path) {
    case Paths.HOME: {
      return appName;
    }
    case Paths.DATA: {
      return `${t('content.index.toolProcessCards.data.title')} | ${appName}`;
    }
    case Paths.TRAINING: {
      return `${t('content.index.toolProcessCards.train.title')} | ${appName}`;
    }
    case Paths.PROCESS: {
      return `Process data | ${appName}`;
    }
    case Paths.MODEL: {
      return `${t('content.index.toolProcessCards.model.title')} | ${appName}`;
    }
    default:
      return appName;
  }
};
