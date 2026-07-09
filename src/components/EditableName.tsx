/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  MutableRefObject,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { RiEditLine } from "react-icons/ri";
import { useIntl } from "react-intl";
import {
  Button,
  css,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  SystemStyleObject,
  Text,
  Tooltip,
} from "../shared-ui";
import { useLogging } from "../logging/logging-hooks";
import { useStore } from "../store";

interface EditableNameProps {
  suffix?: ReactNode;
  variant?: "toolbar" | "drawer";
  onEditRef?: MutableRefObject<(() => void) | undefined>;
}

// Shared by both variants' single-css()-call styles (gotcha #8).
const previewButtonBase: SystemStyleObject = {
  display: "flex",
  h: 10,
  p: 1.5,
  borderRadius: "md",
  minW: 0,
  overflow: "hidden",
  fontWeight: "normal",
};

/**
 * The editable project name. Replaces Chakra's Editable: a preview button
 * that swaps to an input; Enter/blur commits, Escape reverts.
 */
const EditableName = ({
  suffix,
  variant = "toolbar",
  onEditRef,
}: EditableNameProps) => {
  const intl = useIntl();
  const getCurrentProject = useStore((s) => s.getCurrentProject);
  const renameProject = useStore((s) => s.setProjectName);
  const id = useStore((s) => s.id);
  const logging = useLogging();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const projectName = getCurrentProject().header?.name;
  const [value, setValue] = useState(projectName);
  const [editing, setEditing] = useState<boolean>(false);
  const valueOnEditStart = useRef(projectName);
  const cancelled = useRef(false);

  const startEditing = useCallback(() => {
    valueOnEditStart.current = value;
    setEditing(true);
  }, [value]);
  if (onEditRef) {
    onEditRef.current = startEditing;
  }

  useEffect(() => {
    if (editing) {
      // Select-all like Chakra's Editable, so typing replaces the name.
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const finishEditing = useCallback(() => {
    setEditing(false);
    // After the preview button remounts.
    requestAnimationFrame(() => buttonRef.current?.focus());
  }, []);

  const handleSubmit = useCallback(async () => {
    finishEditing();
    if (id) {
      if (value !== projectName) {
        logging.event({
          type: "project_rename",
          detail: { surface: "toolbar" },
        });
      }
      await renameProject(value ?? "", id);
    }
  }, [finishEditing, id, logging, projectName, renameProject, value]);

  const handleCancel = useCallback(() => {
    setValue(valueOnEditStart.current);
    finishEditing();
  }, [finishEditing]);

  useEffect(() => {
    // Sync changes in project name outside of this component.
    if (!editing && projectName !== value) {
      setValue(projectName);
    }
  }, [projectName, value, editing]);

  const previewButton = (
    <Button
      ref={buttonRef}
      variant="unstyled"
      onPress={startEditing}
      {...(variant === "drawer"
        ? { rightIcon: <Icon as={RiEditLine} /> }
        : { leftIcon: <Icon as={RiEditLine} /> })}
      css={
        variant === "drawer"
          ? {
              ...previewButtonBase,
              pl: 0,
              _focusVisible: { boxShadow: "outline" },
            }
          : {
              ...previewButtonBase,
              _hover: { backgroundColor: "blackAlpha.300" },
              _focusVisible: {
                boxShadow: "inset token(shadows.outlineDark)",
              },
            }
      }
    >
      <Text
        as="span"
        cursor="pointer"
        fontSize={variant === "drawer" ? "16px" : "20px"}
        w="fit-content"
        textAlign="left"
        truncate
      >
        {value}
      </Text>
    </Button>
  );

  return (
    <HStack
      justifyContent="center"
      color={variant === "drawer" ? "gray.800" : "white"}
      display="flex"
      w="100%"
      gap={0}
    >
      <HStack
        gap={0}
        w={variant === "drawer" ? "100%" : undefined}
        overflow={variant === "drawer" ? undefined : "hidden"}
      >
        {editing ? (
          <InputGroup
            backgroundColor={
              variant === "drawer" ? "blackAlpha.100" : "blackAlpha.300"
            }
            borderRadius="md"
            minW={variant === "drawer" ? undefined : "250px"}
            w={variant === "drawer" ? "100%" : undefined}
          >
            {variant !== "drawer" && (
              <InputLeftElement pointerEvents="none">
                <Icon as={RiEditLine} />
              </InputLeftElement>
            )}
            <Input
              ref={inputRef}
              value={value ?? ""}
              aria-label={intl.formatMessage({ id: "project-name-text" })}
              onChange={(e) => setValue(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  inputRef.current?.blur();
                } else if (e.key === "Escape") {
                  cancelled.current = true;
                  handleCancel();
                }
              }}
              onBlur={() => {
                if (cancelled.current) {
                  cancelled.current = false;
                  return;
                }
                void handleSubmit();
              }}
              css={{
                bg: "transparent",
                color: "inherit",
                pl: variant === "drawer" ? 3 : 10,
                _focusVisible: {
                  boxShadow: "0 0 0 2px rgba(0, 0, 0, 0.5)",
                },
              }}
            />
          </InputGroup>
        ) : (
          <>
            {variant === "drawer" ? (
              previewButton
            ) : (
              <Tooltip
                content={intl.formatMessage({ id: "project-name-tooltip" })}
                hasArrow
                placement="bottom"
              >
                {previewButton}
              </Tooltip>
            )}
            {suffix && (
              <HStack
                gap={0}
                flexShrink={0}
                className={css({ marginInlineStart: -1.5 })}
              >
                {suffix}
              </HStack>
            )}
          </>
        )}
      </HStack>
    </HStack>
  );
};

export default EditableName;
