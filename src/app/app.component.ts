import {Component, HostListener, OnInit} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {NgClass, NgFor, NgIf} from '@angular/common';
import {SudokuValue, ValueType} from './sudoku-value';
import {concat, concatMap, delay, from, interval, map, of, Subject, Subscription, take} from 'rxjs';
import {Color} from '../colors';

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

  animatedTileIndex = [-1, -1];

  isSudokuSolved = false;

  animationSubscription?: Subscription;

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

    this.isSudokuSolved = false;
    this.animationSubscription?.unsubscribe();
    this.animatedTileIndex = [-1, -1];
  }

  verifySolution() {
    if(true) {
      this.animateIncorrectSolution();
    } else {
      this.animateCorrectSolution();
      this.isSudokuSolved = true;
    }
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

  animateCorrectSolution() {
    const animationSteps = from(Array.from({ length: 81 }, (_, i) => i + 1));

    this.animationSubscription = animationSteps.pipe(
      concatMap(step => of(step).pipe(delay(100))),
      map(step => {
        const rowIndex = Math.floor((step - 1) / 9);
        const colIndex = (step - 1) % 9;
        this.animatedTileIndex = [rowIndex, colIndex];
        return [rowIndex, colIndex];
      }),
      take(81)
    ).subscribe({
      complete: () => this.animatedTileIndex = [-1, -1]
    });
  }

  markCell(x: number, y: number) {
    this.markedCell = {x, y};
  }

  areCoordinatesEqual(reference: number[], compare: number[]): boolean {
    return reference[0] === compare[0] && reference[1] === compare[1];
  }

  isCoordinateAtOrBefore(reference: number[], compare: number[]): boolean {
    const [targetX, targetY] = compare;
    const [currentX, currentY] = reference;

    return !(
      currentX < targetX || (currentX === targetX && currentY <= targetY)
    );
  }

  protected readonly Color = Color;
}
