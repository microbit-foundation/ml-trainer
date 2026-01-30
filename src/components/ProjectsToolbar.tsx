import { Button, ButtonGroup } from "@chakra-ui/react";
import {
  RiDeleteBin2Line,
  RiEdit2Line,
  RiFolderOpenLine,
} from "react-icons/ri";

interface ProjectsToolbarProps {
  selectedProjectIds: string[];
  onOpenProject: (id?: string) => void;
  onRenameProject: (id?: string) => void;
  onDeleteProject: (id?: string) => void;
}

const ProjectsToolbar = ({
  selectedProjectIds,
  onOpenProject,
  onRenameProject,
  onDeleteProject,
}: ProjectsToolbarProps) => {
  return (
    <ButtonGroup>
      {selectedProjectIds.length === 1 && (
        <Button
          onClick={() => onOpenProject()}
          leftIcon={<RiFolderOpenLine />}
          borderRadius="md"
          variant="toolbar"
          _focusVisible={{ boxShadow: "outline" }}
        >
          Open
        </Button>
      )}
      {selectedProjectIds.length === 1 && (
        <Button
          onClick={() => onRenameProject()}
          leftIcon={<RiEdit2Line />}
          borderRadius="md"
          variant="toolbar"
          _focusVisible={{ boxShadow: "outline" }}
        >
          Rename
        </Button>
      )}
      {selectedProjectIds.length !== 0 && (
        <Button
          onClick={() => onDeleteProject()}
          leftIcon={<RiDeleteBin2Line />}
          borderRadius="md"
          variant="warning"
        >
          Delete
        </Button>
      )}
    </ButtonGroup>
  );
};

export default ProjectsToolbar;
