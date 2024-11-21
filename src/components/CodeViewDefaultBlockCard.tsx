import { Card } from "@chakra-ui/react";
import { memo } from "react";
import { ActionData } from "../model";
import { tourElClassname } from "../tours";
import CodeViewDefaultBlock from "./CodeViewDefaultBlock";

interface CodeViewDefaultBlockCardProps {
  action: ActionData;
}

const CodeViewDefaultBlockCard = ({
  action,
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
      <CodeViewDefaultBlock actionName={action.name} icon={action.icon} />
    </Card>
  );
};

export default memo(CodeViewDefaultBlockCard);
