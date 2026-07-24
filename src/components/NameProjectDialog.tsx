/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
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
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  TextField,
} from "@microbit/ui";

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
      finalFocusRef={finalFocusRef}
      onCloseComplete={onCloseComplete}
    >
      <ModalHeader>{heading}</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <form onSubmit={handleSubmit}>
          <TextField
            ref={ref}
            label={<FormattedMessage id="name-text" />}
            value={name}
            onChange={setName}
            onFocus={handleFocus}
            autoFocus
            autoComplete="off"
            isRequired
            isInvalid={!isValid}
            helperText={helperText}
            helperTextCss={{ color: "gray.700" }}
            errorMessage={<FormattedMessage id="project-name-not-empty" />}
          />
        </form>
      </ModalBody>
      <ModalFooter css={{ gap: 3 }}>
        <Button onPress={onClose}>
          <FormattedMessage id="cancel-action" />
        </Button>
        <Button
          variant="primary"
          onPress={() => onSave(name)}
          isDisabled={!isValid}
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
