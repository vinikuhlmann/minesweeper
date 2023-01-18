import { Component, OnInit } from '@angular/core';

class Square {
  x: number;
  y: number;
  adjacentMinesCount: number = 0;
  isMine: boolean = false;
  isFlagged: boolean = false;
  isRevealed: boolean = false;
  backgroundColor: string = '#111111';
  color(): string {
    switch (this.adjacentMinesCount) {
      case 0:
        return 'black';
      case 1:
        return '#3944BC';  // Dark blue
      case 2:
        return '#0F9D58'; // Emerald
      case 3:
        return '#DB4437'; // Red
      case 4:
        return '#4285F4'; // Blue
      case 5:
        return '#F4B400'; // Yellow
      case 6:
        return '#0F9D58'; // Cyan
      case 7:
        return '#DB4437'; // Magenta
      case 8:
        return '#4285F4'; // Gray
      default:
        console.error("Invalid adjacent mines count: " + this.adjacentMinesCount)
        return 'black';
    }
  }

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  toString(): string {
    return "Square(" + this.x + ", " + this.y + ")";
  }
}

@Component({
  selector: 'app-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.sass']
})
export class GridComponent implements OnInit {
  state: 'playing' | 'won' | 'lost' = 'playing';
  xSize!: number;
  ySize!: number;
  mineCount!: number;
  squaresRevealed: number = 0;
  squaresFlagged: number = 0;
  squares: Square[][] = [];

  constructor() { }

  /* ------------------- */
  /* ---- Formating ---- */
  /* ------------------- */

  getGridStyle() {
    return {
      'grid-template-columns': 'repeat(' + this.xSize + ', 1fr)',
      'grid-template-rows': 'repeat(' + this.ySize + ', 1fr)',
      'width': '($square-size + 5) * ' + this.xSize,
      'height': '($square-size + 5) * ' + this.ySize,
    }
  }

  asArray(): Square[] {
    const array: Square[] = [];
    for (const row of this.squares) {
      for (const square of row) {
        array.push(square);
      }
    }
    return array;
  }

  /* ------------------- */
  /* --- Generation --- */
  /* ------------------- */

  setDifficulty(difficulty: number): void {
    switch (difficulty) {
      case 1:
        this.xSize = 9;
        this.ySize = 9;
        this.mineCount = 10;
        break;
      case 2:
        this.xSize = 16;
        this.ySize = 16;
        this.mineCount = 40;
        break;
      case 3:
        this.xSize = 30;
        this.ySize = 16;
        this.mineCount = 99;
        break;
      default:
        console.error("Invalid difficulty: " + difficulty);
    }
    console.log("Difficulty set to " + difficulty)
  }

  ngOnInit(): void {
    this.newGame(1);
  }

  newGame(difficulty: number): void {
    this.resetTimer();
    this.squaresRevealed = 0;
    this.squaresFlagged = 0;
    this.state = 'playing';
    this.setDifficulty(difficulty);

    console.log("Starting game with size " + this.xSize + "x" + this.ySize + " and " + this.mineCount + " mines")
    this.createGrid();
    this.setMines();

    console.log("Game started");
  }

  createGrid(): void {
    this.squares = [];
    for (let y = 0; y < this.ySize; y++) {
      this.squares.push([]);
      for (let x = 0; x < this.xSize; x++) {
        this.squares[y].push(new Square(x, y));
      }
    }
    console.log("Created grid of size " + this.xSize + "x" + this.ySize)
  }

  setMines(): void {
    let amount = 0;
    const mine_indexes: [number, number][] = [];
    while (amount < this.mineCount) {
      const x = Math.floor(Math.random() * this.xSize);
      const y = Math.floor(Math.random() * this.ySize);
      // No duplicates
      if (!mine_indexes.some(([x2, y2]) => x === x2 && y === y2)) {
        this.addMine(this.squares[y][x]);
        mine_indexes.push([x, y]);
        amount++;
      }
    }
    console.log("Set " + this.mineCount + " mines randomly")
  }

  addMine(square: Square): void {
    if (square.isMine) {
      console.error("Tried to add a mine to a square that already has one");
      return;
    }
    square.isMine = true;
    for (const neighbor of this.getNeighbors(square)) {
      neighbor.adjacentMinesCount++;
    }
  }

