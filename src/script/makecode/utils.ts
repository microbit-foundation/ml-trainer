/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import camelCase from 'lodash.camelcase';
import upperFirst from 'lodash.upperfirst';

const dropLeadingNumbers = (input: string): string => {
  let result = input;
  for (let i = 0; i < result.length; i++) {
    if (/\d/.test(input[i])) {
      result = input.substring(i + 1);
    } else {
      break;
    }
  }
  if (!result) {
    throw new Error('Action name does not contain any valid characters');
  }
  return result;
};

export const varFromActionLabel = (actionLabel: string): string => {
  // https://github.com/microsoft/pxt/blob/16f161c3a5478addf45269315e4f1ea2f9e7ad53/pxtlib/util.ts#L188-L191
  const sanitized = actionLabel
    .replace(/[()\\\/.,?*^:<>!;'#$%^&|"@+=«»°{}\[\]¾½¼³²¦¬¤¢£~­¯¸`±\x00-\x1F]/g, '')
    .trim();
  const withoutLeadingNumbers = dropLeadingNumbers(sanitized);
  return upperFirst(camelCase(withoutLeadingNumbers));
};

export const filenames = {
  mainTs: 'main.ts',
  mainBlocks: 'main.blocks',
  customTs: 'Machine_Learning_POC.ts',
  customJson: 'Machine_Learning_POC.json',
};

export const isEmpty = (o: object) => {
  return Object.keys(o).length === 0;
};

export const pxt = {
  name: 'Untitled',
  description: '',
  dependencies: {
    core: '*',
    microphone: '*',
    radio: '*', // needed for compiling
    'Machine Learning POC':
      'github:microbit-foundation/pxt-ml-extension-poc#c8b69999d6c55fc34702e03bf5d3b91ed49f1a4c',
  },
  files: [...Object.values(filenames), 'README.md'],
};

export const getKeyByValue = (object: Record<string, any>, value: any) => {
  return Object.keys(object).find(
    key => JSON.stringify(object[key]) === JSON.stringify(value),
  );
};

export const iconNames: string[] = [
  'Heart',
  'SmallHeart',
  'Yes',
  'No',
  'Happy',
  'Sad',
  'Confused',
  'Angry',
  'Asleep',
  'Surprised',
  'Silly',
  'Fabulous',
  'Meh',
  'TShirt',
  'Rollerskate',
  'Duck',
  'House',
  'Tortoise',
  'Butterfly',
  'StickFigure',
  'Ghost',
  'Sword',
  'Giraffe',
  'Skull',
  'Umbrella',
  'Snake',
  'Rabbit',
  'Cow',
  'QuarterNote',
  'EigthNote',
  'EighthNote',
  'Pitchfork',
  'Target',
  'Triangle',
  'LeftTriangle',
  'Chessboard',
  'Diamond',
  'SmallDiamond',
  'Square',
  'SmallSquare',
  'Scissors',
];
