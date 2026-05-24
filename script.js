const DIFFICULTIES = {
  easy: { label: "EASY", emptyCells: 35 },
  medium: { label: "MEDIUM", emptyCells: 45 },
  hard: { label: "HARD", emptyCells: 52 },
  expert: { label: "EXPERT", emptyCells: 58 },
  master: { label: "MASTER", emptyCells: 62 }
};

const MAX_MISTAKES = 50;

const boardElement = document.getElementById("sudoku-board");
const numberPadElement = document.getElementById("number-pad");
const difficultySelect = document.getElementById("difficulty");
const timerElement = document.getElementById("timer");
const currentDifficultyElement = document.getElementById("current-difficulty");
const mistakesElement = document.getElementById("mistakes");
const newGameButton = document.getElementById("new-game");
const resetButton = document.getElementById("reset");
const hintButton = document.getElementById("hint");
const checkButton = document.getElementById("check");
const solutionButton = document.getElementById("solution");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
const modalActions = document.getElementById("modal-actions");

let solutionBoard = [];
let puzzleBoard = [];
let playerBoard = [];
let lockedCells = [];
let hintCells = [];
let wrongCells = [];
let selectedCell = null;
let selectedNumber = null;
let mistakes = 0;
let elapsedSeconds = 0;
let timerId = null;
let gameEnded = false;
let solutionRevealed = false;

function createEmptyBoard(fillValue = 0) {
  return Array.from({ length: 9 }, () => Array(9).fill(fillValue));
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function shuffle(values) {
  const items = [...values];

  for (let index = items.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }

  return items;
}

function isSafe(board, row, col, value) {
  for (let index = 0; index < 9; index++) {
    if (board[row][index] === value || board[index][col] === value) {
      return false;
    }
  }

  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;

  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] === value) {
        return false;
      }
    }
  }

  return true;
}

function fillBoard(board) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (const value of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
          if (isSafe(board, row, col, value)) {
            board[row][col] = value;

            if (fillBoard(board)) {
              return true;
            }

            board[row][col] = 0;
          }
        }

        return false;
      }
    }
  }

  return true;
}

function generateSolvedBoard() {
  const board = createEmptyBoard();
  fillBoard(board);
  return board;
}

function createPuzzle(solvedBoard, emptyCellCount) {
  const puzzle = cloneBoard(solvedBoard);
  const positions = shuffle(Array.from({ length: 81 }, (_, index) => index));

  for (let index = 0; index < emptyCellCount; index++) {
    const position = positions[index];
    const row = Math.floor(position / 9);
    const col = position % 9;
    puzzle[row][col] = 0;
  }

  return puzzle;
}

function buildBoard() {
  boardElement.innerHTML = "";

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", `Row ${row + 1}, column ${col + 1}`);
      cell.addEventListener("click", () => selectCell(row, col));
      boardElement.appendChild(cell);
    }
  }
}

function buildNumberPad() {
  numberPadElement.innerHTML = "";

  for (let number = 1; number <= 9; number++) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "number-button";
    button.textContent = number;
    button.setAttribute("aria-label", `Enter ${number}`);
    button.addEventListener("click", () => placeNumber(number));
    numberPadElement.appendChild(button);
  }
}

function renderBoard() {
  const cells = boardElement.querySelectorAll(".cell");

  cells.forEach((cell) => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const value = playerBoard[row][col];
    const isSelected = selectedCell && selectedCell.row === row && selectedCell.col === col;
    const isSameRow = selectedCell && selectedCell.row === row;
    const isSameCol = selectedCell && selectedCell.col === col;
    const isSameBox = selectedCell
      && Math.floor(selectedCell.row / 3) === Math.floor(row / 3)
      && Math.floor(selectedCell.col / 3) === Math.floor(col / 3);
    const isMatch = selectedNumber && value === selectedNumber;

    cell.textContent = value || "";
    cell.className = "cell";
    cell.disabled = gameEnded;

    if (lockedCells[row][col]) cell.classList.add("given");
    if (hintCells[row][col]) cell.classList.add("hint");
    if (wrongCells[row][col]) cell.classList.add("wrong");
    if (isSameRow || isSameCol || isSameBox) cell.classList.add("highlight");
    if (isMatch) cell.classList.add("match");
    if (isSelected) cell.classList.add("selected");
    if (gameEnded) cell.classList.add("locked-ended");
  });
}