  removeMine(square: Square): void {
    if (!square.isMine) {
      console.error("Tried to remove a mine from a square that doesn't have one");
      return;
    }
    square.isMine = false;
    for (const neighbor of this.getNeighbors(square)) {
      neighbor.adjacentMinesCount--;
    }
  }

  /* ------------------- */
  /* ------- Timer ----- */
  /* ------------------- */

  time: number = 0;
  timeDisplay: string = "00:00";
  interval!: any;

  startTimer() {
    this.interval = setInterval(() => {
      this.time++;
      this.timeDisplay = this.transformTimer(this.time)
    }, 1000);
  }

  transformTimer(value: number): string {
    const minutes: number = Math.floor(value / 60);
    return minutes.toString().padStart(2, '0') + ':' + (value - minutes * 60).toString().padStart(2, '0');
  }

  pauseTimer() {
    clearInterval(this.interval);
  }

  resetTimer() {
    this.pauseTimer();
    this.time = 0;
    this.timeDisplay = "00:00";
  }

  /* ------------------- */
  /* - Square handling - */
  /* ------------------- */

  getNeighbors(square: Square): Square[] {
    const neighbors: Square[] = [];
    const x = square.x;
    const y = square.y;
    for (let x2 of [x - 1, x, x + 1]) {
      for (let y2 of [y - 1, y, y + 1]) {
        if (x2 >= 0 && x2 < this.xSize && y2 >= 0 && y2 < this.ySize && !(x2 === x && y2 === y)) {
          const neighbor = this.squares[y2][x2];
          neighbors.push(neighbor);
        }
      }
    }
    return neighbors;
  }

  squareClicked(square: Square): void {
    console.log("Clicked on " + square);
    this.revealSquare(square);
  }

  revealSquare(square: Square): void {
    if (this.state !== 'playing'
      || square.isRevealed
      || square.isFlagged) {
      return;
    }

    // First click
    if (this.squaresRevealed === 0) {
      this.startTimer();
      // Swap mine if clicked on mine
      if (square.isMine) {
        console.log(square + "is a mine, swapping with another square")
        this.swapMine(square);
      }
    }

    // Reveal square
    square.isRevealed = true;
    square.backgroundColor = "#333333"
    this.squaresRevealed++;

    // Check if lost
    if (square.isMine) {
      square.backgroundColor = "#D2042D"
      this.state = 'lost';
      this.revealAllMines();
      this.pauseTimer();
      console.log(square + "is a mine, game over")
      return;
    }

    // Check if won
    if (this.squaresRevealed === this.xSize * this.ySize - this.mineCount) {
      this.state = 'won';
      this.pauseTimer();
      this.revealAllMines();
      console.log("Revealed all non-mine squares and won")
      return;
    }

    // Reveal neighbors if no mines around
    if (square.adjacentMinesCount === 0) {
      console.log(square + " has no adjacent mines, revealing neighbors")
      for (const neighbor of this.getNeighbors(square)) {
        if (!neighbor.isRevealed) {
          this.revealSquare(neighbor);
        }
      }
    }
  }

  swapMine(square: Square): void {
    while (true) {
      const mineX = Math.floor(Math.random() * this.xSize);
      const mineY = Math.floor(Math.random() * this.ySize);
      const newSquare = this.squares[mineY][mineX]
      // Swap mine to new location if it's not a mine, else continue
      if (!newSquare.isMine) {
        this.removeMine(square);
        this.addMine(newSquare);
        console.log("Moved mine from " + square + " to " + newSquare);
        break;
      }
    }
  }

  squareRightClicked(square: Square): boolean {
    if (this.state !== 'playing' || square.isRevealed) {
      return false;
    }
    square.isFlagged = !square.isFlagged;
    this.squaresFlagged += square.isFlagged ? 1 : -1;
    console.log("Right clicked on " + square + ", flag is " + (square.isFlagged ? "on" : "off"))
    return false;
  }

  revealAllMines(): void {
    for (const row of this.squares) {
      for (const square of row) {
        if (square.isMine) {
          square.isRevealed = true;
        }
      }
    }
  }
}
