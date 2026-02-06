import {
  ButtonGroup,
  ButtonGroupProps,
  IconButton,
  Select,
} from "@chakra-ui/react";
import { RiArrowDownLine, RiArrowUpLine } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";

interface SortInputProps extends ButtonGroupProps {
  value: string;
  onSelectChange: React.ChangeEventHandler<HTMLSelectElement>;
  order: "desc" | "asc";
  toggleOrder: () => void;
  hasSearchQuery: boolean;
}

const SortInput = ({
  value,
  onSelectChange,
  order,
  toggleOrder,
  hasSearchQuery,
  ...rest
}: SortInputProps) => {
  const intl = useIntl();
  return (
    <ButtonGroup isAttached {...rest}>
      <Select
        value={value}
        onChange={onSelectChange}
        aria-label={intl.formatMessage({ id: "sort-select-label" })}
        fontSize="lg"
        _focusVisible={{
          outline: "none",
          boxShadow: "outline",
        }}
        background="white"
        icon={<span />}
        borderBottomRightRadius={0}
        borderTopRightRadius={0}
        _focus={{
          zIndex: 1,
        }}
        isDisabled={hasSearchQuery}
      >
        {hasSearchQuery ? (
          <option value="relevance">
            <FormattedMessage id="sort-option-relevance" />
          </option>
        ) : (
          <>
            <option value="name">
              <FormattedMessage id="sort-option-name" />
            </option>
            <option value="timestamp">
              <FormattedMessage id="sort-option-last-modified" />
            </option>
          </>
        )}
      </Select>
      <IconButton
        borderBottomLeftRadius={0}
        borderTopLeftRadius={0}
        borderBottomRightRadius="md"
        borderTopRightRadius="md"
        background="white"
        fontSize="2xl"
        isRound={false}
        border="1px"
        borderColor="inherit"
        variant="ghost"
        aria-label={intl.formatMessage({
          id: hasSearchQuery
            ? "sort-order-descending-label"
            : order === "asc"
            ? "sort-order-ascending-label"
            : "sort-order-descending-label",
        })}
        color="#838383"
        onClick={toggleOrder}
        isDisabled={hasSearchQuery}
        icon={
          hasSearchQuery ? (
            <RiArrowDownLine />
          ) : order === "asc" ? (
            <RiArrowUpLine />
          ) : (
            <RiArrowDownLine />
          )
        }
      />
    </ButtonGroup>
  );
};

export default SortInput;
