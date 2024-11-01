/**
 * @vitest-environment jsdom
 */
/**
 * (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Project } from "@microbit/makecode-embed/react";
import * as tf from "@tensorflow/tfjs";
import { assert, vi } from "vitest";
import { TrainingResult, trainModel } from "../ml";
import { DatasetEditorJsonFormat, ActionData } from "../model";
import oldProject from "../test-fixtures/project-to-update.json";
import gestureData from "../test-fixtures/still-wave-clap-dataset.json";
import {
  ActionName,
  actionNamesFromLabels,
  extensionName,
  filenames,
  generateCustomFiles,
  generateProject,
  hasMakeCodeMlExtension,
  pxt,
} from "./utils";
import { currentDataWindow } from "../store";

const data: DatasetEditorJsonFormat = {
  data: gestureData as ActionData[],
};

let trainingResult: TrainingResult;

beforeAll(async () => {
  // No webgl in tests running in node.
  await tf.setBackend("cpu");

  // This creates determinism in the model training step.
  // Needed so that the ml4f output is identical for snapshots
  const randomSpy = vi.spyOn(Math, "random");
  randomSpy.mockImplementation(() => 0.5);

  trainingResult = await trainModel(
    gestureData as ActionData[],
    currentDataWindow
  );
});

describe("test project generation", () => {
  it("generates a project", () => {
    assert(!trainingResult.error);
    const result = generateProject(
      "A project name",
      data,
      trainingResult.model,
      currentDataWindow
    );
    expect(result).toMatchSnapshot();
  });
});

describe("test project update", () => {
  it("updates an old project to the latest extension version correctly", () => {
    assert(!trainingResult.error);
    // The oldProject has had the _history and .simstate fields removed.
    // We don't care about these and it makes equality easier to test.
    const projectToUpdate = oldProject as unknown as Project;

    const projectToUpdatePxtJSON = projectToUpdate.text?.[filenames.pxtJson];
    const projectToUpdatePxt = JSON.parse(
      projectToUpdatePxtJSON!
    ) as typeof pxt;

    expect(projectToUpdatePxt.dependencies[extensionName]).toBe(
      "github:microbit-foundation/pxt-microbit-ml#v0.4.2"
    );

    const newProject = generateProject(
      "Untitled",
      data,
      trainingResult.model,
      currentDataWindow
    );
    expect(newProject.text?.[filenames.autogenerated]).not.toEqual(
      projectToUpdate.text?.[filenames.autogenerated]
    );

    const updatedProject: Project = {
      ...projectToUpdate,
      text: {
        ...projectToUpdate.text,
        ...generateProject(
          "Untitled",
          data,
          trainingResult.model,
          currentDataWindow
        ).text,
      },
    };
    const updatedEditedProject = {
      ...projectToUpdate,
      text: {
        ...projectToUpdate.text,
        ...generateCustomFiles(
          data,
          trainingResult.model,
          currentDataWindow,
          projectToUpdate as unknown as Project
        ),
      },
    };

    expect(newProject.text).toEqual(updatedProject.text);
    expect(newProject.text?.[filenames.autogenerated]).toEqual(
      updatedEditedProject.text?.[filenames.autogenerated]
    );

    const newProjectPxtJSON = newProject.text?.[filenames.pxtJson];
    const newProjectPxt = JSON.parse(newProjectPxtJSON) as typeof pxt;

    const updatedEditedProjectPxtJSON =
      updatedEditedProject.text?.[filenames.pxtJson];
    const updatedEditedProjectPxt = JSON.parse(
      updatedEditedProjectPxtJSON
    ) as typeof pxt;

    // Check that extension version 0.4.2 has been bumped.
    expect(updatedEditedProjectPxt.dependencies[extensionName]).not.toBe(
      "github:microbit-foundation/pxt-microbit-ml#v0.4.2"
    );
    // Check that extension version is now the latest (same as new project).
    expect(newProjectPxt.dependencies[extensionName]).toEqual(
      updatedEditedProjectPxt.dependencies[extensionName]
    );
  });
});

describe("test actionNamesFromLabels", () => {
  it("removes numbers from start of identifiers", () => {
    const expected: ActionName[] = [
      {
        actionLabel: "  123   hello",
        actionVar: "Hello",
      },
    ];
    const userDefined = ["  123   hello"];
    expect(actionNamesFromLabels(userDefined)).toEqual(expected);
  });

  it("removes invalid characters from identifier", () => {
    const expected: ActionName[] = [
      {
        actionLabel: "!£$%^&*()valid:;'@#~[{]},<.>/?¬`",
        actionVar: "Valid",
      },
    ];
    const userDefined = ["!£$%^&*()valid:;'@#~[{]},<.>/?¬`"];
    expect(actionNamesFromLabels(userDefined)).toEqual(expected);
  });

  it("generates best effort identifier if no characters are valid", () => {
    const expected: ActionName[] = [
      {
        actionLabel: "  123   £$%",
        actionVar: "Event",
      },
    ];
    const userDefined = ["  123   £$%"];
    expect(actionNamesFromLabels(userDefined)).toEqual(expected);
  });

  it("copes with empty strings", () => {
    const expected: ActionName[] = [
      {
        actionLabel: "Event",
        actionVar: "Event",
      },
      {
        actionLabel: "Event1",
        actionVar: "Event1",
      },
      {
        actionLabel: "Event2",
        actionVar: "Event2",
      },
    ];
    const userDefined = ["", "", ""];
    expect(actionNamesFromLabels(userDefined)).toEqual(expected);
  });

  it("replaces double quotes in action labels", () => {
    const expected: ActionName[] = [
      {
        actionLabel: "my 'action'",
        actionVar: "MyAction",
      },
    ];
    const userDefined = ['my "action"'];
    expect(actionNamesFromLabels(userDefined)).toEqual(expected);
  });

  it("dedups sanitized inputs to create valid identifiers", () => {
    const expected: ActionName[] = [
      {
        actionLabel: "hello",
        actionVar: "Hello",
      },
      {
        actionLabel: "hello1",
        actionVar: "Hello1",
      },
      {
        actionLabel: "hello2",
        actionVar: "Hello2",
      },
    ];
    const userDefined = ["hello", "hello", "hello"];
    expect(actionNamesFromLabels(userDefined)).toEqual(expected);
  });

  it("removes invalid characters from identifier", () => {
    const expected: ActionName[] = [
      {
        actionLabel: "!£$%^&*()valid:;'@#~[{]},<.>/?¬`1",
        actionVar: "Valid1",
      },
    ];
    const userDefined = ["!£$%^&*()valid:;'@#~[{]},<.>/?¬`1"];
    expect(actionNamesFromLabels(userDefined)).toEqual(expected);
  });

  it("copes with newlines", () => {
    const expected: ActionName[] = [
      {
        actionLabel: "my \naction \n",
        actionVar: "MyAction",
      },
    ];
    const userDefined = ["my \naction \n"];
    expect(actionNamesFromLabels(userDefined)).toEqual(expected);
  });

  it("copes with different languages", () => {
    const expected: ActionName[] = [
      {
        actionLabel: "내 행동",
        actionVar: "내행동",
      },
    ];
    const userDefined = ["내 행동"];
    expect(actionNamesFromLabels(userDefined)).toEqual(expected);
  });
});

describe("test hasMakeCodeMlExtension", () => {
  it("has extension, returns true", () => {
    const project: Project = {
      text: {
        [filenames.pxtJson]: JSON.stringify({
          dependencies: {
            [extensionName]: "extension url",
          },
        }),
      },
    };
    expect(hasMakeCodeMlExtension(project)).toEqual(true);
  });

  it("does not have extension, returns false", () => {
    const project: Project = {
      text: {
        [filenames.pxtJson]: JSON.stringify({
          dependencies: {
            "some other extension": "extension url",
          },
        }),
      },
    };
    expect(hasMakeCodeMlExtension(project)).toEqual(false);
  });

  it("empty object, returns false", () => {
    expect(hasMakeCodeMlExtension({})).toEqual(false);
  });
});
