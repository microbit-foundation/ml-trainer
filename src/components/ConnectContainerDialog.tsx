import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
} from "@chakra-ui/modal";
import {
  Button,
  HStack,
  Heading,
  ModalCloseButton,
  VStack,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";

export interface ConnectContainerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  headingId: string;
  footerLeft?: ReactNode;
  onNextClick?: () => void;
  children: ReactNode;
  onBackClick?: () => void;
  additionalActions?: ReactNode;
}

const ConnectContainerDialog = ({
  isOpen,
  onClose,
  headingId,
  footerLeft,
  onNextClick,
  onBackClick,
  additionalActions,
  children,
}: ConnectContainerDialogProps) => {
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
                <FormattedMessage id={headingId} />
              </Heading>
              {children}
            </VStack>
          </ModalBody>
          <ModalFooter
            justifyContent={footerLeft ? "space-between" : "end"}
            p={0}
          >
            {footerLeft && footerLeft}
            <HStack gap={5}>
              {onBackClick && (
                <Button onClick={onBackClick} variant="secondary" size="lg">
                  <FormattedMessage id="back-action" />
                </Button>
              )}
              {additionalActions && additionalActions}
              {onNextClick && (
                <Button onClick={onNextClick} variant="primary" size="lg">
                  <FormattedMessage id="connectMB.nextButton" />
                </Button>
              )}
            </HStack>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default ConnectContainerDialog;
