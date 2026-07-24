/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useCallback, useRef } from "react";
import { RiCloseLine, RiSearch2Line } from "react-icons/ri";
import { useIntl } from "react-intl";
import {
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
} from "@microbit/ui";

interface SearchProps {
  query: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onClear: () => void;
  /** Extra classes for the root (e.g. a `css(...)` result from the caller). */
  className?: string;
}

const Search = ({
  query,
  onChange: onQueryChange,
  onClear,
  className,
}: SearchProps) => {
  const intl = useIntl();
  const ref = useRef<HTMLInputElement>(null);

  const handleClear = useCallback(() => {
    onClear();
    if (ref.current) {
      ref.current.focus();
    }
  }, [onClear]);

  return (
    <InputGroup className={className}>
      <InputLeftElement pointerEvents="none">
        <Icon as={RiSearch2Line} css={{ color: "gray.800" }} />
      </InputLeftElement>
      <Input
        aria-label={intl.formatMessage({ id: "search" })}
        ref={ref}
        value={query}
        onChange={onQueryChange}
        type="text"
        placeholder={intl.formatMessage({ id: "search" })}
        css={{
          pl: 10,
          pr: 10,
          fontSize: "lg",
          _placeholder: { color: "gray.600" },
          borderRadius: "20px",
          background: "white",
        }}
      />
      {query && (
        <InputRightElement>
          <IconButton
            variant="ghost"
            aria-label={intl.formatMessage({ id: "clear" })}
            onPress={handleClear}
            css={{
              fontSize: "2xl",
              // Also used for Zoom, move to theme.
              color: "#838383",
            }}
          >
            <Icon as={RiCloseLine} />
          </IconButton>
        </InputRightElement>
      )}
    </InputGroup>
  );
};

export default Search;
