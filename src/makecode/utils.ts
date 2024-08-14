/**
 * @vitest-environment jsdom
 */
/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import camelCase from "lodash.camelcase";
import upperFirst from "lodash.upperfirst";

export interface ActionName {
  actionLabel: string;
  actionVar: string;
}

const sanitizeActionVar = (input: string) =>
  input
    .replace(/[^\p{L}\p{N}_$\s]/gu, "")
    .replace(/^(\s|\p{N})+/gu, "")
    .trim();

const sanitizeActionLabel = (input: string) => input.replace(/"/g, "'");

export const actionNamesFromLabels = (actionLabels: string[]): ActionName[] => {
  const actionNames: ActionName[] = [];
  actionLabels.forEach((actionLabel, i) => {
    const sanitizedLabel = sanitizeActionVar(actionLabel);
    let actionVar = upperFirst(camelCase(sanitizedLabel));
    if (!actionVar) {
      actionVar = `Event`;
    }
    while (actionNames.map((an) => an.actionVar).includes(actionVar)) {
      actionVar += i;
    }
    actionNames.push({
      actionLabel: sanitizeActionLabel(actionLabel),
      actionVar,
    });
  });
  return actionNames;
};
