/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { LayersModel } from "@tensorflow/tfjs";
import camelCase from "lodash.camelcase";
import upperFirst from "lodash.upperfirst";

import { DatasetEditorJsonFormat } from "../model";
import { getMainScript } from "./generate-main-scripts";
import { getAutogeneratedTs, getDatasetJson } from "./generate-custom-scripts";
import { MakeCodeProject } from "@microbit/makecode-embed/react";
import { DataWindow } from "../store";
import { untitledProjectName } from "../project-name";

export const filenames = {
  mainTs: "main.ts",
  mainBlocks: "main.blocks",
  autogenerated: "autogenerated.ts",
  datasetJson: "dataset.json",
  pxtJson: "pxt.json",
  readme: "README.md",
};

// Exported for testing.
export const extensionName = "machine-learning";
const extensionURL = "github:microbit-foundation/pxt-microbit-ml#v1.0.11";

export const pxt = {
  name: untitledProjectName,
  description: "",
  dependencies: {
    core: "*",
    microphone: "*",
    radio: "*", // Needed to compile.
    [extensionName]: extensionURL,
  },
  files: Object.values(filenames),
  preferredEditor: "blocksprj",
};

export const generateProject = (
  name: string,
  actionState: DatasetEditorJsonFormat,
  model: LayersModel | undefined,
  dataWindow: DataWindow
) => {
  const { data: actions } = actionState;
  const useableActions = model ? actions : [];
  return {
    text: {
      [filenames.pxtJson]: JSON.stringify({ ...pxt, name }),
      [filenames.readme]: "",
      [filenames.mainTs]: getMainScript(useableActions, "javascript"),
      [filenames.mainBlocks]: getMainScript(useableActions, "blocks"),
      ...generateCustomFiles(actionState, model, dataWindow),
    },
  };
};

export const generateCustomFiles = (
  actionState: DatasetEditorJsonFormat,
  model: LayersModel | undefined,
  dataWindow: DataWindow,
  project?: MakeCodeProject
) => {
  const { data: actions } = actionState;
  const useableActions = model ? actions : [];

  const customFiles = {
    [filenames.autogenerated]: model
      ? getAutogeneratedTs(useableActions, model, dataWindow)
      : "",
    // Save all actions to dataset.json.
    [filenames.datasetJson]: getDatasetJson(actionState),
  };

  if (!project) {
    return customFiles;
  }

  const currentPxtJSON = project.text?.[filenames.pxtJson];
  if (currentPxtJSON) {
    try {
      const updatedPxt = JSON.parse(currentPxtJSON) as typeof pxt;
      updatedPxt.dependencies[extensionName] = extensionURL;
      return {
        ...customFiles,
        [filenames.pxtJson]: JSON.stringify(updatedPxt),
      };
    } catch (e) {
      // If we reach this case, the project is in theory already very broken
      // as it will be missing a pxt file and the extension.
    }
  }
};

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
    let sanitizedLabel = sanitizeActionLabel(actionLabel);
    if (!sanitizedLabel) {
      sanitizedLabel = `Event`;
    }
    while (actionNames.map((an) => an.actionLabel).includes(sanitizedLabel)) {
      sanitizedLabel += i;
    }
    let actionVar = upperFirst(camelCase(sanitizeActionVar(sanitizedLabel)));
    if (!actionVar) {
      actionVar = `Event`;
    }
    while (actionNames.map((an) => an.actionVar).includes(actionVar)) {
      actionVar += i;
    }
    actionNames.push({
      actionLabel: sanitizedLabel,
      actionVar,
    });
  });
  return actionNames;
};

export const hasMakeCodeMlExtension = (project: MakeCodeProject) => {
  if (!project.text || !project.text[filenames.pxtJson]) {
    return false;
  }
  const pxtJson = JSON.parse(project.text[filenames.pxtJson]) as object;
  if (!("dependencies" in pxtJson)) {
    return false;
  }
  return extensionName in (pxtJson["dependencies"] as object);
};
