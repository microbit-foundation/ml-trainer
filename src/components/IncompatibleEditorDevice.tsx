import {
  Button,
  HStack,
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
import { FormattedMessage } from "react-intl";
import { useProject } from "../hooks/project-hooks";
import { ReactNode } from "react";

interface UnsupportedEditorDeviceProps {
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onBack?: () => void;
  stage: "openEditor" | "flashDevice";
}

const UnsupportedEditorDevice = ({
  isOpen,
  onClose,
  onNext,
  onBack,
  stage,
}: UnsupportedEditorDeviceProps) => {
  const { saveHex } = useProject();
  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      isCentered
    >
      <ModalOverlay>
        <ModalContent p={8}>
          <ModalBody>
            <ModalCloseButton />
            <VStack width="100%" alignItems="left" gap={5}>
              <Heading as="h2" fontSize="xl" fontWeight="bold">
                <FormattedMessage id="incompatible-device-heading" />
              </Heading>
              <VStack gap={5} align="stretch">
                <Text>
                  <FormattedMessage
                    id="incompatible-device-subtitle"
                    values={{
                      link: (children) => (
                        <Link href="https://support.microbit.org/support/solutions/articles/19000154234-which-version-of-micro-bit-do-i-have-">
                          {children}
                        </Link>
                      ),
                    }}
                  />
                </Text>
                {stage === "openEditor" ? (
                  <>
                    <Text>
                      <FormattedMessage id="incompatible-device-body-1" />
                    </Text>
                    <Text>
                      <FormattedMessage
                        id="incompatible-device-body-2"
                        values={{
                          link: (chunks: ReactNode) => (
                            <Button variant="link" onClick={() => saveHex()}>
                              {chunks}
                            </Button>
                          ),
                        }}
                      />
                    </Text>
                  </>
                ) : (
                  <Text>
                    <FormattedMessage
                      id="incompatible-device-body-alt"
                      values={{
                        link: (chunks: ReactNode) => (
                          <Button variant="link" onClick={() => saveHex()}>
                            {chunks}
                          </Button>
                        ),
                      }}
                    />
                  </Text>
                )}
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="end" px={0} pb={0}>
            <HStack gap={5}>
              <Button onClick={onBack ?? onClose} variant="secondary" size="lg">
                <FormattedMessage
                  id={onBack ? "back-action" : "cancel-action"}
                />
              </Button>
              <Button
                onClick={onNext ?? onClose}
                variant={onNext ? "primary" : "secondary"}
                size="lg"
              >
                <FormattedMessage
                  id={onNext ? "continue-makecode-action" : "cancel-action"}
                />
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default UnsupportedEditorDevice;
