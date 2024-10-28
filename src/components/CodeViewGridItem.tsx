import { Box, Card, GridItem, SkeletonText } from "@chakra-ui/react";
import {
  BlockLayout,
  MakeCodeBlocksRendering,
} from "@microbit/makecode-embed/react";
import { memo, useMemo } from "react";
import { generateProject } from "../makecode/utils";
import { GestureData } from "../model";
import { useStore } from "../store";
import { tourElClassname } from "../tours";

interface CodeViewGridItemProps {
  gesture: GestureData;
}

const CodeViewGridItem = ({ gesture }: CodeViewGridItemProps) => {
  const model = useStore((s) => s.model);
  const gestures = useStore((s) => s.gestures);
  const dataWindow = useStore((s) => s.dataWindow);
  const project = useMemo(
    // Project name is left empty as it is not used or displayed.
    () => generateProject("", { data: gestures }, model, dataWindow, gesture),
    [dataWindow, gesture, gestures, model]
  );
  const width = useMemo(
    () => `${120 + gesture.name.length * 5}px`,
    [gesture.name.length]
  );
  return (
    <GridItem>
      <Card
        px={5}
        h="120px"
        display="flex"
        borderColor="brand.500"
        minW="400px"
        width="fit-content"
        justifyContent="center"
        className={tourElClassname.makeCodeCodeView}
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
    </GridItem>
  );
};

export default memo(CodeViewGridItem);
