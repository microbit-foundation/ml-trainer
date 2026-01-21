/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ReactNode, useEffect, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useDeployment } from "../deployment";

export interface PermissionErrorDialogProps {
  headingId: string;
  bodyId: string;
  isOpen: boolean;
  onClose: () => void;
  onTryAgain: () => void;
  onOpenSettings?: () => void;
  /**
   * Whether a permission check is in progress.
   * Shows loading state on the "Try Again" button.
   */
  isCheckingPermissions: boolean;
}

const PermissionErrorDialog = ({
  headingId,
  bodyId,
  isOpen,
  onClose,
  onTryAgain,
  onOpenSettings,
  isCheckingPermissions,
}: PermissionErrorDialogProps) => {
  const { appNameShort } = useDeployment();

  // Ensure spinner shows for minimum 200ms so it's perceivable
  const loadingStartRef = useRef<number>(0);
  const [showLoading, setShowLoading] = useState(false);
  useEffect(() => {
    if (isCheckingPermissions) {
      loadingStartRef.current = Date.now();
      setShowLoading(true);
    } else if (showLoading) {
      const elapsed = Date.now() - loadingStartRef.current;
      const remaining = Math.max(0, 200 - elapsed);
      const timer = setTimeout(() => setShowLoading(false), remaining);
      return () => clearTimeout(timer);
    }
  }, [isCheckingPermissions, showLoading]);

  return (
    <Modal
      closeOnOverlayClick={false}
      motionPreset="none"
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      isCentered
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id={headingId} />
          </ModalHeader>
          <ModalBody>
            <VStack width="100%" alignItems="left" gap={5}>
              <Text textAlign="left" w="100%">
                {onOpenSettings ? (
                  <FormattedMessage
                    id={bodyId}
                    values={{
                      appNameShort,
                      link: (chunks: ReactNode) => (
                        <Button
                          variant="link"
                          textDecoration="underline"
                          onClick={onOpenSettings}
                        >
                          {chunks}
                        </Button>
                      ),
                    }}
                  />
                ) : (
                  <FormattedMessage id={bodyId} />
                )}
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="end">
            <HStack gap={5}>
              <Button onClick={onClose} variant="secondary" size="lg">
                <FormattedMessage id="cancel-action" />
              </Button>
              <Button
                onClick={onTryAgain}
                variant="primary"
                size="lg"
                isLoading={showLoading}
              >
                <FormattedMessage id="try-again-action" />
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default PermissionErrorDialog;
