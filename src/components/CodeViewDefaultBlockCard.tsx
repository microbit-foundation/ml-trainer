import { Card } from "@chakra-ui/react";
import { memo } from "react";
import { ActionData } from "../model";
import { tourElClassname } from "../tours";
import CodeViewDefaultBlock from "./CodeViewDefaultBlock";

interface CodeViewDefaultBlockCardProps {
  actionData: ActionData;
}

const CodeViewDefaultBlockCard = ({
  actionData,
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
      <CodeViewDefaultBlock
        actionName={actionData.name}
        icon={actionData.icon}
      />
    </Card>
  );
};

export default memo(CodeViewDefaultBlockCard);
