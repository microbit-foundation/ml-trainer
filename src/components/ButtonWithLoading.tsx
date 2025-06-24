import { Button, ButtonProps } from "@chakra-ui/react";
import { flags } from "../flags";

// Workaround to avoid error caused by DOM changes when doing in-context translations.
export const ButtonWithLoading = ({ isLoading, ...props }: ButtonProps) => {
  return (
    <Button
      {...props}
      isLoading={isLoading && !flags.translate}
      disabled={isLoading}
    />
  );
};
