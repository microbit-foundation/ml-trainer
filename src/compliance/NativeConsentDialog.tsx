/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Button,
  HStack,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

interface NativeConsentDialogProps {
  isOpen: boolean;
  appNameFull: string;
  privacyPolicyLink?: string;
  onAllow: () => void;
  onDecline: () => void;
}

export const NativeConsentDialog = ({
  isOpen,
  appNameFull,
  privacyPolicyLink,
  onAllow,
  onDecline,
}: NativeConsentDialogProps) => (
  <Modal
    isOpen={isOpen}
    onClose={onDecline}
    closeOnEsc={false}
    closeOnOverlayClick={false}
    size={{ base: "full", md: "lg" }}
    isCentered
  >
    <ModalOverlay />
    <ModalContent>
      <ModalHeader fontSize="lg" fontWeight="bold">
        <FormattedMessage
          id="analytics-consent-title"
          values={{ appNameFull }}
        />
      </ModalHeader>
      <ModalBody>
        <VStack alignItems="flex-start" spacing={3}>
          <Text>
            <FormattedMessage id="analytics-consent-analytics" />
          </Text>
          <Text fontSize="sm" color="gray.600">
            <FormattedMessage id="analytics-consent-change-later" />
            {privacyPolicyLink && (
              <>
                {" "}
                <Link
                  href={privacyPolicyLink}
                  isExternal
                  rel="noopener noreferrer"
                >
                  <FormattedMessage id="analytics-consent-learn-more" />
                </Link>
              </>
            )}
          </Text>
        </VStack>
      </ModalBody>
      <ModalFooter>
        <HStack spacing={3} w="full" justify="flex-end">
          <Button variant="secondary" onClick={onDecline}>
            <FormattedMessage id="analytics-consent-decline-action" />
          </Button>
          <Button variant="primary" onClick={onAllow}>
            <FormattedMessage id="analytics-consent-allow-action" />
          </Button>
        </HStack>
      </ModalFooter>
    </ModalContent>
  </Modal>
);
