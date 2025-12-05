import { Button, ButtonGroup } from "@chakra-ui/react";
import {
  RiDeleteBin2Line,
  RiEdit2Line,
  RiFileCopyLine,
  RiFolderOpenLine,
} from "react-icons/ri";
import { ProjectNameDialogReason } from "../pages/ProjectsPage";

interface ProjectsToolbarProps {
  selectedProjectIds: string[];
  onOpenProject: (id?: string) => void;
  onRenameDuplicateProject: (
    reason: ProjectNameDialogReason,
    id?: string
  ) => void;
  onDeleteProject: (id?: string) => void;
}

const ProjectsToolbar = ({
  selectedProjectIds,
  onOpenProject,
  onRenameDuplicateProject,
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
          onClick={() => onRenameDuplicateProject("rename")}
          leftIcon={<RiEdit2Line />}
          borderRadius="md"
          variant="toolbar"
          _focusVisible={{ boxShadow: "outline" }}
        >
          Rename
        </Button>
      )}
      {selectedProjectIds.length === 1 && (
        <Button
          onClick={() => onRenameDuplicateProject("duplicate")}
          leftIcon={<RiFileCopyLine />}
          borderRadius="md"
          variant="toolbar"
          _focusVisible={{ boxShadow: "outline" }}
        >
          Duplicate
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
