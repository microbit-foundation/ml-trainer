/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ReactNode } from "react";
import { Button } from "../shared-ui";

interface DialogFooterLinkProps {
  onClick?: () => void;
  leftIcon?: ReactNode;
  children: ReactNode;
}

/** Link-styled action in a dialog footer's left slot. */
const DialogFooterLink = ({
  onClick,
  leftIcon,
  children,
}: DialogFooterLinkProps) => {
  return (
    <Button
      variant="link"
      size="lg"
      onPress={onClick}
      leftIcon={leftIcon}
      css={{ borderRadius: 0 }}
    >
      {children}
    </Button>
  );
};

export default DialogFooterLink;
