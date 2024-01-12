/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { init, locale, register } from 'svelte-i18n';
export { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import { persistantWritable } from './script/stores/storeUtil';
import browserLang from 'browser-lang';

export const allLanguages = [
  {
    id: 'en',
    name: 'English',
    enName: 'English',
  },
  // There are no Welsh translations yet but enabled to demo the language feature
  {
    id: 'cy',
    name: 'Cymraeg',
    enName: 'Welsh',
  },
  // Disabled for now as this fork doesn't have full Danish translations
  /*{
    id: 'da',
    name: 'Dansk',
    enName: 'Danish',
  },*/
];

register('en', () => import('./messages/ui.en.json'));
register('cy', () => import('./messages/ui.cy.json'));

const initialLocale = browserLang({
  languages: allLanguages.map(l => l.id),
  fallback: 'en',
});

const persistantLocale = persistantWritable('lang', initialLocale);

locale.subscribe(newLocal => {
  if (newLocal) {
    persistantLocale.set(newLocal);
  }
});

await init({
  fallbackLocale: 'en',
  initialLocale: get(persistantLocale),
  // Needed to format <link> style tags.
  ignoreTag: false,
});
