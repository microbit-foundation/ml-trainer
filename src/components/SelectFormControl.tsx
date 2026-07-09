/**
 * (c) 2022, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { ReactNode, useCallback } from "react";
import { IntlShape } from "react-intl";
import { css, Flex, NativeSelect } from "../shared-ui";

export interface SelectOptionValue<T> {
  value: T;
  label: ReactNode;
}

interface SelectFormControlProps<T> {
  id: string;
  options: SelectOptionValue<T>[];
  label: ReactNode;
  value: T;
  onChange: (value: T) => void;
}

const SelectFormControl = <T extends string>({
  id,
  options,
  label,
  value,
  onChange,
}: SelectFormControlProps<T>) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) =>
      onChange(e.currentTarget.value as T),
    [onChange]
  );

  return (
    <Flex alignItems="center" width="100%">
      <label htmlFor={id} className={css({ flex: "1 1 auto" })}>
        {label}
      </label>
      <span className={css({ position: "relative", display: "inline-flex" })}>
        <NativeSelect
          id={id}
          onChange={handleChange}
          css={{ width: "28ch", paddingRight: "8" }}
          value={value}
        >
          {options.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
        {/* Chakra Select's chevron. */}
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className={css({
            position: "absolute",
            right: "2",
            top: "50%",
            transform: "translateY(-50%)",
            width: "5",
            height: "5",
            pointerEvents: "none",
            fill: "currentColor",
          })}
        >
          <path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z" />
        </svg>
      </span>
    </Flex>
  );
};

/**
 * Helper for translated option labels.
 *
 * @param values Values to create options for.
 * @param prefix Prefix (no trailing '-') to use for translation keys.
 * @param intl For translation strings.
 * @returns Options for the given values.
 */
export const createOptions = <T extends string>(
  values: T[],
  prefix: string,
  intl: IntlShape,
  intlValues?: Record<string, string>
): SelectOptionValue<T>[] => {
  return values.map((value) => ({
    value,
    label: intl.formatMessage({ id: `${prefix}-${value}` }, intlValues),
  }));
};

export default SelectFormControl;
