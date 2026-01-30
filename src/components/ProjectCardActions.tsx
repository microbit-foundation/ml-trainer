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
import { MdMoreVert } from "react-icons/md";
import {
  RiDeleteBin2Line,
  RiEdit2Line,
  RiFolderOpenLine,
} from "react-icons/ri";

interface ProjectCardMenuProps {
  id: string;
  isSelected: boolean;
  onSelected: (id: string) => void;
  onOpenProject: (id?: string) => void;
  onRenameProject: (id?: string) => void;
  onDeleteProject: (id?: string) => void;
}

const ProjectCardActions = ({
  id,
  isSelected,
  onSelected,
  onDeleteProject,
  onOpenProject,
  onRenameProject,
}: ProjectCardMenuProps) => {
  return (
    <HStack
      justifyContent="space-between"
      position="absolute"
      w="100%"
      p={5}
      top={0}
      left={0}
    >
      <Checkbox
        isChecked={isSelected}
        onChange={() => onSelected(id)}
        aria-selected={isSelected}
        color="brand.600"
        zIndex={1}
        opacity={isSelected ? 1 : 0}
        _groupHover={{
          opacity: 1,
        }}
        _groupFocusWithin={{
          opacity: 1,
        }}
      />
      <Menu>
        <MenuButton
          zIndex={1}
          as={IconButton}
          aria-label="project actions"
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
              onClick={() => onRenameProject(id)}
            >
              Rename
            </MenuItem>
            <MenuItem
              icon={<RiDeleteBin2Line />}
              onClick={() => onDeleteProject(id)}
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
