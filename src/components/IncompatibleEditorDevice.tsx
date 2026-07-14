/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Button,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  Text,
  VStack,
} from "../shared-ui";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { useProject } from "../hooks/project-hooks";
import { ButtonWithLoading } from "./ButtonWithLoading";
import { SaveType } from "../model";

interface IncompatibleEditorDeviceProps {
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onNextLoading?: boolean;
  onBack?: () => void;
  stage: "openEditor" | "flashDevice";
}

const IncompatibleEditorDevice = ({
  isOpen,
  onClose,
  onNext,
  onNextLoading,
  onBack,
  stage,
}: IncompatibleEditorDeviceProps) => {
  const { saveHex } = useProject();
  return (
    <Modal
      isDismissable={false}
      motionless
      isOpen={isOpen}
      onClose={onClose}
      size={{ base: "full", md: "3xl" }}
      isCentered
    >
      <ModalHeader>
        <FormattedMessage id="incompatible-device-heading" />
      </ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <VStack width="100%" alignItems="left" gap={5}>
          <VStack gap={5} alignItems="stretch">
            <Text>
              <FormattedMessage
                id="incompatible-device-subtitle"
                values={{
                  link: (children) => (
                    <Link
                      color="brand.600"
                      textDecoration="underline"
                      href="https://support.microbit.org/support/solutions/articles/19000154234-which-version-of-micro-bit-do-i-have-"
                      target="_blank"
                      rel="noopener"
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
                  <FormattedMessage id="incompatible-device-body1" />
                </Text>
                <Text>
                  <FormattedMessage
                    id="incompatible-device-body2"
                    values={{
                      link: (chunks: ReactNode) => (
                        <Button
                          variant="link"
                          css={{
                            color: "brand.600",
                            textDecoration: "underline",
                          }}
                          onPress={() => saveHex(SaveType.Download)}
                        >
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
                      <Button
                        variant="link"
                        onPress={() => saveHex(SaveType.Download)}
                      >
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
      <ModalFooter>
        <Button onPress={onBack ?? onClose} variant="secondary" size="lg">
          <FormattedMessage id={onBack ? "back-action" : "cancel-action"} />
        </Button>
        <ButtonWithLoading
          onClick={onNext ?? onClose}
          variant={onNext ? "primary" : "secondary"}
          size="lg"
          isLoading={onNextLoading}
        >
          <FormattedMessage
            id={onNext ? "continue-makecode-action" : "cancel-action"}
          />
        </ButtonWithLoading>
      </ModalFooter>
    </Modal>
  );
};

export default IncompatibleEditorDevice;
