import {
  Button,
  Editable,
  EditableInput,
  EditablePreview,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Tooltip,
  useToken,
} from "@chakra-ui/react";
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
import { useStore } from "../store";

interface EditableNameProps {
  suffix?: ReactNode;
  variant?: "toolbar" | "drawer";
  onEditRef?: MutableRefObject<(() => void) | undefined>;
}

const EditableName = ({
  suffix,
  variant = "toolbar",
  onEditRef,
}: EditableNameProps) => {
  const outlineDark = useToken("shadows", "outlineDark");
  const styles = {
    toolbar: {
      color: "white",
      backgroundColor: "blackAlpha.300",
      focusShadow: `inset ${outlineDark}`,
      fontSize: 20,
    },
    drawer: {
      color: "gray.800",
      backgroundColor: "blackAlpha.100",
      focusShadow: "outline",
      fontSize: 16,
    },
  }[variant];
  const intl = useIntl();
  const getCurrentProject = useStore((s) => s.getCurrentProject);
  const renameProject = useStore((s) => s.setProjectName);
  const id = useStore((s) => s.id);
  const ref = useRef<HTMLButtonElement>(null);
  const projectName = getCurrentProject().header?.name;
  const [value, setValue] = useState(projectName);
  const [editing, setEditing] = useState<boolean>(false);

  const handleChange = useCallback((nextValue: string) => {
    setValue(nextValue);
    setEditing(true);
  }, []);

  const handleCancel = useCallback((previousValue: string) => {
    setValue(previousValue);
    setEditing(false);
  }, []);

  const handleSubmit = useCallback(
    async (nextValue: string) => {
      if (id) {
        await renameProject(nextValue, id);
        setEditing(false);
      }
    },
    [id, renameProject]
  );

  useEffect(() => {
    // Sync changes in project name outside of this component.
    if (!editing && projectName !== value) {
      setValue(projectName);
    }
  }, [projectName, value, editing]);

  return (
    <Editable
      justifyContent="center"
      color={styles.color}
      display="flex"
      w="100%"
      finalFocusRef={ref}
      isPreviewFocusable={false}
      onCancel={handleCancel}
      onChange={handleChange}
      onSubmit={handleSubmit}
      value={value}
    >
      {({ onEdit, isEditing }) => {
        if (onEditRef) {
          onEditRef.current = onEdit;
        }
        return (
          <HStack
            spacing={0}
            w={variant === "drawer" ? "100%" : undefined}
            overflow={variant === "drawer" ? undefined : "hidden"}
          >
            {isEditing ? (
              <InputGroup
                backgroundColor={styles.backgroundColor}
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
                  as={EditableInput}
                  pl={variant === "drawer" ? 3 : undefined}
                  aria-label={intl.formatMessage({ id: "project-name-text" })}
                  _focusVisible={{
                    boxShadow: "0 0 0 2px rgba(0, 0, 0, 0.5)",
                  }}
                />
              </InputGroup>
            ) : (
              <>
                <Tooltip
                  label={intl.formatMessage({ id: "project-name-tooltip" })}
                  hasArrow
                  placement="bottom"
                  isDisabled={variant === "drawer"}
                >
                  <Button
                    display="flex"
                    h={10}
                    p={1.5}
                    pl={variant === "drawer" ? 0 : 1.5}
                    borderRadius="md"
                    minW={0}
                    overflow="hidden"
                    _hover={
                      variant === "drawer"
                        ? {}
                        : { backgroundColor: styles.backgroundColor }
                    }
                    fontWeight="normal"
                    onClick={onEdit}
                    ref={ref}
                    variant="unstyled"
                    {...(variant === "drawer"
                      ? { rightIcon: <Icon as={RiEditLine} /> }
                      : { leftIcon: <Icon as={RiEditLine} /> })}
                    _focusVisible={{
                      boxShadow: styles.focusShadow,
                    }}
                  >
                    <EditablePreview
                      cursor="pointer"
                      fontSize={styles.fontSize}
                      w="fit-content"
                      noOfLines={1}
                      textAlign="left"
                    />
                  </Button>
                </Tooltip>
                {suffix && (
                  <HStack spacing={0} marginInlineStart={-1.5} flexShrink={0}>
                    {suffix}
                  </HStack>
                )}
              </>
            )}
          </HStack>
        );
      }}
    </Editable>
  );
};

export default EditableName;
