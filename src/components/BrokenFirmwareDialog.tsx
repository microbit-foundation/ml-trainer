/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Button,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import { RiExternalLinkLine } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import Link from "./Link";
import { useDeployment } from "../deployment";

interface BrokenFirmwareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTryAgain: () => void;
}

const BrokenFirmwareDialog = ({
  isOpen,
  onClose,
  onTryAgain,
}: BrokenFirmwareDialogProps) => {
  const { supportLinks } = useDeployment();
  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      isOpen={isOpen}
      onClose={onClose}
      size={{ base: "full", md: "3xl" }}
      isCentered
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id="firmware-outdated-heading" />
          </ModalHeader>
          <ModalBody>
            <VStack gap={5} textAlign="left" w="100%">
              <Text w="100%">
                <FormattedMessage id="firmware-outdated-content1" />
              </Text>
              <Text w="100%">
                <FormattedMessage
                  id="firmware-outdated-content2"
                  values={{
                    link: (chunks: ReactNode) => (
                      <Link
                        color="brand.600"
                        textDecoration="underline"
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
                  color="brand.600"
                  textDecoration="underline"
                  href={supportLinks.troubleshooting}
                  target="_blank"
                  rel="noopener"
                  display="flex"
                  flexDirection="row"
                  gap={1}
                >
                  <FormattedMessage id="connect-troubleshoot" />
                  <Icon
                    as={RiExternalLinkLine}
                    boxSize={5}
                    color="brand.600"
                    position="relative"
                  />
                </Link>
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="end">
            <HStack gap={5}>
              <Button onClick={onClose} variant="secondary" size="lg">
                <FormattedMessage id="cancel-action" />
              </Button>
              <Button onClick={onTryAgain} variant="primary" size="lg">
                <FormattedMessage id="try-again-action" />
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default BrokenFirmwareDialog;
