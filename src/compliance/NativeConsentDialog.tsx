/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { FormattedMessage } from "react-intl";
import {
  Button,
  HStack,
  Link,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Text,
  VStack,
} from "@microbit/ui";

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
}: NativeConsentDialogProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onDecline}
      isKeyboardDismissDisabled
      isDismissable={false}
      size="lg"
      isCentered
    >
      <ModalHeader css={{ fontSize: "lg", fontWeight: "bold" }}>
        <FormattedMessage
          id="analytics-consent-title"
          values={{ appNameFull }}
        />
      </ModalHeader>
      <ModalBody>
        <VStack alignItems="flex-start" gap={3}>
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
                  target="_blank"
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
        <HStack gap={3} w="full" justify="flex-end">
          <Button variant="secondary" onPress={onDecline}>
            <FormattedMessage id="analytics-consent-decline-action" />
          </Button>
          <Button variant="primary" onPress={onAllow}>
            <FormattedMessage id="analytics-consent-allow-action" />
          </Button>
        </HStack>
      </ModalFooter>
    </Modal>
  );
};
