import {Injectable} from '@angular/core';
import {SudokuValue, ValueType} from '../../app/sudoku-value';
import {Difficulty} from './entities/difficulty';

@Injectable({
  providedIn: 'root'
})
export class SudokuService {

  cachedSolution?: SudokuValue[][];

  constructor() {
    this.initializeArcs();
  }

  private domains: Set<number>[][] = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set([1, 2, 3, 4, 5, 6, 7, 8, 9])));
  private arcs: [number, number][][][] = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => [] as [number, number][]));

  initializeArcs() {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        for (let x = 0; x < 9; x++) {
          if (x !== i) this.arcs[i][j].push([x, j]);
          if (x !== j) this.arcs[i][j].push([i, x]);
        }
        const boxRowStart = Math.floor(i / 3) * 3;
        const boxColStart = Math.floor(j / 3) * 3;
        for (let x = boxRowStart; x < boxRowStart + 3; x++) {
          for (let y = boxColStart; y < boxColStart + 3; y++) {
            if (x !== i || y !== j) this.arcs[i][j].push([x, y]);
          }
        }
      }
    }
  }

  /** Note: Backtracking for 9x9 sudoku is already too fast to make use of AC-3 feasible
   * Could be integrated for larger sudoku later on <br>
   * Backtracking runtime: ~1ms <br>
   * AC-3 runtime: ~1/4ms */
  private ac3(board: SudokuValue[][]): boolean {
    const queue: [number, number, number, number][] = [];
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        for (let [x, y] of this.arcs[i][j]) {
          queue.push([i, j, x, y]);
        }
      }
    }

    while (queue.length > 0) {
      const [i, j, x, y] = queue.shift()!;
      if (this.revise(i, j, x, y)) {
        if (this.domains[i][j].size === 0) {
          return false;
        }
        for (let [nx, ny] of this.arcs[i][j]) {
          if (nx !== x || ny !== y) {
            queue.push([nx, ny, i, j]);
          }
        }
      }
    }
    return true;
  }

  private revise(i: number, j: number, x: number, y: number): boolean {
    let revised = false;
    for (let value of new Set(this.domains[i][j])) {
      let hasSupport = false;
      for (let neighbor of this.domains[x][y]) {
        if (value !== neighbor) {
          hasSupport = true;
          break;
        }
      }
      if (!hasSupport) {
        this.domains[i][j].delete(value);
        revised = true;
      }
    }
    return revised;
  }

  generateSudoku(difficulty: Difficulty): SudokuValue[][] {
    const sudoku: SudokuValue[][] = [];
    for(let i = 0; i < 9; i++) {
      sudoku.push([]);
      for(let j = 0; j < 9; j++) {
        sudoku[i].push({type: ValueType.Empty, value: 0});
      }
    }

    this.solveSudoku(sudoku);
    this.cachedSolution = JSON.parse(JSON.stringify(sudoku));

    this.removeNumbers(sudoku, difficulty);

    return sudoku;
  }

  validateSudoku(board: SudokuValue[][]): boolean {
    if(!this.cachedSolution) {
      return false;
    }
    for(let i = 0; i < 9; i++) {
      for(let j = 0; j < 9; j++) {
        if(board[i][j].type === ValueType.User && board[i][j].value !== this.cachedSolution[i][j].value) {
          return false;
        }
      }
    }
    return true;
  }

  private shuffleArray(array: number[]): number[] {
    for(let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  private solveSudoku(board: SudokuValue[][]): boolean {
    for(let i = 0; i < 9; i++) {
      for(let j = 0; j < 9; j++) {
        if(board[i][j].type === ValueType.Empty) {
          const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
          for(let num of numbers) {
            if(this.isVariableValid(board, i, j, num)) {
              board[i][j] = {type: ValueType.Predefined, value: num};
              if(this.solveSudoku(board)) {
                return true;
              }
              board[i][j] = {type: ValueType.Empty, value: 0};
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  private countSolutions(board: SudokuValue[][]): number {
    let count = 0;

    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j].type === ValueType.Empty) {
          const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
          for (let num of numbers) {
            if (this.isVariableValid(board, i, j, num)) {
              board[i][j] = { type: ValueType.User, value: num };

              count += this.countSolutions(board);

              board[i][j] = { type: ValueType.Empty, value: 0 };
            }
          }
          return count;
        }
      }
    }

    return 1;
  }

  private removeNumbers(board: SudokuValue[][], difficulty: Difficulty) {
    let attemptCount = 10;
    switch(difficulty) {
      case Difficulty.Easy:
        attemptCount = 30;
        break;
      case Difficulty.Medium:
        attemptCount = 40;
        break;
      case Difficulty.Hard:
        attemptCount = 50;
        break;
    }
    let attempts = 0;
    while(attempts < attemptCount) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);
      if(board[row][col].type !== ValueType.Empty) {
        const value = board[row][col].value;
        board[row][col] = {type: ValueType.Empty, value: 0};
        const boardCopy = JSON.parse(JSON.stringify(board));
        if(this.countSolutions(boardCopy) !== 1) {
          board[row][col] = {type: ValueType.Predefined, value};
        } else {
          attempts++;
        }
      }
    }
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
