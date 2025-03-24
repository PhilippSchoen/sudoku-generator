import { Injectable } from '@angular/core';
import {SudokuValue, ValueType} from '../../app/sudoku-value';
import {Difficulty} from './entities/difficulty';

@Injectable({
  providedIn: 'root'
})
export class SudokuService {

  constructor() { }

  generateSudoku(difficulty: Difficulty): (SudokuValue | undefined)[][] {
    const sudoku: (SudokuValue | undefined)[][] = [];

    return sudoku;
  }

  private isVariableValid(board: number[][], row: number, col: number, num: number): boolean {
    for (let x = 0; x < 9; x++) {
      if (
        board[row][x] === num || // Within the same row
        board[x][col] === num || // Within the same column
        board[Math.floor(row / 3) * 3 + Math.floor(x / 3)][Math.floor(col / 3) * 3 + x % 3] === num // Within the same 3x3 box
      ) {
        return false;
      }
    }
    return true;
  }
}
