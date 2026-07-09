/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import {
  BlockLayout,
  MakeCodeBlocksRendering,
  MakeCodeProject,
} from "@microbit/makecode-embed/react";
import { memo, useLayoutEffect, useRef, useState } from "react";
import { Box, Card, VStack } from "../shared-ui";
import BlocksLoadingSkeleton from "./BlocksLoadingSkeleton";
import { tourElClassname } from "../tours";

interface CodeViewCardProps {
  project: MakeCodeProject;
  parentRef: React.RefObject<HTMLDivElement>;
  className?: string;
}

const CodeViewCard = ({ project, parentRef, className }: CodeViewCardProps) => {
  // This is used to set the tour cutout as the card can be taller than
  // the parent in a scrollable area.
  const [observableHeight, setObservableHeight] = useState<number | string>(
    "full"
  );
  const ref = useRef<HTMLDivElement>(null);
  const paddingTop = 8;
  useLayoutEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (parentRef.current && ref.current) {
        if (
          parentRef.current.clientHeight - paddingTop <
          ref.current.clientHeight
        ) {
          setObservableHeight(parentRef.current.clientHeight - paddingTop);
        } else {
          setObservableHeight(ref.current.clientHeight);
        }
      }
    });
    if (parentRef.current) {
      resizeObserver.observe(parentRef.current);
    }
    if (ref.current) {
      resizeObserver.observe(ref.current);
    }
    return () => {
      resizeObserver.disconnect();
    };
  }, [parentRef]);

  return (
    <VStack
      alignSelf="start"
      display="flex"
      flexDirection="column"
      h="full"
      w="full"
      borderColor="brand.500"
      justifyContent="center"
    >
      <Card
        ref={ref}
        css={{
          w: "full",
          h: "full",
          px: 5,
          py: 5,
          objectFit: "contain",
          position: "relative",
        }}
        className={className}
      >
        <Box
          position="absolute"
          zIndex={-1}
          w="full"
          top={0}
          left={0}
          className={tourElClassname.makeCodeCodeView}
          // Height tracks the visible portion for the tour cutout; computed.
          style={{
            height:
              typeof observableHeight === "number"
                ? `${observableHeight}px`
                : "100%",
          }}
        />
        <MakeCodeBlocksRendering
          code={project}
          layout={BlockLayout.Flow}
          loaderCmp={<BlocksLoadingSkeleton />}
        />
      </Card>
    </VStack>
  );
};

export default memo(CodeViewCard);
