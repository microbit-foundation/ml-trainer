import { Card, GridItem } from "@chakra-ui/react";
import { memo } from "react";
import { GestureData } from "../model";
import { tourElClassname } from "../tours";
import CodeViewDefaultBlock from "./CodeViewDefaultBlock";

interface CodeViewGridItemProps {
  gesture: GestureData;
}

const CodeViewGridItem = ({ gesture }: CodeViewGridItemProps) => {
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
        <CodeViewDefaultBlock gestureName={gesture.name} icon={gesture.icon} />
      </Card>
    </GridItem>
  );
};

export default memo(CodeViewGridItem);
