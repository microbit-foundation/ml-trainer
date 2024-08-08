import { Button, ButtonProps } from "@chakra-ui/react";
import { RiArrowLeftLine } from "react-icons/ri";

/**
 * You must provide text as children.
 *
 * Text should be e.g. "Back to setup".
 */
const FullScreenBackButton = (props: ButtonProps) => (
  <Button
    borderWidth={0}
    size="lg"
    px={0.5}
    leftIcon={<RiArrowLeftLine />}
    variant="plain"
    fontWeight="normal"
    {...props}
  />
);

export default FullScreenBackButton;