function selectCell(row, col) {
  if (gameEnded) return;

  selectedCell = { row, col };
  selectedNumber = playerBoard[row][col] || null;
  renderBoard();
}

function placeNumber(number) {
  if (gameEnded || !selectedCell) return;

  const { row, col } = selectedCell;

  if (lockedCells[row][col] || hintCells[row][col]) return;

  playerBoard[row][col] = number;
  selectedNumber = number;

  if (number === solutionBoard[row][col]) {
    wrongCells[row][col] = false;
    renderBoard();
    checkAutomaticWin();
    return;
  }

  wrongCells[row][col] = true;
  mistakes += 1;
  updateMistakes();
  renderBoard();

  if (mistakes >= MAX_MISTAKES) {
    endGame("Game Over", `Game over. You reached ${MAX_MISTAKES} mistakes.`, { disableSolution: true });
  }
}

function updateMistakes() {
  mistakesElement.textContent = `${mistakes} / ${MAX_MISTAKES}`;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function startTimer() {
  stopTimer();
  elapsedSeconds = 0;
  timerElement.textContent = formatTime(elapsedSeconds);
  timerId = window.setInterval(() => {
    elapsedSeconds += 1;
    timerElement.textContent = formatTime(elapsedSeconds);
  }, 1000);
}

function stopTimer() {
  if (timerId) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function setPlayControlsDisabled(disabled, options = {}) {
  resetButton.disabled = disabled;
  hintButton.disabled = disabled;
  checkButton.disabled = disabled;
  solutionButton.disabled = disabled || Boolean(options.disableSolution);

  numberPadElement.querySelectorAll("button").forEach((button) => {
    button.disabled = disabled;
  });
}

function startNewGame() {
  const selectedDifficulty = difficultySelect.value;
  const config = DIFFICULTIES[selectedDifficulty];

  solutionBoard = generateSolvedBoard();
  puzzleBoard = createPuzzle(solutionBoard, config.emptyCells);
  playerBoard = cloneBoard(puzzleBoard);
  lockedCells = puzzleBoard.map((row) => row.map((value) => value !== 0));
  hintCells = createEmptyBoard(false);
  wrongCells = createEmptyBoard(false);
  selectedCell = null;
  selectedNumber = null;
  mistakes = 0;
  gameEnded = false;
  solutionRevealed = false;

  currentDifficultyElement.textContent = config.label;
  updateMistakes();
  setPlayControlsDisabled(false);
  startTimer();
  renderBoard();
}

function resetGame() {
  if (gameEnded) return;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (!lockedCells[row][col] && !hintCells[row][col]) {
        playerBoard[row][col] = 0;
        wrongCells[row][col] = false;
      }
    }
  }

  mistakes = 0;
  selectedNumber = null;
  updateMistakes();
  renderBoard();
}

function giveHint() {
  if (gameEnded) return;

  const emptyCells = [];

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (playerBoard[row][col] === 0 || wrongCells[row][col]) {
        emptyCells.push({ row, col });
      }
    }
  }

  if (emptyCells.length === 0) {
    showMessage("No Hints", "There are no more hints available.");
    return;
  }

  const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  playerBoard[row][col] = solutionBoard[row][col];
  hintCells[row][col] = true;
  wrongCells[row][col] = false;
  selectedCell = { row, col };
  selectedNumber = solutionBoard[row][col];
  renderBoard();
  checkAutomaticWin();
}

