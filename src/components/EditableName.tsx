import {
  Button,
  Editable,
  EditableInput,
  EditablePreview,
  HStack,
  Icon,
  Tooltip,
} from "@chakra-ui/react";
import { useCallback, useRef, useState } from "react";
import { RiEditLine } from "react-icons/ri";
import { useIntl } from "react-intl";
import { useStore } from "../store";

const commonStyleProps = {
  h: 10,
  px: 2,
  borderRadius: "md",
};

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
              {...commonStyleProps}
              _hover={{
                backgroundColor,
              }}
              fontWeight="normal"
              onClick={onEdit}
              ref={ref}
              variant="unstyled"
              leftIcon={<Icon as={RiEditLine} />}
            >
              <EditablePreview
                cursor="pointer"
                w="200px"
                noOfLines={1}
                textAlign="left"
              />
            </Button>
          </Tooltip>
          <>
            <HStack
              display={isEditing ? "flex" : "none"}
              {...commonStyleProps}
              backgroundColor={backgroundColor}
            >
              <Icon as={RiEditLine} />
              <EditableInput
                aria-label={intl.formatMessage({ id: "name-text" })}
                w="200px"
                _focusVisible={{ boxShadow: "none" }}
              />
            </HStack>
          </>
        </>
      )}
    </Editable>
  );
};

export default EditableName;
