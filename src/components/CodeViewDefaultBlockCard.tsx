/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { memo } from "react";
import { ActionData } from "../model";
import { Card, css, cx } from "../shared-ui";
import { tourElClassname } from "../tours";
import CodeViewDefaultBlock from "./CodeViewDefaultBlock";

interface CodeViewDefaultBlockCardProps {
  action: ActionData;
  className?: string;
}

const CodeViewDefaultBlockCard = ({
  action,
  className,
}: CodeViewDefaultBlockCardProps) => {
  return (
    <Card
      className={cx(
        tourElClassname.makeCodeCodeView,
        css({
          px: 5,
          h: "120px",
          display: "flex",
          borderColor: "brand.500",
          maxW: "100%",
          justifyContent: "center",
        }),
        className
      )}
    >
      <CodeViewDefaultBlock actionName={action.name} icon={action.icon} />
    </Card>
  );
};

export default memo(CodeViewDefaultBlockCard);
