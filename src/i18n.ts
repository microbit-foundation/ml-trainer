/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import browserLang from 'browser-lang';
import { FormatXMLElementFn } from 'intl-messageformat';
import { getLocaleFromQueryString, init, locale, register } from 'svelte-i18n';
import { get } from 'svelte/store';
import { persistantWritable } from './script/stores/storeUtil';
export { t } from 'svelte-i18n';

type InterpolationValues =
  | Record<
      string,
      string | number | boolean | Date | FormatXMLElementFn<unknown> | null | undefined
    >
  | undefined;

interface MessageObject {
  id: string;
  locale?: string;
  format?: string;
  default?: string;
  values?: InterpolationValues;
}
// Not exported from svelte-i18n so replicated here.
export type MessageFormatter = (
  id: string | MessageObject,
  options?: Omit<MessageObject, 'id'>,
) => string;

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

const initialLocale =
  getLocaleFromQueryString('l') ||
  browserLang({
    languages: allLanguages.map(l => l.id),
    fallback: 'en',
  });

const persistantLocale = persistantWritable('lang', initialLocale);

locale.subscribe(newLocal => {
  if (newLocal) {
    persistantLocale.set(newLocal);
  }
});

init({
  fallbackLocale: 'en',
  initialLocale: get(persistantLocale),
  // Needed to format <link> style tags.
  ignoreTag: false,
});
