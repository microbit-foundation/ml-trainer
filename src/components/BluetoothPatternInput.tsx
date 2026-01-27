/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  NumberInput,
  NumberInputField,
  Text,
  VisuallyHidden,
} from "@chakra-ui/react";
import React, { useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
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
  const [inputValues, setInputValues] = useState<string[]>(
    matrixColumns.map((cols) => cols.filter((c) => c).length.toString())
  );

  const clearHighlighted = useCallback(() => {
    setHighlighted(generateMatrix(matrixDim, false));
  }, []);

  const updateMatrix = useCallback(
    (colIdx: number, rowIdx: number) => {
      const columns = updateMatrixColumns(matrixColumns, { colIdx, rowIdx });
      const matrix = transformColumnsToMatrix(columns) as boolean[];
      onChange && onChange(microbitPatternToName(matrix));
    },
    [matrixColumns, onChange]
  );

  const columnInputOnChange = useCallback(
    (colIdx: number): ((value: string) => void) => {
      return (value) => {
        const colValue = value === "" ? 0 : parseInt(value);
        if (isNaN(colValue) || colValue > 5 || colValue < 0) {
          // Do nothing when input value is not valid.
          return;
        }
        setInputValues(inputValues.map((v, i) => (i === colIdx ? value : v)));
        updateMatrix(colIdx, matrixDim - colValue);
      };
    },
    [inputValues, updateMatrix]
  );

  const nativePlatform = isNativePlatform();
  const isEditable = !!onChange;

  return (
    <Grid
      templateColumns="repeat(5, 35px)"
      templateRows={`repeat(${nativePlatform ? 7 : 6}, 35px)`}
      gap={1}
    >
      {matrixColumns.map((cells, colIdx) => (
        <React.Fragment key={colIdx}>
          {cells.map((c, rowIdx) => (
            <GridItem
              colSpan={1}
              rowStart={rowIdx + 1}
              key={`col-${colIdx}-cell-${rowIdx}`}
            >
              <PatternBox
                onClick={() => {
                  clearHighlighted();
                  updateMatrix(colIdx, rowIdx);
                }}
                onMouseEnter={() => {
                  setHighlighted(
                    getHighlightedColumns(matrixColumns, { colIdx, rowIdx })
                  );
                }}
                onMouseLeave={clearHighlighted}
                isOn={c}
                isHighlighted={highlighted[colIdx][rowIdx]}
                editable={isEditable}
              />
            </GridItem>
          ))}
          {nativePlatform && (
            <GridItem
              rowStart={6}
              textAlign="center"
              key={`col-${colIdx}-pattern-letter`}
            >
              <Text>{microbitName ? microbitName[colIdx] : " "}</Text>
            </GridItem>
          )}
          <GridItem key={`col-${colIdx}-pattern-input`}>
            {onChange && (
              <PatternColumnInput
                isInvalid={invalid}
                onChange={columnInputOnChange(colIdx)}
                colIdx={colIdx}
                value={inputValues[colIdx]}
              />
            )}
          </GridItem>
        </React.Fragment>
      ))}
    </Grid>
  );
};

interface PatternBoxProps {
  isOn: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  isHighlighted: boolean;
  editable: boolean;
}

const PatternBox = ({
  isOn,
  onClick,
  onMouseEnter,
  onMouseLeave,
  isHighlighted,
  editable,
}: PatternBoxProps) => {
  return editable ? (
    <Button
      size="sm"
      w="100%"
      h="100%"
      as="div"
      variant="led"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      bgColor={isOn ? "brand2.500" : "gray.300"}
      borderWidth={isHighlighted && !isOn ? 3 : 0}
      borderColor={isHighlighted ? (isOn ? "white" : "brand2.500") : undefined}
      opacity={isHighlighted && isOn ? 0.25 : 1}
    />
  ) : (
    <Box
      w="100%"
      h="100%"
      bgColor={isOn ? "brand2.500" : "gray.300"}
      borderRadius={5}
    />
  );
};

interface PatternColumnInputProps {
  colIdx: number;
  value: string;
  isInvalid: boolean;
  onChange: (value: string) => void;
}

const PatternColumnInput = ({
  colIdx,
  value,
  isInvalid,
  onChange,
}: PatternColumnInputProps) => {
  return (
    <FormControl isInvalid={isInvalid}>
      <VisuallyHidden>
        <FormLabel>
          <FormattedMessage
            id="connect-pattern-input-label"
            values={{ colNum: colIdx + 1 }}
          />
        </FormLabel>
      </VisuallyHidden>
      <NumberInput
        isRequired
        value={value}
        min={0}
        max={5}
        size="sm"
        onChange={onChange}
      >
        <NumberInputField p={1} m={0} opacity={0} _focus={{ opacity: 1 }} />
      </NumberInput>
    </FormControl>
  );
};

export default BluetoothPatternInput;
