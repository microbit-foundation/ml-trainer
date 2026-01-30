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
import { FormEvent, useCallback, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useProjectName } from "../hooks/project-hooks";
import { validateProjectName } from "../project-utils";

interface NameProjectDialogProps {
  finalFocusRef?: React.RefObject<HTMLElement>;
  isOpen: boolean;
  onClose: () => void;
  onCloseComplete?: () => void;
  onSave: (newName?: string) => void;
  projectName?: string;
}

export const NameProjectDialog = ({
  finalFocusRef,
  isOpen,
  onClose,
  onCloseComplete,
  onSave,
  projectName,
}: NameProjectDialogProps) => {
  const initialName = useProjectName();
  const [name, setName] = useState<string>(initialName);
  const isValid = validateProjectName(name);
  const ref = useCallback((input: HTMLInputElement | null) => {
    input?.setSelectionRange(0, input.value.length);
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      onSave(name);
    },
    [name, onSave]
  );

  useEffect(() => {
    if (projectName !== undefined) {
      setName(projectName);
    }
  }, [projectName]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      finalFocusRef={finalFocusRef}
      onCloseComplete={onCloseComplete}
    >
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <FormattedMessage id="name-project" />
          </ModalHeader>
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
                  ></Input>
                  <FormHelperText color="gray.700">
                    <FormattedMessage id="name-used-when" />
                  </FormHelperText>
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
              <FormattedMessage id="confirm-save-action" />
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};
