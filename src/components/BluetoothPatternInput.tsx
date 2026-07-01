/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Box,
  HStack,
  Text,
  useRadio,
  useRadioGroup,
  UseRadioProps,
  VisuallyHidden,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useState } from "react";
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

interface BluetoothPatternInputProps {
  onChange?: (name: string) => void;
  invalid: boolean;
  microbitName: string | undefined;
}

const matrixDim = 5;
const cellSize = "35px";

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
    <HStack gap={1} alignItems="flex-start">
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
        <VisuallyHidden>
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

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: `bluetooth-pattern-column-${colIdx}`,
    value: numLit > 0 ? topLitRowIdx.toString() : "",
    onChange: (value: string) => onSelect(colIdx, parseInt(value)),
  });

  return (
    <VStack
      gap={1}
      {...getRootProps()}
      role="radiogroup"
      aria-label={intl.formatMessage(
        { id: "connect-pattern-input-label" },
        { colNum }
      )}
      aria-invalid={invalid || undefined}
    >
      {cells.map((isOn, rowIdx) => (
        <PatternLedOption
          key={rowIdx}
          {...getRadioProps({ value: rowIdx.toString() })}
          isOn={isOn}
          isHighlighted={highlighted[rowIdx]}
          label={intl.formatMessage(
            { id: "connect-pattern-led-option-label" },
            { colNum, numLeds: matrixDim - rowIdx }
          )}
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
    </VStack>
  );
};

interface PatternLedOptionProps extends UseRadioProps {
  isOn: boolean;
  isHighlighted: boolean;
  label: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onReactivate?: () => void;
}

const PatternLedOption = ({
  isOn,
  isHighlighted,
  label,
  onMouseEnter,
  onMouseLeave,
  onReactivate,
  ...radioProps
}: PatternLedOptionProps) => {
  const { getInputProps, getRadioProps } = useRadio(radioProps);
  const input = getInputProps();
  const box = getRadioProps();
  return (
    <Box
      as="label"
      w={cellSize}
      h={cellSize}
      cursor="pointer"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <input
        {...input}
        aria-label={label}
        onClick={(e) => {
          input.onClick?.(e);
          onReactivate?.();
        }}
      />
      <Box
        {...box}
        w="100%"
        h="100%"
        borderRadius={5}
        bgColor={isOn ? "brand2.500" : "gray.300"}
        borderWidth={isHighlighted && !isOn ? 3 : 0}
        borderColor={
          isHighlighted ? (isOn ? "white" : "brand2.500") : undefined
        }
        opacity={isHighlighted && isOn ? 0.25 : 1}
        _focusVisible={{ boxShadow: "outline" }}
      />
    </Box>
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
