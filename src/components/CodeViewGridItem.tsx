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
        minW="300px"
        width="fit-content"
        justifyContent="center"
      >
        <Box
          // There's an override="auto" on the blocks rendering that it would be nice to remove.
          width="300px"
          py={2}
          px={2}
          overflow="hidden"
        >
          <MakeCodeBlocksRendering
            // className={styles.makecode}
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
