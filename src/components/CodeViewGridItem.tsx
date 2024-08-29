import { Box, Card, GridItem, SkeletonText } from "@chakra-ui/react";
import {
  BlockLayout,
  MakeCodeBlocksRendering,
} from "@microbit-foundation/react-code-view";
import { memo, useMemo } from "react";
import { Gesture } from "../hooks/use-gestures";
import { TrainingCompleteMlStatus, useMlStatus } from "../hooks/use-ml-status";
import { generateProject } from "../utils/project-utils";

interface CodeViewGridItemProps {
  gesture: Gesture;
  projectEdited: boolean;
}

const CodeViewGridItem = ({
  gesture,
  projectEdited,
}: CodeViewGridItemProps) => {
  const [status] = useMlStatus();
  const project = useMemo(
    () =>
      generateProject([gesture], (status as TrainingCompleteMlStatus).model),
    [gesture, status]
  );
  const width = useMemo(
    () => `${120 + gesture.name.length * 5}px`,
    [gesture.name.length]
  );
  return (
    <GridItem>
      {!projectEdited && (
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
