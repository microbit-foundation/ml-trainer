/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, Card, SkeletonText, VStack } from "@chakra-ui/react";
import {
  BlockLayout,
  MakeCodeBlocksRendering,
  Project,
} from "@microbit/makecode-embed/react";
import { memo, useLayoutEffect, useRef, useState } from "react";
import { tourElClassname } from "../tours";

interface CodeViewCardProps {
  project: Project;
  parentRef: React.RefObject<HTMLDivElement>;
}

const CodeViewCard = ({ project, parentRef }: CodeViewCardProps) => {
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
      py={2}
      h="full"
      w="full"
      borderColor="brand.500"
      justifyContent="center"
    >
      <Card
        ref={ref}
        w="full"
        h="full"
        p={5}
        objectFit="contain"
        position="relative"
      >
        <Box
          position="absolute"
          zIndex={-1}
          w="full"
          h={observableHeight}
          top={0}
          left={0}
          className={tourElClassname.makeCodeCodeView}
        />
        <MakeCodeBlocksRendering
          code={project}
          layout={BlockLayout.Flow}
          loaderCmp={
            <SkeletonText w="xs" noOfLines={5} spacing="5" skeletonHeight="2" />
          }
        />
      </Card>
    </VStack>
  );
};

export default memo(CodeViewCard);
