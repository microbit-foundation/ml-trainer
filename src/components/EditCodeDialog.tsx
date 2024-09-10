import {
  Box,
  Flex,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
} from "@chakra-ui/react";
import { MakeCodeFrameDriver, Project } from "@microbit/makecode-embed/react";
import { forwardRef, memo, useCallback, useRef } from "react";
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

interface EditCodeDialogProps {}

const EditCodeDialog = forwardRef<MakeCodeFrameDriver, EditCodeDialogProps>(
  function EditCodeDialog(_, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { project, writeProject, projectIOState, setProjectIOState } =
      useProject();
    const { isOpen, onClose } = useEditCodeDialog();
    const { actions } = useConnectionStage();
    const [gestures] = useGestureData();
    const gestureActions = useGestureActions();

    const handleCodeChange = useCallback(
      (project: Project) => {
        if (isOpen) {
          writeProject(project);
          const gestureData = project.text![filenames.datasetJson];
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
          const gestureData = project.text![filenames.datasetJson];
          gestureActions.validateAndSetGestures(
            JSON.parse(gestureData) as Partial<GestureData>[]
          );
          writeProject(project);
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
        if (projectIOState === "saving") {
          handleSave(download);
          setProjectIOState("inactive");
        }
      },
      [actions, handleSave, isOpen, projectIOState, setProjectIOState]
    );

    return (
      <>
        <Box
          ref={containerRef}
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
            containerRef: containerRef,
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
                    ref={ref}
                    style={{ flexGrow: 1 }}
                    version={undefined}
                    initialCode={project}
                    onCodeChange={handleCodeChange}
                    onBack={onClose}
                    onDownload={handleDownload}
                    onSave={handleSave}
                  />
                </Flex>
              </ModalBody>
            </ModalContent>
          </ModalOverlay>
        </Modal>
      </>
    );
  }
);

export default memo(EditCodeDialog);
