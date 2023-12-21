/**
 * @vitest-environment jsdom
 */
/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { determineFilter, Filters } from '../script/datafunctions';
function enumKeys<O extends object, K extends keyof O = keyof O>(obj: O): K[] {
  return Object.keys(obj).filter(k => Number.isNaN(+k)) as K[];
}
describe('Data functions architecture test', () => {
  test('All filters should be implemented in determineFilter', () => {
    for (const filter of enumKeys(Filters)) {
      expect(() => determineFilter(Filters[filter])).not.toThrow();
    }
  });
});
