/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { RiArrowDownLine, RiArrowUpLine } from "react-icons/ri";
import { useIntl } from "react-intl";
import { ButtonGroup, Icon, IconButton, NativeSelect } from "../shared-ui";

interface SortInputProps {
  value: string;
  onSelectChange: React.ChangeEventHandler<HTMLSelectElement>;
  order: "desc" | "asc";
  toggleOrder: () => void;
  hasSearchQuery: boolean;
  /** Extra classes for the root (e.g. a `css(...)` result from the caller). */
  className?: string;
}

const SortInput = ({
  value,
  onSelectChange,
  order,
  toggleOrder,
  hasSearchQuery,
  className,
}: SortInputProps) => {
  const intl = useIntl();
  return (
    <ButtonGroup isAttached css={{ minW: 0 }} className={className}>
      <NativeSelect
        value={value}
        onChange={onSelectChange}
        aria-label={intl.formatMessage({ id: "sort-select-label" })}
        // Matches the Chakra-era look; the adjacent sort-order button keeps
        // the control from reading as a plain text field.
        hideChevron
        disabled={hasSearchQuery}
        // flex/minW let the select shrink below its longest option when space
        // is tight, clipping the text like Chakra's Select did.
        css={{ fontSize: "lg", background: "white", flex: 1, minW: 0 }}
      >
        {hasSearchQuery ? (
          <option value="relevance">
            {intl.formatMessage({ id: "sort-option-relevance" })}
          </option>
        ) : (
          <>
            <option value="name">
              {intl.formatMessage({ id: "sort-option-name" })}
            </option>
            <option value="timestamp">
              {intl.formatMessage({ id: "sort-option-last-modified" })}
            </option>
          </>
        )}
      </NativeSelect>
      <IconButton
        variant="ghost"
        aria-label={intl.formatMessage({
          id: hasSearchQuery
            ? "sort-order-descending-label"
            : order === "asc"
            ? "sort-order-ascending-label"
            : "sort-order-descending-label",
        })}
        onPress={toggleOrder}
        isDisabled={hasSearchQuery}
        css={{
          background: "white",
          fontSize: "2xl",
          border: "1px solid",
          borderColor: "gray.200",
          color: "#838383",
          // Square off the recipe's pill radius; the attached group squares
          // the inner edge, this handles the outer one.
          borderRadius: "md",
        }}
      >
        <Icon
          as={
            hasSearchQuery
              ? RiArrowDownLine
              : order === "asc"
              ? RiArrowUpLine
              : RiArrowDownLine
          }
        />
      </IconButton>
    </ButtonGroup>
  );
};

export default SortInput;
