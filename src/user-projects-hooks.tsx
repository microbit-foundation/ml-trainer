import { GestureData } from "./gestures-hooks";
import { addIconToGestures } from "./makecode/temp";
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
      "github:microbit-foundation/pxt-ml-extension-poc#02ab65bed47884963a46f30d1cbbe27930533bdb",
  },
  files: Object.values(ProjectFilenames),
};

export const useMakeCodeProject = (gestures: GestureData[]) => {
  const [userProjects, setUserProjects] = useUserProjects();
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

  const setProject = useCallback(
    (project: MakeCodeProject | undefined) => {
      setUserProjects({ makeCode: project });
    },
    [setUserProjects]
  );

  return {
    hasStoredProject: userProjects.makeCode !== undefined,
    project: userProjects.makeCode ?? { text: defaultProjectText },
    setProject,
    createGestureDefaultProject,
  };
};