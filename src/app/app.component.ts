import {Component, OnInit} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {NgFor} from '@angular/common';
import {SudokuValue, ValueType} from './sudoku-value';

@Component({
  selector: 'app-root',
  imports: [NgFor],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'sudoku-generator';

  sudoku: (SudokuValue | undefined)[][] = [];
  type = ValueType;

  constructor() {
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
}
