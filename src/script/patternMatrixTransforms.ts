export const transformMatrixToColumns = <T>(m: T[], matrixDimension: number): T[][] => {
  const cols = [];
  for (let colId = 1; colId <= matrixDimension; colId++) {
    const remainder = colId === matrixDimension ? 0 : colId;
    cols.push(m.filter((_c, i) => (i + 1) % matrixDimension === remainder));
  }
  return cols;
};

export const transformColumnsToMatrix = <T>(cols: T[][]): T[] => {
  let matrix: T[] = [];
  for (let i = 0; i < cols.length; i++) {
    matrix = [...matrix, ...cols.map(c => c[i])];
  }
  return matrix;
};

export const generateMatrix = <T>(dimension: number, fillValue: T) => {
  return new Array<T[]>(dimension).fill(new Array<T>(dimension).fill(fillValue));
};

export type MatrixColumns = boolean[][];

export interface CellPosition {
  colIdx: number;
  rowIdx: number;
}

export const getHighlightedColumns = (
  matrixColumns: MatrixColumns,
  cellPos: CellPosition,
) => {
  const col = matrixColumns[cellPos.colIdx];
  const highlightedCol = col.map(
    (isOn, idx) => (!isOn && cellPos.rowIdx <= idx) || (isOn && cellPos.rowIdx > idx),
  );
  const highlightedColumns = generateMatrix(matrixColumns.length, false);
  highlightedColumns[cellPos.colIdx] = highlightedCol;
  return highlightedColumns;
};

export const updateMatrixColumns = (
  matrixColumns: MatrixColumns,
  cellPos: CellPosition,
) => {
  const newCol = Array(matrixColumns.length).fill(false).fill(true, cellPos.rowIdx);
  return [
    ...matrixColumns.slice(0, cellPos.colIdx),
    newCol,
    ...matrixColumns.slice(cellPos.colIdx + 1),
  ];
};
