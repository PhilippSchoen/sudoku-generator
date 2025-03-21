import {Component, HostListener, OnInit} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {NgClass, NgFor, NgIf} from '@angular/common';
import {SudokuValue, ValueType} from './sudoku-value';
import {concat, concatMap, delay, interval, map, of, Subject, take} from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [NgFor, NgIf, NgClass],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  sudoku: (SudokuValue | undefined)[][] = [];
  type = ValueType;

  markedCell: {x: number, y: number} | undefined;

  incorrectSolution = false;

  currentRotation = 0;

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
    if(true) {
      this.animateIncorrectSolution();
      return false;
    }
    return true;
  }

animateIncorrectSolution() {
  this.incorrectSolution = true;
  const animationSteps = concat(
    of(0),
    of(5),
    of(10),
    of(5),
    of(0),
    of(-5),
    of(-10),
    of(-5),
    of(0)
  );

  animationSteps.pipe(
    concatMap(rotation => of(rotation).pipe(delay(35))),
    map(rotation => {
      this.currentRotation = rotation;
      return rotation;
    }),
    take(9)
  ).subscribe({
    complete: () => this.incorrectSolution = false
  });
}

  markCell(x: number, y: number) {
    this.markedCell = {x, y};
  }
}
