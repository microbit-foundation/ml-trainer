/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  NameProjectDialog as SharedNameProjectDialog,
  NameProjectDialogProps as SharedNameProjectDialogProps,
} from "@microbit/ui-patterns";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { useProjectName } from "../hooks/project-hooks";

interface NameProjectDialogProps
  extends Omit<
    SharedNameProjectDialogProps,
    "initialName" | "confirmText" | "helperText"
  > {
  /** Defaults to the open project's name. */
  projectName?: string;
  /** Defaults to "Confirm and save". */
  confirmText?: ReactNode;
  /** Defaults to explaining the name is used when saving. */
  helperText?: ReactNode;
}

/**
 * The shared dialog with this app's defaults: the open project's name, and
 * the save-flow wording.
 */
export const NameProjectDialog = ({
  projectName,
  confirmText = <FormattedMessage id="confirm-save-action" />,
  helperText = <FormattedMessage id="name-used-when" />,
  ...props
}: NameProjectDialogProps) => {
  const currentName = useProjectName();
  return (
    <SharedNameProjectDialog
      {...props}
      initialName={projectName ?? currentName}
      confirmText={confirmText}
      helperText={helperText}
    />
  );
};
