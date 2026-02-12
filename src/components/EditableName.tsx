import {
  Button,
  Editable,
  EditableInput,
  EditablePreview,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Tooltip,
} from "@chakra-ui/react";
import { useCallback, useRef, useState } from "react";
import { RiEditLine } from "react-icons/ri";
import { useIntl } from "react-intl";
import { useStore } from "../store";

const backgroundColor = "blackAlpha.300";

const EditableName = () => {
  const intl = useIntl();
  const getCurrentProject = useStore((s) => s.getCurrentProject);
  const renameProject = useStore((s) => s.renameProject);
  const id = useStore((s) => s.id);
  const ref = useRef<HTMLButtonElement>(null);
  const [value, setValue] = useState(getCurrentProject().header?.name);

  const handleChange = useCallback((nextValue: string) => {
    setValue(nextValue);
  }, []);

  const handleCancel = useCallback((previousValue: string) => {
    setValue(previousValue);
  }, []);

  const handleSubmit = useCallback(
    async (nextValue: string) => {
      if (id) {
        await renameProject(id, nextValue);
      }
    },
    [id, renameProject]
  );

  return (
    <Editable
      alignItems="center"
      color="white"
      display="flex"
      finalFocusRef={ref}
      m={2}
      isPreviewFocusable={false}
      onCancel={handleCancel}
      onChange={handleChange}
      onSubmit={handleSubmit}
      value={value}
    >
      {({ onEdit, isEditing }) => (
        <>
          <Tooltip
            display={!isEditing ? "flex" : "none"}
            label={intl.formatMessage({ id: "project-name-tooltip" })}
            hasArrow
            placement="bottom"
          >
            <Button
              display={!isEditing ? "flex" : "none"}
              h={10}
              px={2}
              borderRadius="md"
              _hover={{
                backgroundColor,
              }}
              fontWeight="normal"
              onClick={onEdit}
              ref={ref}
              variant="unstyled"
              leftIcon={<Icon as={RiEditLine} />}
              _focusVisible={{
                boxShadow: "outlineDark",
              }}
            >
              <EditablePreview
                cursor="pointer"
                fontSize={20}
                maxW="200px"
                w="fit-content"
                noOfLines={1}
                textAlign="left"
              />
            </Button>
          </Tooltip>
          <>
            <InputGroup
              display={isEditing ? "flex" : "none"}
              backgroundColor={backgroundColor}
              borderRadius="md"
            >
              <InputLeftElement pointerEvents="none">
                <Icon as={RiEditLine} />
              </InputLeftElement>
              <Input
                as={EditableInput}
                aria-label={intl.formatMessage({ id: "project-name-text" })}
                _focusVisible={{
                  boxShadow: "0 0 0 2px rgba(0, 0, 0, 0.5)",
                }}
              />
            </InputGroup>
          </>
        </>
      )}
    </Editable>
  );
};

export default EditableName;
