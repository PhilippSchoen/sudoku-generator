import {Injectable} from '@angular/core';
import {SudokuValue, ValueType} from '../../app/sudoku-value';
import {Difficulty} from './entities/difficulty';

@Injectable({
  providedIn: 'root'
})
export class SudokuService {

  constructor() { }

  generateSudoku(difficulty: Difficulty): SudokuValue[][] {
    const sudoku: SudokuValue[][] = [];
    for(let i = 0; i < 9; i++) {
      sudoku.push([]);
      for(let j = 0; j < 9; j++) {
        sudoku[i].push({type: ValueType.Empty, value: 0});
      }
    }

    return sudoku;
  }

  validateSudoku(board: SudokuValue[][]): boolean {
    for(let i = 0; i < 9; i++) {
      for(let j = 0; j < 9; j++) {
        if(board[i][j].type !== ValueType.Empty) {
          const column = board[i][j];
          board[i][j] = {type: ValueType.Empty, value: 0};
          if(!this.isVariableValid(board, i, j, column.value)) {
            return false;
          }
          board[i][j] = column;
        }
      }
    }
    return true;
  }

  private isVariableValid(board: SudokuValue[][], row: number, col: number, num: number): boolean {
    for (let x = 0; x < 9; x++) {
      if (
        board[row][x].value === num || // Within the same row
        board[x][col].value === num || // Within the same column
        board[Math.floor(row / 3) * 3 + Math.floor(x / 3)][Math.floor(col / 3) * 3 + x % 3].value === num // Within the same 3x3 box
      ) {
        return false;
      }
    }
    return true;
  }
}
