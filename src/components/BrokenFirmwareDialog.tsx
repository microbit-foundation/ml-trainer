/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Text,
  VStack,
} from "../shared-ui";
import { ReactNode } from "react";
import ExternalLink from "./ExternalLink";
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
      isDismissable={false}
      motionless
      isOpen={isOpen}
      onClose={onClose}
      size={{ base: "full", md: "3xl" }}
      isCentered
    >
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
            <ExternalLink
              textId="connect-troubleshoot"
              href={supportLinks.troubleshooting}
            />
          </Text>
        </VStack>
      </ModalBody>
      <ModalFooter>
        <Button onPress={onClose} variant="secondary" size="lg">
          <FormattedMessage id="cancel-action" />
        </Button>
        <Button onPress={onTryAgain} variant="primary" size="lg">
          <FormattedMessage id="try-again-action" />
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default BrokenFirmwareDialog;
