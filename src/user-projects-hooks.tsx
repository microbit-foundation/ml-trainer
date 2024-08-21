import { GestureData, useGestureData } from "./gestures-hooks";
import { generateMainScript } from "./makecode/generate-main-scripts";
import {
  generateCustomJson,
  generateCustomTs,
} from "./makecode/generate-custom-scripts";
import { TrainingCompleteMlStatus, useMlStatus } from "./ml-status-hooks";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { MakeCodeProject } from "@microbit-foundation/react-code-view";
import { useStorage } from "./hooks/use-storage";
interface UserProjectsContextState {
  makeCode?: MakeCodeProject;
}

type UserProjectsContextValue = [
  UserProjectsContextState,
  (userProjects: UserProjectsContextState) => void
];

const UserProjectsContext = createContext<UserProjectsContextValue | undefined>(
  undefined
);

export const UserProjectsProvider = ({ children }: { children: ReactNode }) => {
  const userProjectsContextValue = useStorage<UserProjectsContextState>(
    "local",
    "makecodeProject",
    { makeCode: undefined }
  );
  return (
    <UserProjectsContext.Provider value={userProjectsContextValue}>
      {children}
    </UserProjectsContext.Provider>
  );
};

const useUserProjects = (): UserProjectsContextValue => {
  const userProjects = useContext(UserProjectsContext);
  if (!userProjects) {
    throw new Error("Missing provider");
  }
  return userProjects;
};

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
      "github:microbit-foundation/pxt-ml-extension-poc#9f843b8f94d0cc5e6c5ec0d020463fb080caf724",
  },
  files: Object.values(ProjectFilenames),
};

export const useMakeCodeProject = () => {
  const [gestureData] = useGestureData();
  const [userProjects, setUserProjects] = useUserProjects();
  const [status] = useMlStatus();
  const model = (status as TrainingCompleteMlStatus).model;
  const gestures = gestureData.data;

  const defaultProjectText = useMemo(() => {
    return {
      [ProjectFilenames.MainTs]: generateMainScript(gestures, "javascript"),
      [ProjectFilenames.MainBlocks]: generateMainScript(gestures, "blocks"),
      [ProjectFilenames.CustomTs]: generateCustomTs(gestures, model),
      [ProjectFilenames.CustomJson]: generateCustomJson(gestures),
      [ProjectFilenames.ReadMe]: "",
      [ProjectFilenames.PxtJson]: JSON.stringify(pxt),
    };
  }, [gestures, model]);

  const createGestureDefaultProject = useCallback(
    (gesture: GestureData) => {
      const gs = [gesture];
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

  const setProject = useCallback(
    (project: MakeCodeProject | undefined) => {
      setUserProjects({ makeCode: project });
    },
    [setUserProjects]
  );

  const userProject = useMemo(
    () => userProjects.makeCode ?? { text: defaultProjectText },
    [defaultProjectText, userProjects.makeCode]
  );

  const hasStoredProject = useMemo(
    () => userProjects.makeCode !== undefined,
    [userProjects.makeCode]
  );

  return {
    hasStoredProject,
    createGestureDefaultProject,
    userProject,
    setUserProject: setProject,
  };
};
