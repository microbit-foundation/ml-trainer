import { Button, ButtonProps } from "@chakra-ui/react";
import { forwardRef } from "react";
import { flags } from "../flags";

export const ButtonWithLoading = forwardRef<HTMLButtonElement, ButtonProps>(
  function ButtonWithLoading({ isLoading, ...props }, ref) {
    return (
      <Button
        ref={ref}
        {...props}
        // Workaround to avoid error caused by DOM changes when doing in-context translations.
        isLoading={isLoading && !flags.translate}
        disabled={isLoading}
      />
    );
  }
);
