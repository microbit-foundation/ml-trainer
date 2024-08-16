import { Box, Card, GridItem, SkeletonText } from "@chakra-ui/react";
import {
  BlockLayout,
  MakeCodeBlocksRendering,
  MakeCodeProject,
} from "@microbit-foundation/react-code-view";

interface CodeViewGridItemProps {
  project: MakeCodeProject;
  gestureName: string;
}

const CodeViewGridItem = ({ project, gestureName }: CodeViewGridItemProps) => {
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
      >
        <Box
          width={`${120 + gestureName.length * 5}px`}
          py={2}
          px={2}
          overflow="hidden"
        >
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
        </Box>{" "}
      </Card>
    </GridItem>
  );
};

export default CodeViewGridItem;
