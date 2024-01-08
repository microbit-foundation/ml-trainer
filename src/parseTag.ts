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
    const { startIndex, endIndex } = currPart;
    const nextPartStartIndex =
      i === matches.length - 1 ? undefined : matches[i + 1].index;
    return [
      ...(i === 0 && startIndex !== 0 ? [{ text: s.slice(0, startIndex) }] : []),
      ...accParts,
      currPart,
      ...(endIndex !== s.length ? [{ text: s.slice(endIndex, nextPartStartIndex) }] : []),
    ];
  }, [] as ParsedPart[]);
};
