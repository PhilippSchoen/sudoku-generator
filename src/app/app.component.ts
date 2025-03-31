import { Component, HostListener } from '@angular/core';
import { CommonModule, NgClass, NgFor, NgIf } from '@angular/common';
import { SudokuValue, ValueType } from './sudoku-value';
import {
  concat,
  concatMap,
  delay,
  from,
  map,
  Observable,
  of,
  Subscription,
  take,
} from 'rxjs';
import { Color } from '../colors';
import { Theme } from './entities/theme';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { SudokuService } from '../services/sudoku-service/sudoku.service';
import { TimerPipe } from '../pipes/timer.pipe';
import { Difficulty } from '../services/sudoku-service/entities/difficulty';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';

@Component({
  selector: 'app-root',
  imports: [
    NgFor,
    NgIf,
    NgClass,
    HttpClientModule,
    TimerPipe,
    Dialog,
    ButtonModule,
    CommonModule,
    CarouselModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  visible = false;
  sudoku: SudokuValue[][] = [];
  notes: string[][] = [];
  type = ValueType;

  markedCell: { x: number; y: number } | undefined;
  incorrectSolution = false;
  currentRotation = 0;
  animatedTileIndex = [-1, -1];
  isSudokuSolved = false;
  animationSubscription?: Subscription;

  activeTool: ValueType = ValueType.User;
  areHintsEnabled = true;
  themes: Theme[] = [];
  private themesUrl = 'assets/themes.json';
  activeTheme?: Theme;
  selectedTheme!: Theme;
  isZenMode = true;

  timeUsed = 0;
  errorCount = 0;
  intervalId: any;
  selectedDifficulty = Difficulty.Medium;
  responsiveOptions: any[] | undefined;
  currentWidth = 0;

  constructor(private http: HttpClient, private sudokuService: SudokuService) {
    this.generateSudoku(this.selectedDifficulty);
    this.loadThemes().subscribe((themes) => {
      this.themes = themes;
      this.selectTheme(themes[0]);
    });

    this.markedCell = { x: 0, y: 0 };

    this.currentWidth = window.innerWidth;
  }

  selectDifficulty(difficulty?: Difficulty) {
    if (difficulty) {
      this.selectedDifficulty = difficulty;
    } else {
      switch (this.selectedDifficulty) {
        case Difficulty.Easy:
          this.selectedDifficulty = Difficulty.Medium;
          break;
        case Difficulty.Medium:
          this.selectedDifficulty = Difficulty.Hard;
          break;
        case Difficulty.Hard:
          this.selectedDifficulty = Difficulty.Easy;
          break;
      }
    }
    this.generateSudoku(this.selectedDifficulty);
  }

  selectTheme(theme: Theme) {
    this.activeTheme = theme;
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-black', theme.colors.black);
    root.style.setProperty('--color-gray', theme.colors.gray);
    root.style.setProperty('--color-error', theme.colors.error);
  }

  loadThemes(): Observable<Theme[]> {
    return this.http.get<Theme[]>(this.themesUrl);
  }

  color(type: Color) {
    switch (type) {
      case Color.Black:
        return this.activeTheme?.colors.black;
      case Color.Gray:
        return this.activeTheme?.colors.gray;
      case Color.Error:
        return this.activeTheme?.colors.error;
      case Color.Primary:
        return this.activeTheme?.colors.primary;
      case Color.Secondary:
        return this.activeTheme?.colors.secondary;
    }
  }

  startTimer() {
    this.intervalId = setInterval(() => {
      this.timeUsed++;
    }, 1000);
  }

  clearTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  resetTimer() {
    this.clearTimer();
    this.timeUsed = 0;
    this.startTimer();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.currentWidth = event.target.innerWidth;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Arrow navigation

    if (event.key.startsWith('Arrow')) {
      if (!this.markedCell) {
        this.markedCell = { x: 0, y: 0 };
      } else {
        switch (event.key) {
          case 'ArrowUp':
            this.markedCell.y = (this.markedCell.y + 8) % 9;
            break;
          case 'ArrowDown':
            this.markedCell.y = (this.markedCell.y + 1) % 9;
            break;
          case 'ArrowLeft':
            this.markedCell.x = (this.markedCell.x + 8) % 9;
            break;
          case 'ArrowRight':
            this.markedCell.x = (this.markedCell.x + 1) % 9;
            break;
        }
      }
    }

    if (
      (event.key === 'Enter' && this.activeTool === ValueType.Empty) ||
      event.key === 'Backspace'
    ) {
      if (
        this.markedCell &&
        this.sudoku[this.markedCell.y][this.markedCell.x]?.type !==
          ValueType.Predefined
      ) {
        this.sudoku[this.markedCell.y][this.markedCell.x] = {
          type: ValueType.Empty,
          value: 0,
        };
        this.notes[this.markedCell.y][this.markedCell.x] = '';
      }
    }

    if (
      this.markedCell &&
      this.sudoku[this.markedCell.y][this.markedCell.x]?.type !==
        ValueType.Predefined
    ) {
      if (event.key >= '1' && event.key <= '9') {
        this.insertValue(event.key);
      }
    }
  }

  insertValue(input: string) {
    if (this.activeTool === ValueType.User) {
      if (
        this.markedCell &&
        this.sudoku[this.markedCell.y][this.markedCell.x]?.type !==
          ValueType.Predefined
      ) {
        this.sudoku[this.markedCell.y][this.markedCell.x] = {
          type: ValueType.User,
          value: +input,
        };
        if (
          !this.isZenMode ||
          this.sudoku.every((row) =>
            row.every((cell) => cell?.type !== ValueType.Empty)
          )
        ) {
          this.verifySolution();
        }
      }
    }

    // Writing notes
    else if (this.activeTool === ValueType.Note) {
      if (this.markedCell) {
        const { x, y } = this.markedCell;

        switch (input) {
          case 'Backspace':
            this.notes[y][x] = this.notes[y][x].slice(0, -1);
            break;
          default:
            if (this.notes[y][x].length < 8) {
              this.notes[y][x] += input;
            }
        }
      }
    }
  }

  generateSudoku(difficulty = Difficulty.Medium) {
    this.sudoku = [];
    this.notes = [];
    this.markedCell = undefined;

    this.sudoku = this.sudokuService.generateSudoku(difficulty);

    this.markedCell = { x: 0, y: 0 };

    for (let i = 0; i < 9; i++) {
      let noteRow = [];
      for (let j = 0; j < 9; j++) {
        noteRow.push('');
      }
      this.notes.push(noteRow);
    }

    this.isSudokuSolved = false;
    this.animationSubscription?.unsubscribe();
    this.animatedTileIndex = [-1, -1];

    this.resetTimer();
    this.errorCount = 0;
  }

  verifySolution() {
    if (!this.sudokuService.validateSudoku(this.sudoku)) {
      this.animateIncorrectSolution();
      this.errorCount++;
    } else if (
      this.sudoku.every((row) =>
        row.every((cell) => cell?.type !== ValueType.Empty)
      )
    ) {
      this.animateCorrectSolution();
      this.isSudokuSolved = true;
    }
  }

  switchTheme() {
    const currentIndex = this.themes.indexOf(this.activeTheme!);
    const nextIndex = (currentIndex + 1) % this.themes.length;
    this.selectTheme(this.themes[nextIndex]);
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

    animationSteps
      .pipe(
        concatMap((rotation) => of(rotation).pipe(delay(35))),
        map((rotation) => {
          this.currentRotation = rotation;
          return rotation;
        }),
        take(9)
      )
      .subscribe({
        complete: () => (this.incorrectSolution = false),
      });
  }

  animateCorrectSolution() {
    const animationSteps = from(Array.from({ length: 81 }, (_, i) => i + 1));

    this.animationSubscription = animationSteps
      .pipe(
        concatMap((step) => of(step).pipe(delay(100))),
        map((step) => {
          const rowIndex = Math.floor((step - 1) / 9);
          const colIndex = (step - 1) % 9;
          this.animatedTileIndex = [rowIndex, colIndex];
          return [rowIndex, colIndex];
        }),
        take(81)
      )
      .subscribe({
        complete: () => (this.animatedTileIndex = [-1, -1]),
      });
  }

  markCell(x: number, y: number) {
    if (
      this.activeTool === ValueType.Empty &&
      this.sudoku[y][x]?.type !== ValueType.Predefined
    ) {
      this.sudoku[y][x] = { type: ValueType.Empty, value: 0 };
      this.notes[y][x] = '';
    }
    this.markedCell = { x, y };
  }

  areCoordinatesEqual(reference: number[], compare: number[]): boolean {
    return reference[0] === compare[0] && reference[1] === compare[1];
  }

  isCoordinateAtOrBefore(reference: number[], compare: number[]): boolean {
    const [targetX, targetY] = compare;
    const [currentX, currentY] = reference;

    return !(
      currentX < targetX ||
      (currentX === targetX && currentY <= targetY)
    );
  }

  isHighlighted(x: number, y: number): boolean {
    if (this.markedCell && this.areHintsEnabled) {
      const { x: markedX, y: markedY } = this.markedCell;
      if (
        this.sudoku[y][x]?.value === this.sudoku[markedY][markedX]?.value &&
        this.sudoku[markedY][markedX].type !== ValueType.Empty
      ) {
        return true;
      }
    }
    return false;
  }

  showDialog() {
    this.visible = true;
  }

  protected readonly Color = Color;
  protected readonly Difficulty = Difficulty;
}
