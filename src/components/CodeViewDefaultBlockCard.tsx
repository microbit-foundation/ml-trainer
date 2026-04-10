/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Card, CardProps } from "@chakra-ui/react";
import { memo } from "react";
import { ActionData } from "../model";
import { tourElClassname } from "../tours";
import CodeViewDefaultBlock from "./CodeViewDefaultBlock";

interface CodeViewDefaultBlockCardProps extends CardProps {
  action: ActionData;
}

const CodeViewDefaultBlockCard = ({
  action,
  ...props
}: CodeViewDefaultBlockCardProps) => {
  return (
    <Card
      px={5}
      h="120px"
      display="flex"
      borderColor="brand.500"
      width="fit-content"
      justifyContent="center"
      className={tourElClassname.makeCodeCodeView}
      {...props}
    >
      <CodeViewDefaultBlock actionName={action.name} icon={action.icon} />
    </Card>
  );
};

export default memo(CodeViewDefaultBlockCard);
