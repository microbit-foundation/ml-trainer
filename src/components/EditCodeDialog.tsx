import {
  Box,
  Flex,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
} from "@chakra-ui/react";
import { MakeCodeFrameDriver } from "@microbit/makecode-embed/react";
import { forwardRef, memo, useRef } from "react";
import Editor from "./Editor";
import { useStore } from "../store";

interface EditCodeDialogProps {}

const EditCodeDialog = forwardRef<MakeCodeFrameDriver, EditCodeDialogProps>(
  function EditCodeDialog(_, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const isOpen = useStore((s) => s.isEditorOpen);
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
                  <Editor ref={ref} style={{ flexGrow: 1 }} />
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
