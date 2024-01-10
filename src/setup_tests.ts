/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import * as matchers from 'vitest-dom/matchers';
import 'vitest-dom/extend-expect';

// browser mocks
const setLang = (lang: string) => {
  const localStorageMock = (function () {
    let store = {
      isTesting: true,
      lang: JSON.stringify(lang),
    };
    return {
      getItem: function (key: 'isTesting' | 'lang') {
        return store[key] || null;
      },
      setItem: function (key: 'isTesting' | 'lang', value: any) {
        // @ts-ignore
        store[key] = value.toString();
      },
      removeItem: function (key: 'isTesting' | 'lang') {
        delete store[key];
      },
      clear: function () {
        store = {
          isTesting: true,
          lang: JSON.stringify(lang),
        };
      },
    };
  })();
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
};

localStorage.setItem('isTesting', 'true');
setLang('da');

export default setLang;
