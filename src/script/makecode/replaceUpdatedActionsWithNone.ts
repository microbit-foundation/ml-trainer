/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { MakeCodeProject } from '@microbit-foundation/react-editor-embed';
import { actionLabel, filenames } from './utils';

export const replaceUpdatedActionsWithNone = (
  p: MakeCodeProject,
  gestureNames: string[],
): MakeCodeProject => {
  const actions = getProjectActions(p);
  const updatedActions = actions.filter(a => !gestureNames.includes(a));
  if (updatedActions.length === 0) {
    return p;
  }
  return {
    text: {
      ...p.text,
      [filenames.mainTs]: replaceWithNoneAction(p.text[filenames.mainTs], updatedActions),
      [filenames.mainBlocks]: replaceWithNoneAction(
        p.text[filenames.mainBlocks],
        updatedActions,
      ),
    },
  };
};

const replaceWithNoneAction = (fileStr: string, actions: string[]) => {
  return fileStr.replace(
    new RegExp(actionLabel(actions.join('|')), 'g'),
    actionLabel('None'),
  );
};

const getProjectActions = (p: MakeCodeProject): string[] => {
  const customTs = p.text[filenames.customTs];
  return customTs.match(new RegExp('(?<=None,)(.*)(?=];\n)', 'g'))![0].split(',');
};
