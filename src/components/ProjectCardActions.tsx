import {
  Checkbox,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
} from "@chakra-ui/react";
import { RefObject, useCallback, useRef } from "react";
import { MdMoreVert } from "react-icons/md";
import {
  RiDeleteBin2Line,
  RiEdit2Line,
  RiFileCopyLine,
  RiFolderOpenLine,
} from "react-icons/ri";
import { ProjectNameDialogReason } from "../pages/ProjectsPage";

interface ProjectCardMenuProps {
  id: string;
  isSelected: boolean;
  onSelected: (id: string) => void;
  onDeleteProject: (id?: string) => void;
  onOpenProject: (id?: string) => void;
  onRenameDuplicateProject: (
    reason: ProjectNameDialogReason,
    id?: string
  ) => void;
  setFinalFocusRef: (value: RefObject<HTMLElement>) => void;
}

const ProjectCardActions = ({
  id,
  isSelected,
  onSelected,
  onDeleteProject,
  onRenameDuplicateProject,
  onOpenProject,
  setFinalFocusRef,
}: ProjectCardMenuProps) => {
  const menuButtonRef = useRef(null);
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
      <Checkbox
        p={5}
        isChecked={isSelected}
        onChange={() => onSelected(id)}
        aria-selected={isSelected}
        color="brand.600"
        zIndex={1}
        borderColor="gray.600"
        _hover={{
          backgroundColor: "blackAlpha.50",
        }}
        borderBottomRightRadius="md"
        h="60px"
      />
      <Menu>
        <MenuButton
          ref={menuButtonRef}
          zIndex={1}
          as={IconButton}
          aria-label="project actions"
          p={5}
          h="100%"
          borderRadius={0}
          borderBottomLeftRadius="md"
          fontSize="xl"
          variant="ghost"
          icon={<MdMoreVert />}
          color="grey.800"
        />
        <Portal>
          <MenuList zIndex={1}>
            <MenuItem
              icon={<RiFolderOpenLine />}
              onClick={() => onOpenProject(id)}
            >
              Open
            </MenuItem>
            <MenuItem
              icon={<RiEdit2Line />}
              onClick={() => handleRenameProject(id)}
            >
              Rename
            </MenuItem>
            <MenuItem
              icon={<RiFileCopyLine />}
              onClick={() => handleDuplicateProject(id)}
            >
              Duplicate
            </MenuItem>
            <MenuItem
              icon={<RiDeleteBin2Line />}
              onClick={() => handleDeleteProject(id)}
            >
              Delete
            </MenuItem>
          </MenuList>
        </Portal>
      </Menu>
    </HStack>
  );
};

export default ProjectCardActions;
