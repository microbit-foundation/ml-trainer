import { Card, GridItem } from "@chakra-ui/react";
import CodeViewDefaultBlock from "./CodeViewDefaultBlock";
import { MakeCodeIcon } from "../utils/icons";

interface CodeViewGridItemProps {
  gestureName: string;
  icon: MakeCodeIcon;
}

const CodeViewGridItem = ({ gestureName, icon }: CodeViewGridItemProps) => {
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
        <CodeViewDefaultBlock gestureName={gestureName} icon={icon} />
      </Card>
    </GridItem>
  );
};

export default CodeViewGridItem;
