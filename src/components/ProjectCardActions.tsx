import { Button, Checkbox, HStack, VisuallyHidden } from "@chakra-ui/react";
import { RefObject, useCallback, useRef } from "react";
import { MdMoreVert } from "react-icons/md";
import {
  RiDeleteBin2Line,
  RiEdit2Line,
  RiFileCopyLine,
  RiFolderOpenLine,
} from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { ProjectNameDialogReason } from "../project-utils";
import {
  Icon,
  IconButton,
  MenuItem,
  MenuList,
  MenuTrigger,
} from "../shared-ui";

interface ProjectCardMenuProps {
  id: string;
  name: string;
  isSelected?: boolean;
  onSelected?: (id: string) => void;
  onDeleteProject: (id?: string) => void;
  onOpenProject: (id?: string) => void;
  onRenameDuplicateProject: (
    reason: ProjectNameDialogReason,
    id?: string
  ) => void;
  setFinalFocusRef: (value: RefObject<HTMLElement>) => void;
  onSkipToToolbar?: () => void;
}

const ProjectCardActions = ({
  id,
  name,
  isSelected,
  onSelected,
  onDeleteProject,
  onRenameDuplicateProject,
  onOpenProject,
  setFinalFocusRef,
  onSkipToToolbar,
}: ProjectCardMenuProps) => {
  const intl = useIntl();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const handleRenameProject = useCallback(
    (id: string) => {
      setFinalFocusRef(menuButtonRef);
      onRenameDuplicateProject("rename", id);
    },
    [onRenameDuplicateProject, setFinalFocusRef]
  );

  const handleDuplicateProject = useCallback(
    (id: string) => {
      setFinalFocusRef(menuButtonRef);
      onRenameDuplicateProject("duplicate", id);
    },
    [onRenameDuplicateProject, setFinalFocusRef]
  );

  const handleDeleteProject = useCallback(
    (id: string) => {
      setFinalFocusRef(menuButtonRef);
      onDeleteProject(id);
    },
    [onDeleteProject, setFinalFocusRef]
  );

  return (
    <HStack
      justifyContent="space-between"
      position="absolute"
      w="100%"
      top={0}
      left={0}
    >
      {onSelected && (
        <Checkbox
          p={5}
          isChecked={isSelected}
          onChange={() => onSelected(id)}
          color="brand.600"
          zIndex={1}
          borderColor="gray.600"
          _hover={{
            backgroundColor: "blackAlpha.50",
          }}
          borderBottomRightRadius="md"
          h="60px"
        >
          <VisuallyHidden>
            <FormattedMessage id="select-project-action" values={{ name }} />
          </VisuallyHidden>
        </Checkbox>
      )}
      {onSkipToToolbar && (
        <Button
          tabIndex={isSelected ? 0 : -1}
          onClick={onSkipToToolbar}
          zIndex={3}
          position="absolute"
          left="50%"
          top={1}
          transform="translateX(-50%)"
          size="xs"
          variant="primary"
          opacity={0}
          pointerEvents="none"
          _focusVisible={{
            opacity: 1,
            pointerEvents: "auto",
            boxShadow:
              "0 0 0 2px white, 0 0 0 4px var(--chakra-colors-brand-500)",
          }}
        >
          <FormattedMessage id="project-skip-to-toolbar" />
        </Button>
      )}
      <MenuTrigger>
        <IconButton
          ref={menuButtonRef}
          aria-label={intl.formatMessage(
            { id: "project-menu-action" },
            { name }
          )}
          variant="ghost"
          css={{
            zIndex: 1,
            px: 5,
            py: 5,
            h: "100%",
            borderRadius: 0,
            borderBottomLeftRadius: "md",
            fontSize: "xl",
            ml: "auto",
          }}
        >
          <Icon as={MdMoreVert} />
        </IconButton>
        <MenuList>
          <MenuItem
            icon={<Icon as={RiFolderOpenLine} />}
            onAction={() => onOpenProject(id)}
            textValue={intl.formatMessage({ id: "open-project-action" })}
          >
            <FormattedMessage id="open-project-action" />
          </MenuItem>
          <MenuItem
            icon={<Icon as={RiEdit2Line} />}
            onAction={() => handleRenameProject(id)}
            textValue={intl.formatMessage({ id: "rename-project-action" })}
          >
            <FormattedMessage id="rename-project-action" />
          </MenuItem>
          <MenuItem
            icon={<Icon as={RiFileCopyLine} />}
            onAction={() => handleDuplicateProject(id)}
            textValue={intl.formatMessage({ id: "duplicate-project-action" })}
          >
            <FormattedMessage id="duplicate-project-action" />
          </MenuItem>
          <MenuItem
            icon={<Icon as={RiDeleteBin2Line} />}
            onAction={() => handleDeleteProject(id)}
            textValue={intl.formatMessage(
              { id: "delete-project-action" },
              { count: 1 }
            )}
          >
            <FormattedMessage
              id="delete-project-action"
              values={{ count: 1 }}
            />
          </MenuItem>
        </MenuList>
      </MenuTrigger>
    </HStack>
  );
};

export default ProjectCardActions;
