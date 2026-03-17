/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Flex } from "@chakra-ui/react";
import { MakeCodeFrameDriver } from "@microbit/makecode-embed/react";
import { forwardRef, memo, useEffect, useRef } from "react";
import { useStore } from "../store";
import Editor from "./Editor";

interface EditCodeDialogProps {}

const EditCodeDialog = forwardRef<MakeCodeFrameDriver, EditCodeDialogProps>(
  function EditCodeDialog(_, ref) {
    const isOpen = useStore((s) => s.isEditorOpen);
    const tourStart = useStore((s) => s.tourStart);
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      if (isOpen) {
        tourStart({ name: "MakeCode" });
        // MakeCode focuses its workspace after project import.
        // Reset focus to the container so tab order starts from the top.
        containerRef.current?.focus();
      }
    }, [isOpen, tourStart]);
    // MakeCode can steal focus via internal focus() calls that bypass the
    // parent's inert attribute. When the editor is hidden, detect this via
    // window blur (fires when an iframe gains focus) and reclaim focus.
    // We'd ideally fix this in MakeCode.
    useEffect(() => {
      if (isOpen) {
        return;
      }
      const handleWindowBlur = () => {
        const iframe = containerRef.current?.querySelector("iframe");
        if (document.activeElement === iframe) {
          // Use setTimeout to ensure MakeCode's internal focus handling
          // has completed before we override it.
          setTimeout(() => window.focus(), 0);
        }
      };
      window.addEventListener("blur", handleWindowBlur);
      return () => window.removeEventListener("blur", handleWindowBlur);
    }, [isOpen]);
    return (
      <Flex
        ref={containerRef}
        role="region"
        aria-label="MakeCode"
        tabIndex={-1}
        w="100%"
        h="100%"
        bgColor="white"
        left={isOpen ? undefined : "-150vw"}
        top={isOpen ? undefined : "-150vh"}
        visibility={isOpen ? "visible" : "hidden"}
        position={isOpen ? undefined : "absolute"}
      >
        <Editor ref={ref} style={{ flexGrow: 1 }} />
      </Flex>
    );
  }
);

export default memo(EditCodeDialog);
