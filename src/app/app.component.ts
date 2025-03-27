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
  notes: string[][] = [];
  type = ValueType;

  markedCell: {x: number, y: number} | undefined;
  incorrectSolution = false;
  currentRotation = 0;
  animatedTileIndex = [-1, -1];
  isSudokuSolved = false;
  animationSubscription?: Subscription;

  activeTool: ValueType = ValueType.User;

  constructor() {
    this.generateSudoku();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Arrow navigation
    switch(event.key) {
      case 'ArrowUp':
        if(this.markedCell) {
          do {
            this.markedCell.y = (this.markedCell.y + 8) % 9;
          } while(this.sudoku[this.markedCell.y][this.markedCell.x]?.type === ValueType.Predefined)
        }
        break;
      case 'ArrowDown':
        if(this.markedCell) {
          do {
            this.markedCell.y = (this.markedCell.y + 1) % 9;
          } while(this.sudoku[this.markedCell.y][this.markedCell.x]?.type === ValueType.Predefined)
        }
        break;
      case 'ArrowLeft':
        if(this.markedCell) {
          do{
            this.markedCell.x = (this.markedCell.x + 8) % 9;
          } while(this.sudoku[this.markedCell.y][this.markedCell.x]?.type === ValueType.Predefined)
        }
        break;
      case 'ArrowRight':
        if(this.markedCell) {
          do {
            this.markedCell.x = (this.markedCell.x + 1) % 9;
          } while(this.sudoku[this.markedCell.y][this.markedCell.x]?.type === ValueType.Predefined)
        }
        break;
    }

    // Writing values
    if(this.activeTool === ValueType.User) {
      if(event.key >= '1' && event.key <= '9') {
        if(this.markedCell) {
          this.sudoku[this.markedCell.y][this.markedCell.x] = {type: ValueType.User, value: +event.key};
        }
      }
    }

    // Writing notes
    else if(this.activeTool === ValueType.Note) {
      if(this.markedCell) {
        const { x, y } = this.markedCell;

        switch (event.key) {
          case 'Backspace':
            this.notes[y][x] = this.notes[y][x].slice(0, -1);
            event.preventDefault();
            break;
          default:
            if (event.key >= '1' && event.key <= '9' && this.notes[y][x].length < 8) {
              this.notes[y][x] += event.key;
            }
        }
      }
    }
  }

  generateSudoku() {
    this.sudoku = [];
    this.notes = [];
    this.markedCell = undefined;
    for(let i = 0; i < 9; i++) {
      let row = [];
      let noteRow = [];
      for(let j = 0; j < 9; j++) {
        row.push({type: ValueType.Predefined, value: Math.ceil(Math.random() * 9)});
        noteRow.push('');
      }
      this.sudoku.push(row);
      this.notes.push(noteRow);
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

  selectTool(tool: ValueType) {
    this.activeTool = tool;
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
    if(this.activeTool === ValueType.Empty) {
      this.sudoku[y][x] = undefined;
      this.notes[y][x] = '';
    }
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
