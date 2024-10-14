import {
  Button,
  HStack,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { useProject } from "../hooks/project-hooks";

interface UnsupportedEditorDeviceProps {
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onNextLoading?: boolean;
  onBack?: () => void;
  stage: "openEditor" | "flashDevice";
}

const UnsupportedEditorDevice = ({
  isOpen,
  onClose,
  onNext,
  onNextLoading,
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
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id="incompatible-device-heading" />
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack width="100%" alignItems="left" gap={5}>
              <VStack gap={5} align="stretch">
                <Text>
                  <FormattedMessage
                    id="incompatible-device-subtitle"
                    values={{
                      link: (children) => (
                        <Link
                          href="https://support.microbit.org/support/solutions/articles/19000154234-which-version-of-micro-bit-do-i-have-"
                          color="brand.600"
                        >
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
          <ModalFooter justifyContent="end">
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
                isLoading={onNextLoading}
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
