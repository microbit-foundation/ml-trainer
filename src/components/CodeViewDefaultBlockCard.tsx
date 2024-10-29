import { Card } from "@chakra-ui/react";
import { memo } from "react";
import { GestureData } from "../model";
import { tourElClassname } from "../tours";
import CodeViewDefaultBlock from "./CodeViewDefaultBlock";

interface CodeViewDefaultBlockCardProps {
  gesture: GestureData;
}

const CodeViewDefaultBlockCard = ({
  gesture,
}: CodeViewDefaultBlockCardProps) => {
  return (
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
  );
};

export default memo(CodeViewDefaultBlockCard);
