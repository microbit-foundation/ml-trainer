import {
  Flex,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
} from "@chakra-ui/react";
import { EditorProject } from "@microbit-foundation/react-editor-embed";
import { ReactNode } from "react";
import Editor from "./Editor";

interface EditCodeDialogProps {
  isOpen: boolean;
  toolbarItemsLeft?: ReactNode;
  toolbarItemsRight?: ReactNode;
  editorVersion: string | undefined;
  code: EditorProject;
  onBack: () => void;
  onDownload: (download: { name: string; hex: string }) => void;
  onSave: (save: { name: string; hex: string }) => void;
  onChange: (code: EditorProject) => void;
  extraToolbars?: ReactNode;
}

const EditCodeDialog = ({
  editorVersion,
  code,
  isOpen,
  onChange,
  onBack,
  onDownload,
  onSave,
}: EditCodeDialogProps) => {
  return (
    <Modal
      size="full"
      isOpen={isOpen}
      onClose={() => {}}
      closeOnEsc={false}
      blockScrollOnMount={false}
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
                version={editorVersion}
                initialCode={code}
                onCodeChange={onChange}
                onBack={onBack}
                onDownload={onDownload}
                onSave={onSave}
              />
            </Flex>
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default EditCodeDialog;
