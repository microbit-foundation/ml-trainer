import { Button, ButtonProps } from "@chakra-ui/react";
import { flags } from "../flags";

export const ButtonWithLoading = ({ isLoading, ...props }: ButtonProps) => {
  return (
    <Button
      {...props}
      // Workaround to avoid error caused by DOM changes when doing in-context translations.
      isLoading={isLoading && !flags.translate}
      disabled={isLoading}
    />
  );
};
