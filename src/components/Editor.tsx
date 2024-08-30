import {
  EditorProject,
  MakeCodeEditor,
} from "@microbit-foundation/react-editor-embed";
import React from "react";
import { getMakeCodeLang, useSettings } from "../settings";

const controllerId = "MicrobitMachineLearningTool";

interface EditorProps {
  onBack?: () => void;
  onCodeChange?: (code: EditorProject) => void;
  onDownload?: (download: { name: string; hex: string }) => void;
  onSave?: (save: { name: string; hex: string }) => void;
  initialCode: EditorProject;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getWriter?: (writeFn: any) => void;
  version: string | undefined;
  style?: React.CSSProperties;
}

const Editor = ({
  style,
  initialCode,
  version,
  ...editorProps
}: EditorProps) => {
  const [{ languageId }] = useSettings();
  return (
    <MakeCodeEditor
      // TODO: To remove baseUrl and use real pxt-microbit
      baseUrl="https://ml-tool.pxt-microbit.pages.dev/"
      controllerId={controllerId}
      controller={2}
      style={style}
      initialCode={initialCode}
      version={version}
      lang={getMakeCodeLang(languageId)}
      {...editorProps}
    />
  );
};

export default Editor;
