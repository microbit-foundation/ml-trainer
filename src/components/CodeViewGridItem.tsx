import { Box, Card, GridItem, SkeletonText } from "@chakra-ui/react";
import {
  BlockLayout,
  MakeCodeBlocksRendering,
} from "@microbit-foundation/react-code-view";
import { memo, useMemo } from "react";
import { GestureData } from "../gestures-hooks";
import { useMakeCodeProject } from "../user-projects-hooks";

interface CodeViewGridItemProps {
  gesture: GestureData;
  hasStoredProject: boolean;
}

const CodeViewGridItem = ({
  gesture,
  hasStoredProject,
}: CodeViewGridItemProps) => {
  const { createGestureDefaultProject } = useMakeCodeProject();
  const project = useMemo(
    () => createGestureDefaultProject(gesture),
    [createGestureDefaultProject, gesture]
  );
  const width = useMemo(
    () => `${120 + gesture.name.length * 5}px`,
    [gesture.name.length]
  );
  return (
    <GridItem>
      {!hasStoredProject && (
        <Card
          px={5}
          h="120px"
          display="flex"
          borderColor="brand.500"
          minW="400px"
          width="fit-content"
          justifyContent="center"
        >
          <Box width={width} py={2} px={2} overflow="hidden">
            <MakeCodeBlocksRendering
              code={project}
              layout={BlockLayout.Clean}
              loaderCmp={
                <SkeletonText
                  w="full"
                  noOfLines={3}
                  spacing="5"
                  skeletonHeight="2"
                />
              }
            />
          </Box>
        </Card>
      )}
    </GridItem>
  );
};

export default memo(CodeViewGridItem);
