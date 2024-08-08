import {
  ActionListenerSubject,
  EditorProject,
  MakeCodeEditor,
  ResponseEmitterSubject,
} from "@microbit-foundation/react-editor-embed";
import React from "react";
import { Subject } from "rxjs";
import { getMakeCodeLang, useSettings } from "../settings";

const controllerId = "MicrobitClassroom";

interface EditorProps {
  onCodeChange?: (code: EditorProject) => void;
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
      baseUrl="https://pxt-microbit.pages.dev/"
      controllerId={controllerId}
      hideMenu
      style={style}
      initialCode={initialCode}
      version={version}
      lang={getMakeCodeLang(languageId)}
      {...editorProps}
    />
  );
};

export default Editor;
