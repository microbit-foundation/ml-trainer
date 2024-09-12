import { Box, Card, GridItem, SkeletonText } from "@chakra-ui/react";
import {
  BlockLayout,
  MakeCodeBlocksRendering,
} from "@microbit/makecode-embed/react";
import { memo, useMemo } from "react";
import { GestureData } from "../gestures-hooks";
import { generateProject } from "../makecode/utils";
import { TrainingCompleteMlStatus } from "../ml-status-hooks";
import { useAppStore } from "../store";

interface CodeViewGridItemProps {
  gesture: GestureData;
  projectEdited: boolean;
}

const CodeViewGridItem = ({
  gesture,
  projectEdited,
}: CodeViewGridItemProps) => {
  const status = useAppStore((s) => s.mlStatus);
  const gestures = useAppStore((s) => s.gestures);
  const gesturesLastModified = useAppStore((s) => s.gesturesLastModified);

  const project = useMemo(
    () =>
      generateProject(
        { data: gestures, lastModified: gesturesLastModified },
        (status as TrainingCompleteMlStatus).model,
        gesture
      ),
    [gesture, gestures, gesturesLastModified, status]
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
