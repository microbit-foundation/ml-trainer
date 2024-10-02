import {
  Button,
  HStack,
  Heading,
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import { RiExternalLinkLine } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import Link from "./Link";

interface BrokenFirmwareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTryAgain: () => void;
  onSkip: () => void;
}

const BrokenFirmwareDialog = ({
  isOpen,
  onClose,
  onSkip,
  onTryAgain,
}: BrokenFirmwareDialogProps) => {
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
            <VStack width="100%" alignItems="left" gap={5}>
              <Heading as="h2" fontSize="xl" fontWeight="bold">
                <FormattedMessage id="connectMB.usb.firmwareBroken.heading" />
              </Heading>
              <VStack gap={5} textAlign="left" w="100%">
                <Text w="100%">
                  <FormattedMessage id="connectMB.usb.firmwareBroken.content1" />
                </Text>
                <Text w="100%">
                  <FormattedMessage
                    id="connectMB.usb.firmwareBroken.content2"
                    values={{
                      link: (chunks: ReactNode) => (
                        <Link
                          color="blue.600"
                          href="https://microbit.org/get-started/user-guide/firmware/"
                          target="_blank"
                          rel="noopener"
                        >
                          {chunks}
                        </Link>
                      ),
                    }}
                  />
                </Text>
                <Text w="100%">
                  <Link
                    color="blue.600"
                    href="https://microbit.org/get-started/user-guide/firmware/"
                    target="_blank"
                    rel="noopener"
                    display="flex"
                    flexDirection="row"
                    gap={1}
                  >
                    <FormattedMessage id="connectMB.usb.firmwareBroken.content3" />
                    <Icon
                      as={RiExternalLinkLine}
                      boxSize={5}
                      color="blue.600"
                      position="relative"
                    />
                  </Link>
                </Text>
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="end" p={0}>
            <HStack gap={5}>
              <Button onClick={onClose} variant="secondary" size="lg">
                <FormattedMessage id="cancel-action" />
              </Button>
              <Button onClick={onSkip} variant="secondary" size="lg">
                <FormattedMessage id="connectMB.usb.firmwareBroken.skip" />
              </Button>
              <Button onClick={onTryAgain} variant="primary" size="lg">
                <FormattedMessage id="connectMB.tryAgain" />
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default BrokenFirmwareDialog;
