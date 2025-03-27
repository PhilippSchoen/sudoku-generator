export interface SudokuValue {
  type: ValueType;
  value: number;
}

export enum ValueType {
  Predefined,
  User,
  Note,
  Empty
}
