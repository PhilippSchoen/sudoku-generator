import {Component, HostListener, OnInit} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {NgFor, NgIf} from '@angular/common';
import {SudokuValue, ValueType} from './sudoku-value';

@Component({
  selector: 'app-root',
  imports: [NgFor, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  sudoku: (SudokuValue | undefined)[][] = [];
  type = ValueType;

  markedCell: {x: number, y: number} | undefined;

  constructor() {
    this.generateSudoku();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if(event.key >= '1' && event.key <= '9') {
      if(this.markedCell) {
        this.sudoku[this.markedCell.y][this.markedCell.x] = {type: ValueType.User, value: +event.key};
      }
    }
  }

  generateSudoku() {
    this.sudoku = [];
    this.markedCell = undefined;
    for(let i = 0; i < 9; i++) {
      let row = [];
      for(let j = 0; j < 9; j++) {
        const value = Math.ceil(Math.random() * 9);
        row.push({type: ValueType.Predefined, value: Math.ceil(Math.random() * 9)});
      }
      this.sudoku.push(row);
    }

    for(let i = 0; i < 9; i++) {
      for(let j = 0; j < 9; j++) {
        if(Math.random() < 0.5) {
          this.sudoku[i][j] = undefined;
        }
      }
    }
  }

  verifySolution() {
    return true;
  }

  markCell(x: number, y: number) {
    this.markedCell = {x, y};
  }
}
