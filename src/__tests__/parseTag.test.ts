/**
 * @vitest-environment jsdom
 */
/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { parseTag } from '../parseTag';

describe('parseTag', () => {
  test('No tag returns text', () => {
    const text = 'abcsde';
    expect(parseTag(text, 'tag')).toEqual([{ text }]);
  });
  test('returns parsed parts with untagged start and ends', () => {
    expect(parseTag('aaa<a>bbbb</a>ccc<a>ddd</a>eee', 'a')).toEqual([
      {
        text: 'aaa',
      },
      {
        endIndex: 14,
        startIndex: 3,
        tag: 'a',
        text: 'bbbb',
      },
      {
        text: 'ccc',
      },
      {
        endIndex: 27,
        startIndex: 17,
        tag: 'a',
        text: 'ddd',
      },
      {
        text: 'eee',
      },
    ]);
  });
  test('returns parsed parts with tagged end', () => {
    expect(parseTag('aaa<a>bbbb</a>ccc<a>ddd</a>', 'a')).toEqual([
      {
        text: 'aaa',
      },
      {
        endIndex: 14,
        startIndex: 3,
        tag: 'a',
        text: 'bbbb',
      },
      {
        text: 'ccc',
      },
      {
        endIndex: 27,
        startIndex: 17,
        tag: 'a',
        text: 'ddd',
      },
    ]);
  });
  test('returns parsed parts with tagged start', () => {
    expect(parseTag('<a>bbbb</a>ccc<a>ddd</a>eee', 'a')).toEqual([
      {
        endIndex: 11,
        startIndex: 0,
        tag: 'a',
        text: 'bbbb',
      },
      {
        text: 'ccc',
      },
      {
        endIndex: 24,
        startIndex: 14,
        tag: 'a',
        text: 'ddd',
      },
      {
        text: 'eee',
      },
    ]);
  });
});
