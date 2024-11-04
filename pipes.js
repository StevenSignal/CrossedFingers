const ROWS = 6;
const COLS = 6;
const gameContainer = document.getElementById('game-container');
const flowButton = document.getElementById('flow-button');
let grid = [];

class Pipe {
    constructor(type, rotation = 0) {
        this.type = type; // 'straight', 'curve'
        this.rotation = rotation; // 0, 90, 180, 270
        this.element = document.createElement('div');
        this.element.classList.add('tile');
        this.setClasses();

        this.element.addEventListener('click', () => {
            this.rotate();
            resetWaterFlow();
        });
    }

    rotate() {
        this.rotation = (this.rotation + 90) % 360;
        this.setClasses();
    }

    setClasses() {
        this.element.className = 'tile'; // Reset classes
        if (this.type === 'straight') {
            this.element.classList.add('pipe-straight');
            if (this.rotation % 180 === 0) {
                this.element.classList.add('vertical');
            } else {
                this.element.classList.add('horizontal');
            }
        } else if (this.type === 'curve') {
            this.element.classList.add('pipe-curve');
            switch (this.rotation) {
                case 0:
                    this.element.classList.add('top-right');
                    break;
                case 90:
                    this.element.classList.add('right-bottom');
                    break;
                case 180:
                    this.element.classList.add('bottom-left');
                    break;
                case 270:
                    this.element.classList.add('left-top');
                    break;
            }
        }
    }

    getOpenings() {
        const openings = [];
        if (this.type === 'straight') {
            if (this.rotation % 180 === 0) {
                openings.push('top', 'bottom');
            } else {
                openings.push('left', 'right');
            }
        } else if (this.type === 'curve') {
            switch (this.rotation) {
                case 0:
                    openings.push('top', 'right');
                    break;
                case 90:
                    openings.push('right', 'bottom');
                    break;
                case 180:
                    openings.push('bottom', 'left');
                    break;
                case 270:
                    openings.push('left', 'top');
                    break;
            }
        }
        return openings;
    }
}

function initGame() {
    gameContainer.innerHTML = '';
    grid = [];

    // Generate a solvable path
    const path = generateSolvablePath();

    // Place the path into the grid
    for (let i = 0; i < ROWS; i++) {
        grid[i] = [];
        for (let j = 0; j < COLS; j++) {
            grid[i][j] = null;
        }
    }
    path.forEach(cell => {
        grid[cell.row][cell.col] = cell.pipe;
    });

    // Fill the rest of the grid with random pipes
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (!grid[row][col]) {
                const types = ['straight', 'curve'];
                const type = types[Math.floor(Math.random() * types.length)];
                const rotation = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
                grid[row][col] = new Pipe(type, rotation);
            }
            gameContainer.appendChild(grid[row][col].element);
        }
        const br = document.createElement('br');
        gameContainer.appendChild(br);
    }
}

function generateSolvablePath() {
    const path = [];
    let currentRow = 0;
    let currentCol = 0;
    let direction = 'right'; // Start moving to the right
    const directions = ['up', 'right', 'down', 'left'];

    while (currentRow !== ROWS - 1 || currentCol !== COLS - 1) {
        const possibleDirections = [];

        // Determine possible directions
        if (direction !== 'down' && currentRow > 0) possibleDirections.push('up');
        if (direction !== 'left' && currentCol < COLS - 1) possibleDirections.push('right');
        if (direction !== 'up' && currentRow < ROWS - 1) possibleDirections.push('down');
        if (direction !== 'right' && currentCol > 0) possibleDirections.push('left');

        // Choose a new direction
        direction = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];

        let pipeType, rotation;
        if (path.length > 0) {
            const lastCell = path[path.length - 1];
            const lastDirection = getDirectionFromMovement(lastCell, { row: currentRow, col: currentCol });
            if (direction !== lastDirection) {
                // Use a curve pipe if changing direction
                pipeType = 'curve';
                rotation = getCurveRotation(lastDirection, direction);
            } else {
                // Use a straight pipe if continuing in the same direction
                pipeType = 'straight';
                rotation = getStraightRotation(direction);
            }
        } else {
            // For the first pipe
            pipeType = 'straight';
            rotation = getStraightRotation(direction);
        }

        const pipe = new Pipe(pipeType, rotation);
        path.push({ row: currentRow, col: currentCol, pipe });

        // Move to the next cell
        if (direction === 'up') currentRow--;
        if (direction === 'down') currentRow++;
        if (direction === 'left') currentCol--;
        if (direction === 'right') currentCol++;
    }

    // Place the end pipe
    const endPipe = new Pipe('straight', getStraightRotation(direction));
    path.push({ row: currentRow, col: currentCol, pipe: endPipe });

    return path;
}

function getDirectionFromMovement(prev, current) {
    if (current.row < prev.row) return 'up';
    if (current.row > prev.row) return 'down';
    if (current.col < prev.col) return 'left';
    if (current.col > prev.col) return 'right';
    return null;
}

function getCurveRotation(fromDir, toDir) {
    const rotations = {
        'up-right': 0,
        'right-down': 90,
        'down-left': 180,
        'left-up': 270,
        'up-left': 270,
        'left-down': 180,
        'down-right': 90,
        'right-up': 0
    };
    return rotations[`${fromDir}-${toDir}`];
}

function getStraightRotation(direction) {
    return direction === 'up' || direction === 'down' ? 0 : 90;
}

function startWaterFlow() {
    resetWaterFlow();

    let visited = [];
    let queue = [{ row: 0, col: 0 }];

    while (queue.length > 0) {
        const { row, col } = queue.shift();
        const pipe = grid[row][col];

        if (!pipe || visited.find(v => v.row === row && v.col === col)) continue;

        pipe.element.classList.add('water-flow');
        visited.push({ row, col });
        
        if (row === ROWS - 1 && col === COLS - 1) {
            const winEvent = new Event('gameWin');
            document.dispatchEvent(winEvent);
            return;
        }

        const openings = pipe.getOpenings();

        openings.forEach(opening => {
            let newRow = row;
            let newCol = col;

            if (opening === 'top') newRow--;
            if (opening === 'bottom') newRow++;
            if (opening === 'left') newCol--;
            if (opening === 'right') newCol++;

            if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
                const nextPipe = grid[newRow][newCol];
                if (nextPipe) {
                    const nextOpenings = nextPipe.getOpenings();
                    const opposite = getOppositeDirection(opening);
                    if (nextOpenings.includes(opposite)) {
                        queue.push({ row: newRow, col: newCol });
                    }
                }
            }
        });
    }
}

function resetWaterFlow() {
    document.querySelectorAll('.tile').forEach(tile => {
        tile.classList.remove('water-flow');
    });
}

function getOppositeDirection(direction) {
    switch (direction) {
        case 'top':
            return 'bottom';
        case 'bottom':
            return 'top';
        case 'left':
            return 'right';
        case 'right':
            return 'left';
    }
}

flowButton.addEventListener('click', () => {
    startWaterFlow();
});

initGame();