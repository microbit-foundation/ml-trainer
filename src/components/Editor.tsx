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
import { useProject } from "../hooks/project-hooks";

const controllerId = "MicrobitMachineLearningTool";

interface EditorProps {
  style?: React.CSSProperties;
}

const Editor = forwardRef<MakeCodeFrameDriver, EditorProps>(function Editor(
  props,
  ref
) {
  const { editorCallbacks } = useProject();
  // const [{ languageId }] = useSettings();
  return (
    <MakeCodeFrame
      ref={ref}
      controllerId={controllerId}
      controller={2}
      // lang={getMakeCodeLang(languageId)}
      loading="eager"
      {...editorCallbacks}
      {...props}
    />
  );
});

export default Editor;
