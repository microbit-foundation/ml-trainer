import { LayersModel } from "@tensorflow/tfjs";
import camelCase from "lodash.camelcase";
import upperFirst from "lodash.upperfirst";

import { DatasetEditorJsonFormat, GestureData } from "../gestures-hooks";
import { getMainScript } from "./generate-main-scripts";
import { getAutogeneratedTs, getDatasetJson } from "./generate-custom-scripts";

export const filenames = {
  mainTs: "main.ts",
  mainBlocks: "main.blocks",
  autogenerated: "autogenerated.ts",
  datasetJson: "dataset.json",
  pxtJson: "pxt.json",
  readme: "README.md",
};

const pxt = {
  name: "Untitled",
  description: "",
  dependencies: {
    core: "*",
    microphone: "*",
    radio: "*", // Needed to compile.
    "machine-learning": "github:microbit-foundation/pxt-microbit-ml#v0.4.2",
  },
  files: Object.values(filenames),
  preferredEditor: "blocksprj",
};

export const generateProject = (
  gestureState: DatasetEditorJsonFormat,
  model: LayersModel | undefined,
  gestureToRenderAsBlock?: GestureData
) => {
  const { data: gestures } = gestureState;
  const useableGestures = model ? gestures : [];
  return {
    text: {
      [filenames.pxtJson]: JSON.stringify(pxt),
      [filenames.readme]: "",
      [filenames.mainTs]: getMainScript(
        useableGestures,
        "javascript",
        gestureToRenderAsBlock
      ),
      [filenames.mainBlocks]: getMainScript(
        useableGestures,
        "blocks",
        gestureToRenderAsBlock
      ),
      ...generateCustomFiles(gestureState, model),
    },
  };
};

export const generateCustomFiles = (
  gestureState: DatasetEditorJsonFormat,
  model: LayersModel | undefined
) => {
  const { data: gestures } = gestureState;
  const useableGestures = model ? gestures : [];
  return {
    [filenames.autogenerated]: model
      ? getAutogeneratedTs(useableGestures, model)
      : "",
    // Save all gestures to dataset.json.
    [filenames.datasetJson]: getDatasetJson(gestureState),
  };
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
