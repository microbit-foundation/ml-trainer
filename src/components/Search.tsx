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
  InputStartElement,
  InputEndElement,
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
      <InputStartElement pointerEvents="none">
        <Icon as={RiSearch2Line} css={{ color: "gray.800" }} />
      </InputStartElement>
      <Input
        aria-label={intl.formatMessage({ id: "search" })}
        ref={ref}
        value={query}
        onChange={onQueryChange}
        type="text"
        placeholder={intl.formatMessage({ id: "search" })}
        css={{
          ps: 10,
          pe: 10,
          fontSize: "lg",
          _placeholder: { color: "gray.500" },
          borderRadius: "20px",
          background: "white",
        }}
      />
      {query && (
        <InputEndElement>
          <IconButton
            variant="ghost"
            aria-label={intl.formatMessage({ id: "clear" })}
            onPress={handleClear}
            css={{
              fontSize: "2xl",
              // Also used for Zoom, move to theme.
              color: "gray.500",
            }}
          >
            <Icon as={RiCloseLine} />
          </IconButton>
        </InputEndElement>
      )}
    </InputGroup>
  );
};

export default Search;
