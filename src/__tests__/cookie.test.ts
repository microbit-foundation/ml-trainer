/**
 * @vitest-environment jsdom
 */

/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import CookieManager from '../script/CookieManager';
import Cookies from 'js-cookie';

describe('Cookie tests', () => {
  test('Should get feature flag if set', () => {
    const someFlag = 'someflag';
    Cookies.set('fflags', 'someflag + some junk');
    expect(CookieManager.hasFeatureFlag(someFlag)).toBeTruthy();
  });

  test('Should NOT get feature flag if NOT set', () => {
    const someFlag = 'someflag';
    Cookies.set('fflags', 'some junk');
    expect(CookieManager.hasFeatureFlag(someFlag)).toBeFalsy();
  });

  test('Should NOT get feature flag if no fflags cookie is set', () => {
    const someFlag = 'someflag';
    expect(CookieManager.hasFeatureFlag(someFlag)).toBeFalsy();
  });
});
