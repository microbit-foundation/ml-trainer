/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  RiCloseLine,
  RiDeleteBin2Line,
  RiEdit2Line,
  RiFileCopyLine,
} from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { ProjectNameDialogReason } from "../project-utils";
import { Button, ButtonGroup, Icon, IconButton } from "@microbit/ui";

interface ProjectsToolbarProps {
  selectedProjectIds: string[];
  onRenameDuplicateProject: (
    reason: ProjectNameDialogReason,
    id?: string
  ) => void;
  onDeleteProject: (id?: string) => void;
  onClearSelection: () => void;
  iconOnly?: boolean;
  /** Attached: square buttons with hairline dividers (default true). */
  isAttached?: boolean;
  size?: "md" | "lg";
}

const ProjectsToolbar = ({
  selectedProjectIds,
  onRenameDuplicateProject,
  onDeleteProject,
  onClearSelection,
  iconOnly,
  isAttached = true,
  size,
}: ProjectsToolbarProps) => {
  const count = selectedProjectIds.length;
  const isSingle = count === 1;
  const intl = useIntl();

  return (
    <ButtonGroup
      isAttached={isAttached}
      role="group"
      aria-label={intl.formatMessage({ id: "selection-actions-group" })}
      css={
        isAttached
          ? // A squared strip with drawn dividers, not the shared group's
            // pill with a gap: `ghost` buttons have no fill for a gap to
            // separate, so at rest nothing would mark the cells at all.
            // App-local until a second consumer wants this toolbar shape.
            {
              "& > button": { borderRadius: 0 },
              "& > button + button": {
                borderLeft: "1px solid",
                borderColor: "gray.200",
              },
            }
          : undefined
      }
    >
      {isSingle &&
        (iconOnly ? (
          <IconButton
            variant="ghost"
            size={size}
            onPress={() => onRenameDuplicateProject("rename")}
            css={{ fontSize: "xl" }}
            aria-label={intl.formatMessage({ id: "rename-project-action" })}
          >
            <Icon as={RiEdit2Line} />
          </IconButton>
        ) : (
          <Button
            variant="ghost"
            size={size}
            onPress={() => onRenameDuplicateProject("rename")}
            startIcon={<Icon as={RiEdit2Line} />}
          >
            <FormattedMessage id="rename-project-action" />
          </Button>
        ))}
      {isSingle &&
        (iconOnly ? (
          <IconButton
            variant="ghost"
            size={size}
            onPress={() => onRenameDuplicateProject("duplicate")}
            css={{ fontSize: "xl" }}
            aria-label={intl.formatMessage({
              id: "duplicate-project-action",
            })}
          >
            <Icon as={RiFileCopyLine} />
          </IconButton>
        ) : (
          <Button
            variant="ghost"
            size={size}
            onPress={() => onRenameDuplicateProject("duplicate")}
            startIcon={<Icon as={RiFileCopyLine} />}
          >
            <FormattedMessage id="duplicate-project-action" />
          </Button>
        ))}
      {iconOnly && isSingle ? (
        <IconButton
          variant="ghost"
          size={size}
          onPress={() => onDeleteProject()}
          css={{ fontSize: "xl" }}
          aria-label={intl.formatMessage(
            { id: "delete-project-action" },
            { count }
          )}
        >
          <Icon as={RiDeleteBin2Line} />
        </IconButton>
      ) : (
        <Button
          variant="ghost"
          size={size}
          onPress={() => onDeleteProject()}
          startIcon={<Icon as={RiDeleteBin2Line} />}
        >
          <FormattedMessage id="delete-project-action" values={{ count }} />
        </Button>
      )}
      {iconOnly ? (
        <IconButton
          variant="ghost"
          size={size}
          onPress={onClearSelection}
          css={{ fontSize: "xl" }}
          aria-label={intl.formatMessage({ id: "clear" })}
        >
          <Icon as={RiCloseLine} />
        </IconButton>
      ) : (
        <Button
          variant="ghost"
          size={size}
          onPress={onClearSelection}
          startIcon={<Icon as={RiCloseLine} />}
        >
          <FormattedMessage id="clear" />
        </Button>
      )}
    </ButtonGroup>
  );
};

export default ProjectsToolbar;
