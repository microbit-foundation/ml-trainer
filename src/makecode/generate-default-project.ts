import { LayersModel } from "@tensorflow/tfjs";
import { GestureData } from "../gestures-hooks";
import { addIconToGestures } from "./temp";
import { generateMainScript } from "./generate-main-scripts";
import {
  generateCustomJson,
  generateCustomTs,
} from "./generate-custom-scripts";

enum ProjectFilenames {
  MainTs = "main.ts",
  MainBlocks = "main.blocks",
  CustomTs = "Machine_Learning_POC.ts",
  CustomJson = "Machine_Learning_POC.json",
  PxtJson = "pxt.json",
  ReadMe = "README.md",
}

const pxt = {
  name: "Untitled",
  description: "",
  dependencies: {
    core: "*",
    microphone: "*",
    radio: "*", // needed for compiling
    "Machine Learning POC":
      "github:microbit-foundation/pxt-ml-extension-poc#b5f4fcb5379c1501e8e80d96cf6cdedcdcab6c7d",
  },
  files: Object.values(ProjectFilenames),
};

export const generateDefaultProject = (
  gestures: GestureData[],
  model: LayersModel
) => {
  const gs = addIconToGestures(gestures);
  return {
    text: {
      [ProjectFilenames.MainTs]: generateMainScript(gs, "javascript"),
      [ProjectFilenames.MainBlocks]: generateMainScript(gs, "blocks"),
      [ProjectFilenames.CustomTs]: generateCustomTs(gs, model),
      [ProjectFilenames.CustomJson]: generateCustomJson(gs),
      [ProjectFilenames.ReadMe]: "",
      [ProjectFilenames.PxtJson]: JSON.stringify(pxt),
    },
  };
};
