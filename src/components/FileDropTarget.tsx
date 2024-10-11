/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, Center } from "@chakra-ui/layout";
import { ReactNode, useCallback, useState } from "react";
import { RiFolderOpenLine } from "react-icons/ri";
import { useIntl } from "react-intl";

interface FileDropTargetProps {
  children: ReactNode;
  onFileDrop: (files: File[]) => void;
}

/**
 * An area that handles multiple dropped files.
 */
const FileDropTarget = ({ children, onFileDrop }: FileDropTargetProps) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      setDragOver(false);
      const files = Array.from(event.dataTransfer.files);
      if (files.length > 0) {
        event.preventDefault();
        event.stopPropagation();
        onFileDrop(files);
      }
    },
    [onFileDrop]
  );
  const handleDragOver = useCallback((event: React.DragEvent<HTMLElement>) => {
    const hasFile = Array.from(event.dataTransfer.types).indexOf("Files") >= 0;
    if (hasFile) {
      event.preventDefault();
      setDragOver(true);
      event.dataTransfer.dropEffect = "copy";
    }
  }, []);
  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);
  const intl = useIntl();
  return (
    <Box onDragOver={handleDragOver} position="relative" height="100%">
      {dragOver && (
        <Center
          onDrop={handleDrop}
          onDragLeave={handleDragLeave}
          position="fixed"
          top={0}
          left={0}
          height="100%"
          width="100%"
          // If it's not on top then we'll get unexpected leave events.
          zIndex={999999}
          backgroundColor="blackAlpha.500"
        >
          <RiFolderOpenLine
            size="25%"
            pointerEvents="none"
            aria-label={intl.formatMessage({ id: "open-file-dropped" })}
            aria-live="assertive"
          />
        </Center>
      )}
      {children}
    </Box>
  );
};

export default FileDropTarget;
