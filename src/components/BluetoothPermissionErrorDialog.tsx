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
  ModalFooter,
  ModalHeader,
  Text,
  VStack,
} from "../shared-ui";
import { ReactNode, useEffect, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useDeployment } from "../deployment";
import { ButtonWithLoading } from "./ButtonWithLoading";

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
      isDismissable={false}
      motionless
      isOpen={isOpen}
      onClose={onClose}
      size={{ base: "full", md: "lg" }}
      isCentered
    >
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
                      css={{ textDecoration: "underline" }}
                      onPress={onOpenSettings}
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
      <ModalFooter>
        <HStack gap={5}>
          <Button onPress={onClose} variant="secondary" size="lg">
            <FormattedMessage id="cancel-action" />
          </Button>
          <ButtonWithLoading
            onClick={onTryAgain}
            variant="primary"
            size="lg"
            isLoading={showLoading}
          >
            <FormattedMessage id="try-again-action" />
          </ButtonWithLoading>
        </HStack>
      </ModalFooter>
    </Modal>
  );
};

export default PermissionErrorDialog;
