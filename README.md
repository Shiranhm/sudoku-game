# SUDOKU MASTER

SUDOKU MASTER is a polished, mobile-first Sudoku web game built with HTML, CSS, and JavaScript only. It runs directly in the browser, works offline once loaded, and is suitable for free hosting on GitHub Pages.

## Features

- Fully playable 9x9 Sudoku game
- Valid completed board generation
- Five difficulty levels
- Timer and mistake counter
- Maximum of 50 mistakes
- New Game, Reset, Hint, Check, Game Rules, and Solution controls
- Custom modal messages and solution confirmation
- Built-in rules modal explaining how to play
- Locked original clues, editable player cells, and locked hint cells
- Row, column, 3x3 box, selected cell, and matching number highlights
- Wrong entries shown in red
- Mobile-first layout with large tap targets
- Keyboard number entry and arrow-key navigation support
- No frameworks, backend, database, installation, or paid services

## Difficulty Levels

| Difficulty | Empty Cells |
| --- | ---: |
| EASY | 35 |
| MEDIUM | 45 |
| HARD | 52 |
| EXPERT | 58 |
| MASTER | 62 |

## Folder Structure

```text
sudoku-game/
+-- index.html
+-- style.css
+-- script.js
+-- README.md
```

## How to Run Locally

Open `index.html` directly in any modern browser.

You can also serve the folder with a simple local server if you prefer:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## GitHub Pages Hosting

1. Create a GitHub repository called `sudoku-game`.
2. Upload `index.html`, `style.css`, `script.js`, and `README.md`.
3. Go to repository Settings.
4. Go to Pages.
5. Select Deploy from a branch.
6. Select branch `main`.
7. Select folder `/root`.
8. Save.
9. GitHub will provide the live website link.

## Built With

SUDOKU MASTER is built with HTML, CSS, and JavaScript only.