function checkBoard() {
  if (gameEnded) return;

  let hasEmptyCell = false;
  let hasIncorrectCell = false;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (playerBoard[row][col] === 0) hasEmptyCell = true;
      if (playerBoard[row][col] !== 0 && playerBoard[row][col] !== solutionBoard[row][col]) {
        hasIncorrectCell = true;
        wrongCells[row][col] = true;
      }
    }
  }

  renderBoard();

  if (hasEmptyCell) {
    showMessage("Keep Going", "Please complete all cells first.");
    return;
  }

  if (hasIncorrectCell) {
    showMessage("Check Result", "Some cells are incorrect.");
    return;
  }

  winGame();
}

function checkAutomaticWin() {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (playerBoard[row][col] !== solutionBoard[row][col]) {
        return;
      }
    }
  }

  winGame();
}

function winGame() {
  const difficulty = DIFFICULTIES[difficultySelect.value].label;
  const time = formatTime(elapsedSeconds);
  endGame("Congratulations!", `Congratulations! You solved the Sudoku.\nDifficulty: ${difficulty}\nCompletion time: ${time}`);
}

function revealSolution() {
  if (gameEnded) return;

  showConfirm(
    "Reveal Solution",
    "Are you sure you want to reveal the full solution? This will end the game.",
    () => {
      playerBoard = cloneBoard(solutionBoard);
      wrongCells = createEmptyBoard(false);
      solutionRevealed = true;
      endGame("Solution Revealed", "Solution revealed. Game ended.", { revealed: true });
      renderBoard();
    }
  );
}

function endGame(title, message, options = {}) {
  gameEnded = true;
  stopTimer();
  setPlayControlsDisabled(true, { disableSolution: options.disableSolution || options.revealed });
  renderBoard();
  showMessage(title, message);
}

function showMessage(title, message) {
  openModal(title, message, [
    {
      label: "OK",
      className: "primary",
      action: closeModal
    }
  ]);
}

function showConfirm(title, message, onConfirm) {
  openModal(title, message, [
    {
      label: "Cancel",
      className: "secondary",
      action: closeModal
    },
    {
      label: "Reveal Solution",
      className: "confirm-danger",
      action: () => {
        closeModal();
        onConfirm();
      }
    }
  ]);
}

function openModal(title, message, actions) {
  modalTitle.textContent = title;
  modalMessage.innerHTML = message.replace(/\n/g, "<br>");
  modalActions.innerHTML = "";

  actions.forEach((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = action.label;
    button.className = action.className || "";
    button.addEventListener("click", action.action);
    modalActions.appendChild(button);
  });

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

function handleKeyboardInput(event) {
  if (gameEnded) return;

  const number = Number(event.key);
  if (number >= 1 && number <= 9) {
    placeNumber(number);
  }

  if (!selectedCell) return;

  const nextCell = { ...selectedCell };

  if (event.key === "ArrowUp") nextCell.row = Math.max(0, nextCell.row - 1);
  if (event.key === "ArrowDown") nextCell.row = Math.min(8, nextCell.row + 1);
  if (event.key === "ArrowLeft") nextCell.col = Math.max(0, nextCell.col - 1);
  if (event.key === "ArrowRight") nextCell.col = Math.min(8, nextCell.col + 1);

  if (nextCell.row !== selectedCell.row || nextCell.col !== selectedCell.col) {
    selectedCell = nextCell;
    selectedNumber = playerBoard[nextCell.row][nextCell.col] || null;
    renderBoard();
  }
}

newGameButton.addEventListener("click", startNewGame);
resetButton.addEventListener("click", resetGame);
hintButton.addEventListener("click", giveHint);
checkButton.addEventListener("click", checkBoard);
solutionButton.addEventListener("click", revealSolution);
difficultySelect.addEventListener("change", startNewGame);
modal.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-close-modal")) closeModal();
});
document.addEventListener("keydown", handleKeyboardInput);

buildBoard();
buildNumberPad();
startNewGame();
