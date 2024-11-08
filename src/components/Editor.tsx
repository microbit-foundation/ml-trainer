import {
  MakeCodeFrame,
  MakeCodeFrameDriver,
} from "@microbit/makecode-embed/react";
import React, { forwardRef, useCallback } from "react";
import { getMakeCodeLang } from "../settings";
import { useProject } from "../hooks/project-hooks";
import { useSettings } from "../store";
import { useLogging } from "../logging/logging-hooks";

const controllerId = "MicrobitMachineLearningTool";

interface EditorProps {
  style?: React.CSSProperties;
}

const Editor = forwardRef<MakeCodeFrameDriver, EditorProps>(function Editor(
  props,
  ref
) {
  const logging = useLogging();
  const { project, editorCallbacks } = useProject();
  const initialProjects = useCallback(() => {
    logging.log(
      `[MakeCode] Initialising with header ID: ${project.header?.id}`
    );
    return Promise.resolve([project]);
  }, [logging, project]);
  const [{ languageId }] = useSettings();
  return (
    <MakeCodeFrame
      ref={ref}
      controllerId={controllerId}
      controller={2}
      initialProjects={initialProjects}
      lang={getMakeCodeLang(languageId)}
      loading="eager"
      {...editorCallbacks}
      {...props}
    />
  );
});

export default Editor;
