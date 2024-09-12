import { Project } from "@microbit/makecode-embed/react";
import { GestureData } from "./gestures-hooks";
import { MlStage, MlStatus } from "./ml-status-hooks";
import { create } from "zustand";
import { generateProject } from "./makecode/utils";

export interface State {
  gestures: GestureData[];
  gesturesLastModified: number;

  project: Project;
  // false if we're sure the user hasn't changed the project, otherwise true
  projectEdited: boolean;

  mlStatus: MlStatus;

  isMakeCodeOpen: boolean;

  openMakeCode(): void;
  closeMakeCode(): void;
}

export const useAppStore = create<State>()((set) => ({
  gestures: [],
  gesturesLastModified: Date.now(),

  project: generateProject({ data: [], lastModified: Date.now() }, undefined),
  projectEdited: false,

  mlStatus: { stage: MlStage.InsufficientData },

  isMakeCodeOpen: false,

  openMakeCode: () =>
    set({
      isMakeCodeOpen: true,
    }),

  closeMakeCode: () =>
    set({
      isMakeCodeOpen: false,
    }),
}));
