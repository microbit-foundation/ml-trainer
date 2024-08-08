import {
  Flex,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
} from "@chakra-ui/react";
import { EditorProject } from "@microbit-foundation/react-editor-embed";
import { ReactNode } from "react";
import ActionBar from "./ActionBar";
import Editor from "./Editor";

interface EditCodeDialogProps {
  isOpen: boolean;
  toolbarItemsLeft?: ReactNode;
  toolbarItemsRight?: ReactNode;
  editorVersion: string | undefined;
  code: EditorProject;
  onChange: (code: EditorProject) => void;
  extraToolbars?: ReactNode;
}

const EditCodeDialog = ({
  toolbarItemsRight,
  toolbarItemsLeft,
  editorVersion,
  code,
  isOpen,
  onChange,
  extraToolbars,
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
            <ActionBar
              itemsLeft={toolbarItemsLeft}
              variant="full-screen"
              itemsRight={toolbarItemsRight}
            />
            {extraToolbars}
            <Flex flexGrow="1" flexDir="column" w="100%" bgColor="white">
              <Editor
                style={{ flexGrow: 1 }}
                version={editorVersion}
                initialCode={code}
                onCodeChange={onChange}
              />
            </Flex>
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default EditCodeDialog;
