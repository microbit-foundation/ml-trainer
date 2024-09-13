import {
  MakeCodeFrame,
  MakeCodeFrameDriver,
} from "@microbit/makecode-embed/react";
import React, { forwardRef, useCallback } from "react";
import { getMakeCodeLang, useSettings } from "../settings";
import { useProject } from "../hooks/project-hooks";

const controllerId = "MicrobitMachineLearningTool";

interface EditorProps {
  version: string | undefined;
  style?: React.CSSProperties;
}

const Editor = forwardRef<MakeCodeFrameDriver, EditorProps>(function Editor(
  props,
  ref
) {
  const { project, editorCallbacks } = useProject();
  const initialProjects = useCallback(() => {
    return Promise.resolve([project]);
  }, [project]);
  const [{ languageId }] = useSettings();
  return (
    <MakeCodeFrame
      ref={ref}
      // TODO: Remove baseUrl and use the default once our sim extension is live there
      baseUrl="https://ml-tool.pxt-microbit.pages.dev/"
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
