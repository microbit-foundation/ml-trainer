/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Radio as RACRadio,
  RadioGroup as RACRadioGroup,
} from "react-aria-components";
import { FormattedMessage, useIntl } from "react-intl";
import {
  generateMatrix,
  getHighlightedColumns,
  transformColumnsToMatrix,
  transformMatrixToColumns,
  updateMatrixColumns,
} from "../bt-pattern-matrix-utils";
import { isNativePlatform } from "../platform";
import {
  BluetoothPattern,
  microbitNameToBluetoothPattern,
  microbitPatternToName,
} from "../bt-pattern-utils";
import {
  Box,
  css,
  cx,
  HStack,
  Text,
  VisuallyHidden,
  VStack,
} from "../shared-ui";

interface BluetoothPatternInputProps {
  onChange?: (name: string) => void;
  invalid: boolean;
  microbitName: string | undefined;
}

const matrixDim = 5;
const cellSize = "44px";
const cellGap = 1.5;

const BluetoothPatternInput = ({
  onChange,
  invalid,
  microbitName,
}: BluetoothPatternInputProps) => {
  const pattern = microbitName
    ? microbitNameToBluetoothPattern(microbitName)
    : (Array(25).fill(false) as BluetoothPattern);
  const [highlighted, setHighlighted] = useState<boolean[][]>(
    generateMatrix(matrixDim, false)
  );
  const matrixColumns = transformMatrixToColumns(pattern, matrixDim);

  const clearHighlighted = useCallback(() => {
    setHighlighted(generateMatrix(matrixDim, false));
  }, []);

  const highlightCell = useCallback(
    (colIdx: number, rowIdx: number) => {
      setHighlighted(getHighlightedColumns(matrixColumns, { colIdx, rowIdx }));
    },
    [matrixColumns]
  );

  const updateMatrix = useCallback(
    (colIdx: number, rowIdx: number) => {
      clearHighlighted();
      const columns = updateMatrixColumns(matrixColumns, { colIdx, rowIdx });
      const matrix = transformColumnsToMatrix(columns) as boolean[];
      onChange && onChange(microbitPatternToName(matrix));
    },
    [clearHighlighted, matrixColumns, onChange]
  );

  const nativePlatform = isNativePlatform();
  const isEditable = !!onChange;

  return (
    <HStack gap={cellGap} alignItems="flex-start">
      {matrixColumns.map((cells, colIdx) => {
        const letter = nativePlatform
          ? microbitName
            ? microbitName[colIdx]
            : ""
          : undefined;
        return isEditable ? (
          <PatternColumn
            key={colIdx}
            colIdx={colIdx}
            cells={cells}
            letter={letter}
            invalid={invalid}
            highlighted={highlighted[colIdx]}
            onSelect={updateMatrix}
            onHighlight={highlightCell}
            onClearHighlight={clearHighlighted}
          />
        ) : (
          <ReadonlyPatternColumn key={colIdx} cells={cells} letter={letter} />
        );
      })}
      {nativePlatform && !isEditable && (
        <VisuallyHidden as="div">
          <Text>
            <FormattedMessage
              id="connect-pattern-label"
              values={{
                numLedsOnCol1: matrixColumns[0].filter(Boolean).length,
                numLedsOnCol2: matrixColumns[1].filter(Boolean).length,
                numLedsOnCol3: matrixColumns[2].filter(Boolean).length,
                numLedsOnCol4: matrixColumns[3].filter(Boolean).length,
                numLedsOnCol5: matrixColumns[4].filter(Boolean).length,
              }}
            />
          </Text>
          <Text>
            <FormattedMessage
              id="microbit-name-label"
              values={{ name: microbitName }}
            />
          </Text>
        </VisuallyHidden>
      )}
    </HStack>
  );
};

interface PatternColumnProps {
  colIdx: number;
  cells: boolean[];
  letter: string | undefined;
  invalid: boolean;
  highlighted: boolean[];
  onSelect: (colIdx: number, rowIdx: number) => void;
  onHighlight: (colIdx: number, rowIdx: number) => void;
  onClearHighlight: () => void;
}

/**
 * A single column of the pairing pattern, presented as a radio group where each
 * LED is an option. Selecting an LED lights it and every LED below it, so the
 * checked option is the topmost lit LED and communicates how many LEDs are lit.
 */
