import {
  Box,
  Flex,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
} from "@chakra-ui/react";
import { MakeCodeProject } from "@microbit-foundation/react-code-view";
import {
  ActionListenerSubject,
  EditorProject,
} from "@microbit-foundation/react-editor-embed";
import { memo, useCallback, useMemo, useRef } from "react";
import { Subject } from "rxjs";
import { useConnectionStage } from "../connection-stage-hooks";
import { useEditCodeDialog } from "../hooks/use-edit-code-dialog";
import { useProject } from "../hooks/use-project";
import Editor from "./Editor";

const EditCodeDialog = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { project, writeProject, editorWrite } = useProject();
  const { isOpen, onClose } = useEditCodeDialog();
  const { actions } = useConnectionStage();
  const eventTrigger = useMemo(() => new Subject<ActionListenerSubject>(), []);

  const handleCodeChange = useCallback(
    (code: EditorProject) => {
      if (isOpen) {
        writeProject(code as MakeCodeProject);
      }
    },
    [isOpen, writeProject]
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
      await actions.startDownloadUserProjectHex(download.hex);
    },
    [actions]
  );

  return (
    <>
      <Box ref={ref} display={isOpen ? "block" : "none"} />
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
                  eventTrigger={eventTrigger}
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
