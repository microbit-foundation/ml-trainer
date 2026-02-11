/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { MakeCodeProject } from "@microbit/makecode-embed";
import { v4 as uuid } from "uuid";
import { generateProject } from "./makecode/utils";
import { ActionData, OldActionData } from "./model";

export const untitledProjectName = "Untitled";

export const validateProjectName = (name: string): boolean => {
  return name.trim().length > 0;
};

export interface DataWindow {
  duration: number; // Duration of recording
  minSamples: number; // minimum number of samples for reliable detection (when detecting actions)
  deviceSamplesPeriod: number;
  deviceSamplesLength: number;
}

// Exported for testing.
export const currentDataWindow: DataWindow = {
  duration: 990,
  minSamples: 44,
  deviceSamplesPeriod: 20, // Default value for accelerometer period.
  deviceSamplesLength: 50, // Number of samples required at 20 ms intervals for 1 second of data.
};

export const legacyDataWindow: DataWindow = {
  duration: 1800,
  minSamples: 80,
  deviceSamplesPeriod: 25,
  deviceSamplesLength: 80,
};

export const createUntitledProject = (): MakeCodeProject => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  header: {
    target: "microbit",
    targetVersion: "7.1.2",
    name: untitledProjectName,
    meta: {},
    editor: "blocksprj",
    pubId: "",
    pubCurrent: false,
    _rev: null,
    id: "45a3216b-e997-456c-bd4b-6550ddb81c4e",
    recentUse: 1726493314,
    modificationTime: 1726493314,
    cloudUserId: null,
    cloudCurrent: false,
    cloudVersion: null,
    cloudLastSyncTime: 0,
    isDeleted: false,
    githubCurrent: false,
    saveId: null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
  ...generateProject(
    untitledProjectName,
    { data: [] },
    undefined,
    currentDataWindow,
    false
  ),
});

export const migrateLegacyActionDataAndAssignNewIds = (
  actions: OldActionData[] | ActionData[]
): ActionData[] => {
  return actions.map((a) => {
    if (Object.prototype.hasOwnProperty.call(a, "ID")) {
      return {
        name: a.name,
        id: uuid(),
        icon: a.icon,
        requiredConfidence: a.requiredConfidence,
        recordings: (a as OldActionData).recordings.map((r) => ({
          id: uuid(),
          data: r.data,
          createdAt: r.ID,
        })),
        createdAt: (a as OldActionData).ID,
      };
    }
    // Assign new unique ids to actions and recordings.
    // This is required if the user imports the same dataset / project twice.
    return {
      ...a,
      id: uuid(),
      recordings: a.recordings.map((r) => ({
        ...r,
        id: uuid(),
      })),
    } as ActionData;
  });
};
