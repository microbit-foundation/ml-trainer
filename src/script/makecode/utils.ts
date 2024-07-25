/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

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
    'Machine Learning POC': 'github:microbit-foundation/pxt-ml-extension-poc#v0.3.10',
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
