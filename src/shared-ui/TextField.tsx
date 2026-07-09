/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { FocusEvent, forwardRef, ReactNode } from "react";
import {
  FieldError,
  Input as RACInput,
  Label as RACLabel,
  Text as RACText,
  TextField as RACTextField,
  TextFieldProps as RACTextFieldProps,
} from "react-aria-components";
import { css, cx } from "styled-system/css";
import { field, input } from "styled-system/recipes";
import { SystemStyleObject } from "styled-system/types";

export interface TextFieldProps
  extends Omit<
    RACTextFieldProps,
    "className" | "children" | "style" | "onFocus" | "onBlur"
  > {
  /** Visible label (Chakra's FormLabel; asterisk added when `isRequired`). */
  label: ReactNode;
  /** Help text below the input (Chakra's FormHelperText). */
  helperText?: ReactNode;
  /** Shown below the input when `isInvalid` (Chakra's FormErrorMessage). */
  errorMessage?: ReactNode;
  /** Per-instance style overrides for the helper text. */
  helperTextCss?: SystemStyleObject;
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
}

/**
 * TextField — a labelled single-line text input, collapsing Chakra's
 * FormControl/FormLabel/Input/FormHelperText/FormErrorMessage. The ref is
 * forwarded to the input element.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    { label, helperText, errorMessage, helperTextCss, onFocus, ...rest },
    ref
  ) {
    const slots = field();
    return (
      <RACTextField {...rest} className={slots.root}>
        <RACLabel className={slots.label}>
          {label}
          {rest.isRequired ? (
            <span aria-hidden className={slots.requiredIndicator}>
              *
            </span>
          ) : null}
        </RACLabel>
        <RACInput ref={ref} className={input()} onFocus={onFocus} />
        {helperText && (
          <RACText
            slot="description"
            className={cx(
              slots.helperText,
              helperTextCss ? css(helperTextCss) : undefined
            )}
          >
            {helperText}
          </RACText>
        )}
        <FieldError className={slots.errorMessage}>{errorMessage}</FieldError>
      </RACTextField>
    );
  }
);
