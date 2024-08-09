import { GestureData } from "./gestures-hooks";
import { addIconToGestures } from "./makecode/temp";
import { generateMainScript } from "./makecode/generate-main-scripts";
import {
  generateCustomJson,
  generateCustomTs,
} from "./makecode/generate-custom-scripts";
import { TrainingCompleteMlStatus, useMlStatus } from "./ml-status-hooks";
import { useCallback, useMemo } from "react";

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

export const useMakeCodeProject = (gestures: GestureData[]) => {
  const [status] = useMlStatus();
  const model = (status as TrainingCompleteMlStatus).model;

  const defaultProjectText = useMemo(() => {
    // TODO: To remove this operation and get icon from gesture instead
    const gs = addIconToGestures(gestures);
    return {
      [ProjectFilenames.MainTs]: generateMainScript(gs, "javascript"),
      [ProjectFilenames.MainBlocks]: generateMainScript(gs, "blocks"),
      [ProjectFilenames.CustomTs]: generateCustomTs(gs, model),
      [ProjectFilenames.CustomJson]: generateCustomJson(gs),
      [ProjectFilenames.ReadMe]: "",
      [ProjectFilenames.PxtJson]: JSON.stringify(pxt),
    };
  }, [gestures, model]);
  const defaultProject = { text: defaultProjectText };

  const createGestureDefaultProject = useCallback(
    (gesture: GestureData) => {
      // TODO: To remove this operation and get icon from gesture instead
      const gs = addIconToGestures([gesture]);
      return {
        text: {
          ...defaultProjectText,
          [ProjectFilenames.MainTs]: generateMainScript(gs, "javascript"),
          [ProjectFilenames.MainBlocks]: generateMainScript(gs, "blocks"),
        },
      };
    },
    [defaultProjectText]
  );
  return {
    defaultProject,
    createGestureDefaultProject,
  };
};
