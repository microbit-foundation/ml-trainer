/**
 * @vitest-environment jsdom
 */
/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import fs from 'fs';
import * as path from 'path';

// Place files you wish to ignore by name in here
const ignoredFiles: RegExp[] = [
  /^\.DS_Store$/,
  /^ui.[a-z-]+.json$/,
  /^sample.json$/,
  /\.(gif|svg|png|jpg|jpeg)$/,
  /^README.md$/,
];
const directoriesToScan = ['./src/', './microbit/v2/source/', './microbit/v1/source/'];

const licenseIdentifierStringSPDX = 'SPDX-License-Identifier:';

const readFile = (fileLocation: string, expect: string) => {
  const fileContent = fs.readFileSync(fileLocation);
  return fileContent.toString().toLowerCase().includes(expect.toLowerCase());
};

type DirectoryContents = {
  files: string[];
  folders: string[];
};

const readDirectory = (directory: string, ignoreList: RegExp[]): DirectoryContents => {
  const files: string[] = [];
  const folders: string[] = [];
  const filesRead = fs.readdirSync(directory);
  filesRead.forEach(file => {
    if (ignoreList.some(ignoreRegExp => ignoreRegExp.test(file))) return;
    const fileLocation = path.join(directory, file);
    const stats = fs.statSync(fileLocation);
    if (stats.isFile()) {
      files.push(fileLocation);
    } else {
      folders.push(fileLocation);
    }
  });
  return { files: files, folders: folders };
};

const flattenDirectory = (directory: string): string[] => {
  const files: string[] = [];
  const content = readDirectory(directory, ignoredFiles);
  const filesFromSubFolders: string[] = [];
  content.folders.forEach(value => {
    const subFolderFlat = flattenDirectory(value);
    subFolderFlat.forEach(value => filesFromSubFolders.push(value));
  });
  filesFromSubFolders.forEach(value => files.push(value));
  content.files.forEach(value => files.push(value));
  return files;
};

const filesMissingIdentifier = (files: string[], expects: string[]): string[] => {
  const filesWithMissingIdentifier: string[] = [];

  for (let i = 0; i < files.length; i++) {
    for (const expect of expects) {
      if (!readFile('./' + files[i], expect)) {
        if (!filesWithMissingIdentifier.includes(files[i])) {
          filesWithMissingIdentifier.push(files[i]);
        }
      }
    }
  }
  return filesWithMissingIdentifier;
};

describe('License identifier tests', () => {
  test(
    'All files should contain license identifier',
    () => {
      const flatten = directoriesToScan.reduce((acc: any, current) => {
        return acc.concat(flattenDirectory(current));
      }, []);

      const faultyFiles = filesMissingIdentifier(flatten, [licenseIdentifierStringSPDX]);
      expect(
        faultyFiles.length,
        'Some files do not contain identifier! ' +
          faultyFiles
            .map(val => `\n \u001b[35m${val} \u001b[0mis missing license identifier`)
            .join(),
      ).toEqual(0);
    },
    60000 * 10,
  );
});
