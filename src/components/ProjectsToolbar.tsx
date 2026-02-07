import { Button, ButtonGroup, ButtonGroupProps } from "@chakra-ui/react";
import {
  RiCloseLine,
  RiDeleteBin2Line,
  RiEdit2Line,
  RiFileCopyLine,
} from "react-icons/ri";
import { ProjectNameDialogReason } from "../pages/ProjectsPage";
import { FormattedMessage } from "react-intl";

interface ProjectsToolbarProps extends ButtonGroupProps {
  selectedProjectIds: string[];
  onRenameDuplicateProject: (
    reason: ProjectNameDialogReason,
    id?: string
  ) => void;
  onDeleteProject: (id?: string) => void;
  onClearSelection: () => void;
}

const ProjectsToolbar = ({
  selectedProjectIds,
  onRenameDuplicateProject,
  onDeleteProject,
  onClearSelection,
  ...rest
}: ProjectsToolbarProps) => {
  const count = selectedProjectIds.length;
  const isSingle = count === 1;

  return (
    <ButtonGroup
      role="group"
      aria-label="Selection actions"
      isAttached
      variant="ghost"
      sx={{
        "& > button": { borderRadius: 0 },
        "& > button + button": {
          borderLeftWidth: "1px",
          borderColor: "gray.200",
        },
      }}
      {...rest}
    >
      {isSingle && (
        <Button
          onClick={() => onRenameDuplicateProject("rename")}
          leftIcon={<RiEdit2Line />}
          variant="ghost"
        >
          <FormattedMessage id="rename-project-action" />
        </Button>
      )}
      {isSingle && (
        <Button
          onClick={() => onRenameDuplicateProject("duplicate")}
          leftIcon={<RiFileCopyLine />}
        >
          <FormattedMessage id="duplicate-project-action" />
        </Button>
      )}
      <Button onClick={() => onDeleteProject()} leftIcon={<RiDeleteBin2Line />}>
        <FormattedMessage id="delete-project-action" values={{ count }} />
      </Button>
      <Button leftIcon={<RiCloseLine />} onClick={onClearSelection}>
        <FormattedMessage id="clear" />
      </Button>
    </ButtonGroup>
  );
};

export default ProjectsToolbar;
