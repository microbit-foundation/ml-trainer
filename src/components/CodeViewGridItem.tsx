import { Box, Card, GridItem, SkeletonText } from "@chakra-ui/react";
import {
  BlockLayout,
  MakeCodeBlocksRendering,
  MakeCodeProject,
} from "@microbit-foundation/react-code-view";

interface CodeViewGridItemProps {
  project: MakeCodeProject;
}

const CodeViewGridItem = ({ project }: CodeViewGridItemProps) => {
  return (
    <GridItem>
      <Card
        p={2}
        h="120px"
        display="flex"
        borderColor="brand.500"
        minW="400px"
        width="fit-content"
        justifyContent="center"
      >
        {/* TODO: Change width of block depending on block size and cope with longer action names */}
        <Box width="150px" py={2} px={2} overflow="hidden">
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

export default CodeViewGridItem;