const PatternColumn = ({
  colIdx,
  cells,
  letter,
  invalid,
  highlighted,
  onSelect,
  onHighlight,
  onClearHighlight,
}: PatternColumnProps) => {
  const intl = useIntl();
  const colNum = colIdx + 1;
  const numLit = cells.filter(Boolean).length;
  // The topmost lit LED is the checked option; nothing is checked when the
  // column is empty (a not-yet-entered column).
  const topLitRowIdx = numLit > 0 ? matrixDim - numLit : -1;

  return (
    <RACRadioGroup
      value={numLit > 0 ? topLitRowIdx.toString() : null}
      onChange={(value: string) => onSelect(colIdx, parseInt(value))}
      aria-label={intl.formatMessage(
        { id: "connect-pattern-input-label" },
        { colNum }
      )}
      isInvalid={invalid}
      className={css({
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1.5,
      })}
    >
      {cells.map((isOn, rowIdx) => (
        <PatternLedOption
          key={rowIdx}
          value={rowIdx.toString()}
          isOn={isOn}
          isHighlighted={highlighted[rowIdx]}
          label={
            // TODO: Remove web fallback use the label version once it is
            // translated on the web for the supported languages.
            isNativePlatform()
              ? intl.formatMessage(
                  {
                    id: "connect-pattern-led-option-label",
                  },
                  { colNum, numLeds: matrixDim - rowIdx }
                )
              : `${matrixDim - rowIdx}`
          }
          testId={`bluetooth-pattern-led-${colIdx}-${matrixDim - rowIdx}`}
          onMouseEnter={() => onHighlight(colIdx, rowIdx)}
          onMouseLeave={onClearHighlight}
          onReactivate={
            isOn && rowIdx === topLitRowIdx
              ? () => onSelect(colIdx, rowIdx + 1)
              : undefined
          }
        />
      ))}
      {letter !== undefined && (
        <Text h={cellSize} lineHeight={cellSize} aria-hidden>
          {letter}
        </Text>
      )}
    </RACRadioGroup>
  );
};

interface PatternLedOptionProps {
  value: string;
  isOn: boolean;
  isHighlighted: boolean;
  label: string;
  testId: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onReactivate?: () => void;
}

const PatternLedOption = ({
  value,
  isOn,
  isHighlighted,
  label,
  testId,
  onMouseEnter,
  onMouseLeave,
  onReactivate,
}: PatternLedOptionProps) => {
  // Selecting the already-checked option (the topmost lit LED) turns it off.
  // Radios fire no change event for that and react-aria's press handling
  // swallows the click before React's synthetic handlers see it, so listen
  // natively on the wrapper. The write is deferred a tick: react-aria's press
  // re-selects the pressed radio *after* this listener (its handler runs when
  // the click reaches the React root), which would otherwise revert the
  // change. onReactivate is only wired on the currently-checked option, so
  // selection clicks don't trigger it; keyboard activation of a checked radio
  // also fires a click, matching the Chakra behaviour.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const onReactivateRef = useRef(onReactivate);
  onReactivateRef.current = onReactivate;
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) {
      return;
    }
    const listener = () => {
      if (onReactivateRef.current) {
        setTimeout(() => onReactivateRef.current?.(), 0);
      }
    };
    el.addEventListener("click", listener, true);
    return () => el.removeEventListener("click", listener, true);
  }, []);
  return (
    <div
      ref={wrapperRef}
      data-testid={testId}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={css({ width: cellSize, height: cellSize })}
    >
      <RACRadio
        value={value}
        aria-label={label}
        className={css({
          display: "block",
          width: "100%",
          height: "100%",
          cursor: "pointer",
        })}
      >
        {({ isFocusVisible }) => (
          <div
            className={cx(
              css({
                width: "100%",
                height: "100%",
                borderRadius: 5,
                bgColor: isOn ? "brand2.500" : "gray.300",
                borderStyle: "solid",
                borderWidth: isHighlighted && !isOn ? 3 : 0,
                borderColor: isHighlighted
                  ? isOn
                    ? "white"
                    : "brand2.500"
                  : undefined,
                opacity: isHighlighted && isOn ? 0.25 : 1,
              }),
              isFocusVisible ? css({ focusShadow: "outline" }) : undefined
            )}
          />
        )}
      </RACRadio>
    </div>
  );
};

interface ReadonlyPatternColumnProps {
  cells: boolean[];
  letter: string | undefined;
}

const ReadonlyPatternColumn = ({
  cells,
  letter,
}: ReadonlyPatternColumnProps) => (
  <VStack gap={1} aria-hidden>
    {cells.map((isOn, rowIdx) => (
      <Box
        key={rowIdx}
        w={cellSize}
        h={cellSize}
        borderRadius={5}
        bgColor={isOn ? "brand2.500" : "gray.300"}
      />
    ))}
    {letter !== undefined && (
      <Text h={cellSize} lineHeight={cellSize}>
        {letter}
      </Text>
    )}
  </VStack>
);

export default BluetoothPatternInput;
