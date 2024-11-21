import {
  Button,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  NumberInput,
  NumberInputField,
  VisuallyHidden,
} from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import {
  generateMatrix,
  getHighlightedColumns,
  transformColumnsToMatrix,
  transformMatrixToColumns,
  updateMatrixColumns,
} from "../bt-pattern-matrix-utils";
import React from "react";

interface BluetoothPatternInputProps {
  pattern: boolean[];
  onChange: (matrix: boolean[]) => void;
  invalid: boolean;
}

const matrixDim = 5;

const BluetoothPatternInput = ({
  pattern,
  onChange,
  invalid,
}: BluetoothPatternInputProps) => {
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
      onChange(matrix);
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

  return (
    <Grid
      templateColumns="repeat(5, 35px)"
      templateRows="repeat(6, 35px)"
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
              />
            </GridItem>
          ))}
          <GridItem key={`col-${colIdx}-pattern-input`}>
            <PatternColumnInput
              isInvalid={invalid}
              onChange={columnInputOnChange(colIdx)}
              colIdx={colIdx}
              value={inputValues[colIdx]}
            />
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
}

const PatternBox = ({
  isOn,
  onClick,
  onMouseEnter,
  onMouseLeave,
  isHighlighted,
}: PatternBoxProps) => {
  return (
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
