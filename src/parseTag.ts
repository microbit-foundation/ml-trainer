/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

interface ParsedPart {
  text: string;
  tag?: string;
  startIndex?: number;
  endIndex?: number;
}

const getPartFromMatch = (m: RegExpMatchArray, tag: string) => {
  if (m.index === undefined) {
    throw new Error('Unexpect error in tagged parts');
  }
  return {
    tag,
    text: m[1],
    startIndex: m.index,
    endIndex: m.index + m[0].length,
  };
};

export const parseTag = (s: string, tag: string): ParsedPart[] => {
  const taggedRegexp = new RegExp(`<${tag}>(.*?)</${tag}>`, 'g');
  const matches = [...s.matchAll(taggedRegexp)];
  if (matches.length === 0) {
    return [{ text: s }];
  }
  return matches.reduce((accParts, m, i) => {
    const currPart = getPartFromMatch(m, tag);
    return [
      ...(i === 0 && currPart.startIndex !== 0
        ? [{ text: s.slice(0, currPart.startIndex) }]
        : []),
      ...accParts,
      currPart,
      ...(currPart.endIndex !== s.length
        ? [
            {
              text:
                i === matches.length - 1
                  ? s.slice(currPart.endIndex)
                  : s.slice(currPart.endIndex, matches[i + 1].index),
            },
          ]
        : []),
    ];
  }, [] as ParsedPart[]);
};
