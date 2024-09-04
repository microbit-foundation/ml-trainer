import {
  Box,
  Flex,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
} from "@chakra-ui/react";
import { MakeCodeProject } from "@microbit-foundation/react-code-view";
import { EditorProject } from "@microbit-foundation/react-editor-embed";
import { memo, useCallback, useRef } from "react";
import { useConnectionStage } from "../connection-stage-hooks";
import {
  GestureContextState,
  GestureData,
  useGestureActions,
  useGestureData,
} from "../gestures-hooks";
import { useEditCodeDialog } from "../hooks/use-edit-code-dialog";
import { filenames } from "../makecode/utils";
import { useProject } from "../user-projects-hooks";
import Editor from "./Editor";

const EditCodeDialog = () => {
  const ref = useRef<HTMLDivElement>(null);
  const {
    project,
    writeProject,
    editorWrite,
    editorEventTrigger,
    projectIOState,
    setProjectIOState,
  } = useProject();
  const { isOpen, onClose } = useEditCodeDialog();
  const { actions } = useConnectionStage();
  const [gestures] = useGestureData();
  const gestureActions = useGestureActions();

  const handleCodeChange = useCallback(
    (code: EditorProject) => {
      if (isOpen) {
        const project = code as MakeCodeProject;
        writeProject(project);
        const gestureData = project.text[filenames.datasetJson];
        if (gestureData) {
          const parsedGestureData = JSON.parse(
            gestureData
          ) as GestureContextState;
          if (parsedGestureData.lastModified !== gestures.lastModified) {
            gestureActions.validateAndSetGestures(parsedGestureData.data);
          }
        }
      }
      // TODO: Test this code after switching to new react-editor-embed version.
      if (projectIOState === "importing") {
        const gestureData = (code as MakeCodeProject).text[
          filenames.datasetJson
        ];
        gestureActions.validateAndSetGestures(
          JSON.parse(gestureData) as Partial<GestureData>[]
        );
        writeProject(code as MakeCodeProject);
        setProjectIOState("inactive");
      }
    },
    [
      gestureActions,
      gestures.lastModified,
      isOpen,
      projectIOState,
      setProjectIOState,
      writeProject,
    ]
  );

  const handleSave = useCallback((save: { name: string; hex: string }) => {
    const blob = new Blob([save.hex], { type: "application/octet-stream" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${save.name}.hex`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, []);

  const handleDownload = useCallback(
    async (download: { name: string; hex: string }) => {
      if (isOpen) {
        await actions.startDownloadUserProjectHex(download.hex);
      }
      if (projectIOState === "downloading") {
        handleSave(download);
        setProjectIOState("inactive");
      }
    },
    [actions, handleSave, isOpen, projectIOState, setProjectIOState]
  );

  return (
    <>
      <Box
        ref={ref}
        transform={isOpen ? undefined : "translate(-150vw, -150vh)"}
        visibility={isOpen ? "visible" : "hidden"}
      />
      <Modal
        size="full"
        isOpen={true}
        onClose={() => {}}
        closeOnEsc={false}
        blockScrollOnMount={false}
        portalProps={{
          containerRef: ref,
        }}
      >
        <ModalOverlay>
          <ModalContent>
            <ModalBody
              p={0}
              display="flex"
              alignItems="stretch"
              flexDir="column"
              justifyContent="stretch"
            >
              <Flex flexGrow="1" flexDir="column" w="100%" bgColor="white">
                <Editor
                  style={{ flexGrow: 1 }}
                  version={undefined}
                  initialCode={project}
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment
                  getWriter={(writeFn) => (editorWrite.current = writeFn)}
                  onCodeChange={handleCodeChange}
                  onBack={onClose}
                  onDownload={handleDownload}
                  onSave={handleSave}
                  eventTrigger={editorEventTrigger}
                />
              </Flex>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </>
  );
};

export default memo(EditCodeDialog);
