/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { forwardRef, ReactNode } from "react";
import { useIntl } from "react-intl";
import { flags } from "../flags";
import { Button, ButtonProps, css, Spinner } from "@microbit/ui";

export interface ButtonWithLoadingProps
  extends Omit<ButtonProps, "children" | "onPress"> {
  isLoading?: boolean;
  /** Click handler (onPress naming kept off the API to ease migration). */
  onClick?: () => void;
  children: ReactNode;
}

/**
 * Button that swaps its label for a centred spinner while loading, keeping
 * its width (the label stays in the layout, hidden), like Chakra's
 * `isLoading`.
 */
export const ButtonWithLoading = forwardRef<
  HTMLButtonElement,
  ButtonWithLoadingProps
>(function ButtonWithLoading(
  { isLoading, isDisabled, onClick, children, ...props },
  ref
) {
  const intl = useIntl();
  // Workaround to avoid error caused by DOM changes when doing in-context
  // translations.
  const showSpinner = isLoading && !flags.translate;
  return (
    <Button
      ref={ref}
      onPress={onClick}
      isDisabled={isDisabled || isLoading}
      {...props}
    >
      <span
        className={css({
          display: "inline-flex",
          alignItems: "center",
          position: "relative",
        })}
      >
        {showSpinner && (
          <span
            className={css({
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <Spinner
              size="sm"
              aria-label={intl.formatMessage({ id: "loading" })}
            />
          </span>
        )}
        <span className={showSpinner ? css({ opacity: 0 }) : undefined}>
          {children}
        </span>
      </span>
    </Button>
  );
});
