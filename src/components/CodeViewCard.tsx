import { Card, SkeletonText, VStack } from "@chakra-ui/react";
import {
  BlockLayout,
  MakeCodeBlocksRendering,
  MakeCodeProject,
} from "@microbit-foundation/react-code-view";
import { EditorProject } from "@microbit-foundation/react-editor-embed";
import { memo } from "react";

interface CodeViewCardProps {
  project: EditorProject;
}

const CodeViewCard = ({ project }: CodeViewCardProps) => {
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
      <Card w="full" h="full" p={5} objectFit="contain">
        <MakeCodeBlocksRendering
          code={project as MakeCodeProject}
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
