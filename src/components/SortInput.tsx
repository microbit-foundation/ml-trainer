import {
  ButtonGroup,
  ButtonGroupProps,
  IconButton,
  Select,
} from "@chakra-ui/react";
import { RiArrowDownLine, RiArrowUpLine } from "react-icons/ri";

interface SortInputProps extends ButtonGroupProps {
  value: string;
  onSelectChange: React.ChangeEventHandler<HTMLSelectElement>;
  order: "desc" | "asc";
  toggleOrder: () => void;
}

const SortInput = ({
  value,
  onSelectChange,
  order,
  toggleOrder,
  ...rest
}: SortInputProps) => {
  return (
    <ButtonGroup isAttached {...rest}>
      <Select
        value={value}
        onChange={onSelectChange}
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
      >
        <option value="name">Name</option>
        <option value="timestamp">Last modified</option>
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
        aria-label="toggle..."
        color="#838383"
        onClick={toggleOrder}
        icon={order === "asc" ? <RiArrowUpLine /> : <RiArrowDownLine />}
      />
    </ButtonGroup>
  );
};

export default SortInput;
