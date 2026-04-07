/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  MakeCodeFrame,
  MakeCodeFrameDriver,
} from "@microbit/makecode-embed/react";
import React, { forwardRef } from "react";
import { getEditorVersionOverride } from "../editor-version";
import { useProject } from "../hooks/project-hooks";
import { getMakeCodeLang } from "../settings";
import { useSettings } from "../store";

const controllerId = "MicrobitMachineLearningTool";

interface EditorProps {
  style?: React.CSSProperties;
}

const Editor = forwardRef<MakeCodeFrameDriver, EditorProps>(function Editor(
  props,
  ref
) {
  const { editorCallbacks } = useProject();
  const [{ languageId }] = useSettings();
  return (
    <MakeCodeFrame
      ref={ref}
      baseUrl="https://makecode.microbit.org/beta"
      queryParams={{ hidelanguage: "1", keyboardcontrols: "1" }}
      controllerId={controllerId}
      controller={2}
      lang={getMakeCodeLang(languageId)}
      loading="eager"
      version={getEditorVersionOverride()}
      {...editorCallbacks}
      {...props}
    />
  );
});

export default Editor;
