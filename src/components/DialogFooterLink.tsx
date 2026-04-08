/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Button,
  ButtonProps
} from "@chakra-ui/react";

const DialogFooterLink = ({ ...props }: ButtonProps) => {
  return <Button variant="link" size="lg" {...props} />;
};

export default DialogFooterLink;
