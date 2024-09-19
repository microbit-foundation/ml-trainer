import {
  Button,
  Heading,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { useProject } from "../hooks/project-hooks";

interface StartOverWardningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
}

const StartOverWarningDialog = ({
  isOpen,
  onClose,
  onStart,
}: StartOverWardningDialogProps) => {
  const { saveProjectHex } = useProject();
  return (
    <Modal
      motionPreset="none"
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      isCentered
    >
      <ModalOverlay>
        <ModalContent gap={6} p={8}>
          <ModalBody p={0}>
            <ModalCloseButton />
            <VStack width="100%" alignItems="left" gap={5}>
              <Heading as="h2" fontSize="xl" fontWeight="bold">
                <FormattedMessage id="content.index.dataWarning.title" />
              </Heading>
              <VStack gap={3} textAlign="left" w="100%">
                <Text w="100%">
                  <FormattedMessage id="content.index.dataWarning.subtitleOne" />
                </Text>
                <Text w="100%">
                  <FormattedMessage
                    id="content.index.dataWarning.subtitleTwo"
                    values={{
                      link: (chunks: ReactNode) => (
                        <Link
                          color="purple.500"
                          onClick={saveProjectHex}
                          target="_blank"
                          rel="noopener"
                        >
                          {chunks}
                        </Link>
                      ),
                    }}
                  />
                </Text>
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="end" p={0}>
            <Button onClick={onStart} variant="primary" size="lg">
              <FormattedMessage id="footer.start" />
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default StartOverWarningDialog;
