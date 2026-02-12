/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Button } from "@chakra-ui/button";
import { Box, VStack } from "@chakra-ui/layout";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/modal";
import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  ModalCloseButton,
} from "@chakra-ui/react";
import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { FormattedMessage } from "react-intl";
import { useProjectName } from "../hooks/project-hooks";
import { validateProjectName } from "../project-utils";

interface NameProjectDialogProps {
  finalFocusRef?: React.RefObject<HTMLElement>;
  isOpen: boolean;
  onClose: () => void;
  onCloseComplete?: () => void;
  onSave: (newName: string) => void;
  projectName?: string;
  heading?: ReactNode;
  helperText?: ReactNode;
  confirmText?: ReactNode;
}

export const NameProjectDialog = ({
  finalFocusRef,
  isOpen,
  onClose,
  onCloseComplete,
  onSave,
  projectName,
  heading = <FormattedMessage id="name-project" />,
  helperText = <FormattedMessage id="name-used-when" />,
  confirmText = <FormattedMessage id="confirm-save-action" />,
}: NameProjectDialogProps) => {
  const initialName = useProjectName();
  const [name, setName] = useState<string>(projectName ?? initialName);
  const isValid = validateProjectName(name);
  const ref = useRef<HTMLInputElement>(null);
  const handleFocus = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      const input = event.target;
      input.setSelectionRange(0, input.value.length);
    },
    []
  );
  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      onSave(name);
    },
    [name, onSave]
  );

  useEffect(() => {
    if (isOpen) {
      setName(projectName ?? initialName);
    }
  }, [isOpen, projectName, initialName]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      isCentered
      finalFocusRef={finalFocusRef}
      initialFocusRef={ref}
      onCloseComplete={onCloseComplete}
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>{heading}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack>
              <Box as="form" onSubmit={handleSubmit} width="100%">
                <FormControl id="projectName" isRequired isInvalid={!isValid}>
                  <FormLabel>
                    <FormattedMessage id="name-text" />
                  </FormLabel>
                  <Input
                    ref={ref}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.currentTarget.value)}
                    onFocus={handleFocus}
                    autoComplete="off"
                  ></Input>
                  {helperText && (
                    <FormHelperText color="gray.700">
                      {helperText}
                    </FormHelperText>
                  )}
                  {!isValid && (
                    <FormErrorMessage>
                      <FormattedMessage id="project-name-not-empty" />
                    </FormErrorMessage>
                  )}
                </FormControl>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>
              <FormattedMessage id="cancel-action" />
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              ml={3}
              isDisabled={!isValid}
            >
              {confirmText}
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};
