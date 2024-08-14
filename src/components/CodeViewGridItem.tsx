import { Card, GridItem } from "@chakra-ui/react";
import CodeViewDefaultBlock from "./CodeViewDefaultBlock";

interface CodeViewGridItemProps {
  gestureName: string;
}

const CodeViewGridItem = ({ gestureName }: CodeViewGridItemProps) => {
  return (
    <GridItem>
      <Card
        py={3}
        px={5}
        h="120px"
        display="flex"
        borderColor="brand.500"
        minW="400px"
        width="fit-content"
        justifyContent="center"
      >
        <CodeViewDefaultBlock gestureName={gestureName} icon="heart" />
      </Card>
    </GridItem>
  );
};

export default CodeViewGridItem;
