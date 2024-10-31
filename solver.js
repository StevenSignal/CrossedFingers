class CrosswordSolver {
    constructor() {
        this.crossword = null;
        this.priorityDirection = null;
        this.cellInputs = new Map();
        this.words = new Map();
        this.hasWon = false;
        this.init();
    }

    async init() {
        this.crossword = CROSSWORD_DATA;
        this.setup();
    }

    setup() {
        document.getElementById('crosswordName').innerHTML = this.crossword.name;
        this.createGrid();
        this.setupHints();
    }

    createGrid() {
        const grid = document.getElementById('crosswordGrid');
        grid.style.width = `${this.crossword.dimensions.width * 40}px`;
        grid.style.height = `${this.crossword.dimensions.height * 40}px`;

        // Создаем пустую сетку
        for (let y = 0; y < this.crossword.dimensions.height; y++) {
            for (let x = 0; x < this.crossword.dimensions.width; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell empty';
                cell.style.left = `${x * 40}px`;
                cell.style.top = `${y * 40}px`;
                grid.appendChild(cell);
            }
        }

        // Добавляем слова
        this.crossword.words.forEach(word => {
            const wordCells = [];
            for (let i = 0; i < word.word.length; i++) {
                const x = word.direction === 'horizontal' ? word.x + i : word.x;
                const y = word.direction === 'vertical' ? word.y + i : word.y;
                const cell = this.getCellAt(x, y);
                
                // Убираем проверку на filled, добавляем класс в любом случае
                cell.className = 'cell filled';
                
                // Проверяем, есть ли уже input
                let input = cell.querySelector('input');
                if (!input) {
                    input = document.createElement('input');
                    input.maxLength = 1;
                    input.dataset.x = x;
                    input.dataset.y = y;
                    cell.appendChild(input);
                }
                
                if (i === 0) {
                    if (!cell.querySelector('.word-number')) {
                        const number = document.createElement('span');
                        number.className = 'word-number';
                        number.textContent = this.crossword.words.indexOf(word);
                        cell.appendChild(number);
                    } else {
                        cell.querySelector('.word-number').textContent = this.crossword.words.indexOf(word);
                    }
        
                    // при клике на поле, устанавливаем приоритетное направление
                    input.addEventListener('click', () => {
                        this.priorityDirection = word.direction;
                    });
                }

                this.cellInputs.set(`${x},${y}`, input);
                wordCells.push({ x, y });
            }

            // Сохраняем информацию о слове
            this.words.set(word.id, {
                word: word.word,
                cells: wordCells,
                direction: word.direction
            });
        });

        // Добавляем обработчики событий
        this.setupEventListeners();
    }

    getCellAt(x, y) {
        const cells = document.querySelectorAll('.cell');
        return cells[y * this.crossword.dimensions.width + x];
    }

    setupEventListeners() {
        this.cellInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
                this.checkWords();
                
                // Переход к следующей ячейке
                if (e.target.value) {
                    const nextInput = this.findNextInput(input);
                    if (nextInput) nextInput.focus();
                }
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value) {
                    const prevInput = this.findPrevInput(input);
                    if (prevInput) {
                        prevInput.focus();
                        prevInput.value = '';
                    }
                }
                else if (input.value.length === 1 && e.key.length === 1) {
                    input.value = e.key.toUpperCase();
                    this.checkWords();
                    setTimeout(() => {
                        const nextInput = this.findNextInput(input);
                        if (nextInput) nextInput.focus();
                    }, 50);
                }
            });
        });
    }

    findNextInput(currentInput) {
        const x = parseInt(currentInput.dataset.x);
        const y = parseInt(currentInput.dataset.y);
        
        const rightKey = `${x + 1},${y}`;
        const downKey = `${x},${y + 1}`;
        
        if (this.priorityDirection === 'vertical') {
            const downInput = this.cellInputs.get(downKey);
            if (downInput) return downInput;
            this.priorityDirection = null;
            return this.cellInputs.get(rightKey);
        } else if (this.priorityDirection === 'horizontal') {
            const rightInput = this.cellInputs.get(rightKey);
            if (rightInput) return rightInput;
            this.priorityDirection = null;
            return this.cellInputs.get(downKey);
        }

        return this.cellInputs.get(rightKey) || this.cellInputs.get(downKey);
    }

    
    findPrevInput(currentInput) {
        const x = parseInt(currentInput.dataset.x);
        const y = parseInt(currentInput.dataset.y);
        
        const leftKey = `${x - 1},${y}`;
        const upKey = `${x},${y - 1}`;
        
        // Аналогично для движения назад
        if (this.priorityDirection === 'vertical') {
            const upInput = this.cellInputs.get(upKey);
            if (upInput) return upInput;
            this.priorityDirection = null;
            return this.cellInputs.get(leftKey);
        } else if (this.priorityDirection === 'horizontal') {
            const leftInput = this.cellInputs.get(leftKey);
            if (leftInput) return leftInput;
            this.priorityDirection = null;
            return this.cellInputs.get(upKey);
        }

        return this.cellInputs.get(leftKey) || this.cellInputs.get(upKey);
    }

    checkWords() {
        let correctCount = 0;
        this.words.forEach((wordInfo, wordId) => {
            const currentWord = wordInfo.cells.map(cell => {
                const input = this.cellInputs.get(`${cell.x},${cell.y}`);
                return input.value;
            }).join('');

            const isCorrect = currentWord === wordInfo.word;
            
            if (isCorrect) {
                if (wordId !== 'dbf9ecab-692c-400d-b6b9-b1a095558c04') {
                    let time = 0;
                    wordInfo.cells.forEach(cell => {
                        setTimeout(() => {
                            const cellElement = this.getCellAt(cell.x, cell.y);
                            cellElement.classList.add('correct');
                        }, time);
                        time += 100;
                    });
                }
                correctCount++;
            }
        });
        // если все слова правильные, показываем что юзер победил
        if (correctCount === this.words.size && this.hasWon === false) {
            this.hasWon = true;
            this.words.get('dbf9ecab-692c-400d-b6b9-b1a095558c04').cells.forEach(cell => {
                const cellElement = this.getCellAt(cell.x, cell.y);
                cellElement.classList.add('main');
                cellElement.id = 'main';
            })

            setTimeout(() => {
                let allCells = document.querySelectorAll('.cell');
                let x = 0;
                let y = 0;
                allCells.forEach(cell => {
                    if (cell.id !== 'main') {
                        cell.classList.add('invisible');
                    }
                    const grid = document.getElementById('crosswordGrid');
                    grid.style.width = `${this.crossword.dimensions.width * 60}px`;
                    grid.style.height = `${this.crossword.dimensions.height * 60}px`;
                    // изменяем размер всех ячейек на 60 пикселей и сдвигаем
                    cell.style.width = `${60}px`;
                    cell.style.height = `${60}px`;
                    cell.style.left = `${x * 60}px`;
                    cell.style.top = `${y * 60}px`;
                    x++;
                    if (x === this.crossword.dimensions.width) {
                        y++;
                        x = 0;
                    }

                    const input = cell.querySelector('input');
                    if (input) input.readOnly = true;
                });
            }, 1500)

            setTimeout(() => {
                let keyboard = document.getElementById('keyboard');
                keyboard.style.color = 'red';
                keyboard.style.fontSize = '110px';
            }, 9000);

            setTimeout(() => {
                let keyboard = document.getElementById('keyboard');
                keyboard.style.color = 'black';
                keyboard.style.fontSize = '80px';
            }, 10000);

            setTimeout(() => {
                let keyboard = document.getElementById('keyboard');
                keyboard.style.color = 'red';
                keyboard.style.fontSize = '110px';
            }, 11000);
        }
    }

    setupHints() {
        const horizontalHints = document.querySelector('#horizontalHints ul');
        const verticalHints = document.querySelector('#verticalHints ul');

        this.crossword.words.forEach((word, index) => {
            const hint = word.hint || 'No hint';
            if (hint !== 'No hint') {
                const li = document.createElement('li');
                li.textContent = `${index}. ${hint}`;

                if (word.direction === 'horizontal') {
                    horizontalHints.appendChild(li);
                } else {
                    verticalHints.appendChild(li);
                }
            }
        });
    }
}

// Создаем экземпляр решателя кроссворда
const solver = new CrosswordSolver();