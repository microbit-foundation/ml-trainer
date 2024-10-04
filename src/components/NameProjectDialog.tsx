/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Button } from "@chakra-ui/button";
import { Box, Text, VStack } from "@chakra-ui/layout";
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
} from "@chakra-ui/react";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useStore } from "../store";

interface NameProjectDialogProps {
  onClose: () => void;
  isOpen: boolean;
  onSave: () => void;
}

type ValidationResult = "valid" | "project name empty";

const validateProjectName = (name: string): ValidationResult => {
  return name.trim().length === 0 ? "project name empty" : "valid";
};

export const NameProjectDialog = ({
  onClose,
  isOpen,
  onSave,
}: NameProjectDialogProps) => {
  const project = useStore((s) => s.project);
  const updateProjectName = useStore((s) => s.updateProjectName);
  const initialName = project.header?.name || "";
  const [name, setName] = useState<string>(initialName);
  const validationResult = useMemo(() => validateProjectName(name), [name]);
  const isValid = validationResult === "valid";

  const handleNameOnChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setName(value);
      if (validateProjectName(value) === "valid") {
        updateProjectName(value);
      }
    },
    [updateProjectName]
  );

  const handleSubmit = useCallback(() => {
    onSave();
  }, [onSave]);
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <Text as="h2" fontSize="lg" fontWeight="bold">
              <FormattedMessage id="name-project" />
            </Text>
          </ModalHeader>
          <ModalBody>
            <VStack>
              <Box as="form" onSubmit={handleSubmit} width="100%">
                <FormControl id="fileName" isRequired isInvalid={!isValid}>
                  <FormLabel>
                    <FormattedMessage id="name-text" />
                  </FormLabel>
                  <Input
                    type="text"
                    value={name}
                    onChange={handleNameOnChange}
                  ></Input>
                  <FormHelperText color="gray.700">
                    <FormattedMessage id="name-used-when" />
                  </FormHelperText>
                  {validationResult === "project name empty" && (
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
              variant="solid"
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
