import {
  MakeCodeFrame,
  MakeCodeFrameDriver,
  Project,
} from "@microbit/makecode-embed/react";
import React, { forwardRef, useCallback } from "react";
import { getMakeCodeLang, useSettings } from "../settings";
import { EditorWorkspaceSaveRequest } from "@microbit/makecode-embed/react";

const controllerId = "MicrobitMachineLearningTool";

interface EditorProps {
  onBack?: () => void;
  onCodeChange?: (code: Project) => void;
  onDownload?: (download: { name: string; hex: string }) => void;
  onSave?: (save: { name: string; hex: string }) => void;
  initialCode: Project;
  version: string | undefined;
  style?: React.CSSProperties;
}

const Editor = forwardRef<MakeCodeFrameDriver, EditorProps>(function Editor(
  props,
  ref
) {
  const { style, initialCode, version, onCodeChange, ...editorProps } = props;
  const initialProjects = useCallback(() => {
    return Promise.resolve([initialCode]);
  }, [initialCode]);
  const handleCodeChange = useCallback(
    (e: EditorWorkspaceSaveRequest) => onCodeChange?.(e.project),
    [onCodeChange]
  );
  const [{ languageId }] = useSettings();
  return (
    <MakeCodeFrame
      ref={ref}
      // TODO: Remove baseUrl and use the default once our sim extension is live there
      baseUrl="https://ml-tool.pxt-microbit.pages.dev/"
      controllerId={controllerId}
      controller={2}
      style={style}
      initialProjects={initialProjects}
      version={version}
      lang={getMakeCodeLang(languageId)}
      onWorkspaceSave={handleCodeChange}
      loading="eager"
      {...editorProps}
    />
  );
});

export default Editor;
