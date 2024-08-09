import {
  ActionListenerSubject,
  EditorProject,
  MakeCodeEditor,
  ResponseEmitterSubject,
} from "@microbit-foundation/react-editor-embed";
import React from "react";
import { Subject } from "rxjs";
import { getMakeCodeLang, useSettings } from "../settings";

const controllerId = "MicrobitMachineLearningTool";

interface EditorProps {
  onBack?: () => void;
  onCodeChange?: (code: EditorProject) => void;
  onDownload?: (download: { name: string; hex: string }) => void;
  onSave?: (save: { name: string; hex: string }) => void;
  initialCode: EditorProject;
  version: string | undefined;
  style?: React.CSSProperties;
  eventTrigger?: Subject<ActionListenerSubject>;
  eventEmitter?: Subject<ResponseEmitterSubject>;
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
