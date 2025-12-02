/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Flex } from "@chakra-ui/react";
import { MakeCodeFrameDriver } from "@microbit/makecode-embed/react";
import { forwardRef, memo, useEffect } from "react";
import { useStore } from "../store";
import Editor from "./Editor";

interface EditCodeDialogProps {}

const EditCodeDialog = forwardRef<MakeCodeFrameDriver, EditCodeDialogProps>(
  function EditCodeDialog(_, ref) {
    const isOpen = useStore((s) => s.isEditorOpen);
    const tourStart = useStore((s) => s.tourStart);
    useEffect(() => {
      if (isOpen) {
        tourStart({ name: "MakeCode" });
      }
    }, [isOpen, tourStart]);
    return (
      <Flex
        w="100%"
        h="100%"
        bgColor="#3454D1" // Matches MakeCode behind status bar, for edge-to-edge appearance
        left={isOpen ? undefined : "-150vw"}
        top={isOpen ? undefined : "-150vh"}
        visibility={isOpen ? "visible" : "hidden"}
        position={isOpen ? undefined : "absolute"}
        sx={{
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <Editor ref={ref} style={{ flexGrow: 1 }} />
      </Flex>
    );
  }
);

export default memo(EditCodeDialog);
