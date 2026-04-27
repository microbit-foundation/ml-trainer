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

interface MobileConsentDialogProps {
  isOpen: boolean;
  appNameFull: string;
  privacyPolicyLink?: string;
  onAllow: () => void;
  onDecline: () => void;
}

/**
 * Single-screen consent modal for the native build, per the §Consent UX
 * section of `app-analytics-firebase.md`. Buttons are visually equal
 * weight; copy is in "usage data on your device" terms rather than
 * "cookies"; an inline reassurance points users at Settings to change
 * their mind. Dismiss-by-overlay/escape is disabled — the user must
 * make an explicit choice.
 *
 * Brand-coupled values (`appNameFull`, privacy policy URL) are passed
 * in by the provider rather than read via `useDeployment` to keep this
 * file out of the deployment ⇄ compliance import cycle.
 */
export const MobileConsentDialog = ({
  isOpen,
  appNameFull,
  privacyPolicyLink,
  onAllow,
  onDecline,
}: MobileConsentDialogProps) => (
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
