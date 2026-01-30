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
import { useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useProjectName } from "../hooks/project-hooks";
import { validateProjectName } from "../project-name";

interface NameProjectDialogProps {
  onClose: () => void;
  isOpen: boolean;
  onSave: (newName?: string) => void;
}

export const NameProjectDialog = ({
  onClose,
  isOpen,
  onSave,
}: NameProjectDialogProps) => {
  const initialName = useProjectName();
  const [name, setName] = useState<string>(initialName);
  const isValid = validateProjectName(name);
  const ref = useCallback((input: HTMLInputElement | null) => {
    input?.setSelectionRange(0, input.value.length);
  }, []);

  const handleSubmit = useCallback(() => {
    onSave(name);
  }, [name, onSave]);
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
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
