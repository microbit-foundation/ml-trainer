import { MakeCodeProject } from "@microbit/makecode-embed";
import { filenames } from "./makecode/utils";

/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
export const untitledProjectName = "Untitled";
export const validateProjectName = (name: string): boolean => {
  return name.trim().length > 0;
};

export const renameProject = (
  project: MakeCodeProject,
  name: string
): MakeCodeProject => {
  const pxtString = project.text?.[filenames.pxtJson];
  const pxt = JSON.parse(pxtString ?? "{}") as Record<string, unknown>;

  return {
    ...project,
    header: {
      ...project.header!,
      name,
    },
    text: {
      ...project.text,
      [filenames.pxtJson]: JSON.stringify({
        ...pxt,
        name,
      }),
    },
  };
};
