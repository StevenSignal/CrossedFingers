//import { CrosswordAPI } from './crosswordAPI.js';

class CrosswordConstructor {
    constructor() {
        this.crossword = null;
        this.init();
    }

    init() {
        this.createNewCrossword();
        this.setupEventListeners();
    }

    createNewCrossword() {
        const name = document.getElementById('crosswordName').value || 'New Crossword';
        this.crossword = CrosswordAPI.createCrossword(name);
        this.updateDisplay();
    }

    setupEventListeners() {
        document.getElementById('addWord').addEventListener('click', () => this.addWord());
        document.getElementById('saveCrossword').addEventListener('click', () => this.saveCrossword());
        document.getElementById('crosswordName').addEventListener('change', (e) => {
            this.crossword.name = e.target.value;
        });
    }

    toggleIntersectionSelect() {
        const select = document.getElementById('intersectWord');
        const useIntersection = document.getElementById('useIntersection');
        select.disabled = !useIntersection.checked;
    }

    findPossiblePositions(word, specificWordId = null) {
        if (this.crossword.words.length === 0) {
            // Для первого слова размещаем в центре
            const x = 8;
            const y = 8;
            return [{ x, y, direction: 'horizontal' }];
        }

        const positions = [];
        const wordUpperCase = word.toUpperCase();

        const wordsToCheck = specificWordId 
            ? this.crossword.words.filter(w => w.id === specificWordId)
            : this.crossword.words;

        // Проверяем каждое существующее слово на возможные пересечения
        for (const existingWord of wordsToCheck) {
            const existingWordUpperCase = existingWord.word.toUpperCase();

            // Ищем общие буквы
            for (let i = 0; i < existingWordUpperCase.length; i++) {
                for (let j = 0; j < wordUpperCase.length; j++) {
                    if (existingWordUpperCase[i] === wordUpperCase[j]) {
                        // Пробуем разместить новое слово вертикально
                        if (existingWord.direction === 'horizontal') {
                            const x = existingWord.x + i;
                            const y = existingWord.y - j;
                            
                            try {
                                CrosswordAPI.addWord(
                                    structuredClone(this.crossword),
                                    word,
                                    '',
                                    x,
                                    y,
                                    'vertical'
                                );
                                positions.push({
                                    x,
                                    y,
                                    direction: 'vertical',
                                    intersectsWith: {
                                        word: existingWord.word,
                                        at: `${existingWordUpperCase[i]} (position ${i + 1})`
                                    }
                                });
                            } catch (e) {
                                // Позиция не подходит, пропускаем
                            }
                        }
                        
                        // Пробуем разместить новое слово горизонтально
                        if (existingWord.direction === 'vertical') {
                            const x = existingWord.x - j;
                            const y = existingWord.y + i;
                            
                            try {
                                CrosswordAPI.addWord(
                                    structuredClone(this.crossword),
                                    word,
                                    '',
                                    x,
                                    y,
                                    'horizontal'
                                );
                                positions.push({
                                    x,
                                    y,
                                    direction: 'horizontal',
                                    intersectsWith: {
                                        word: existingWord.word,
                                        at: `${existingWordUpperCase[i]} (position ${i + 1})`
                                    }
                                });
                            } catch (e) {
                                // Позиция не подходит, пропускаем
                            }
                        }
                    }
                }
            }
        }

        return positions;
    }

    addWord() {
        const word = document.getElementById('wordInput').value.toUpperCase();
        const hint = document.getElementById('hintInput').value;
        const useIntersection = document.getElementById('useIntersection').checked;
        const selectedWordId = document.getElementById('intersectWord').value;

        if (!word) {
            alert('Please enter a word');
            return;
        }

        const positions = this.findPossiblePositions(
            word,
            useIntersection ? selectedWordId : null
        );

        if (positions.length === 0) {
            alert('Cannot find a valid position for this word');
            return;
        }

        // Если найдено несколько возможных позиций, показываем диалог выбора
        let selectedPosition;
        if (positions.length === 1) {
            selectedPosition = positions[0];
        } else {
            const positionDescriptions = positions.map((pos, index) => 
                `${index + 1}) ${pos.direction}, intersecting with ${pos.intersectsWith.word} at ${pos.intersectsWith.at}`
            );
            
            const selectedIndex = prompt(
                `Choose position (1-${positions.length}):\n${positionDescriptions.join('\n')}`
            );

            if (!selectedIndex || selectedIndex < 1 || selectedIndex > positions.length) {
                alert('Invalid position selected');
                return;
            }

            selectedPosition = positions[selectedIndex - 1];
        }

        try {
            CrosswordAPI.addWord(
                this.crossword,
                word,
                hint,
                selectedPosition.x,
                selectedPosition.y,
                selectedPosition.direction
            );
            this.updateDisplay();
            this.clearInputs();
        } catch (error) {
            alert(error.message);
        }
    }

    clearInputs() {
        document.getElementById('wordInput').value = '';
        document.getElementById('hintInput').value = '';
    }

    updateDisplay() {
        this.updateWordsList();
        this.updateGrid();
    }

    updateWordsList() {
        const wordsList = document.getElementById('wordsList');
        const intersectSelect = document.getElementById('intersectWord');
        
        // Обновляем список слов
        wordsList.innerHTML = '';
        
        // Сохраняем текущее выбранное значение
        const selectedValue = intersectSelect.value;
        
        // Очищаем и обновляем select
        intersectSelect.innerHTML = '<option value="">Select word...</option>';

        this.crossword.words.forEach((word, index) => {
            // Добавляем слово в список
            const li = document.createElement('li');
            li.innerHTML = `
                ${word.word} (${word.direction}, ${word.x},${word.y})
                <button id = "removeWord-${index}">✕</button>
            `;

            // Добавляем обработчик для кнопки удаления
            li.querySelector(`#removeWord-${index}`).addEventListener('click', () => {
                constructor.removeWord(word.id);
            })
            wordsList.appendChild(li);

            // Добавляем слово в select
            const option = document.createElement('option');
            option.value = word.id;
            option.textContent = `${word.word} (${word.direction})`;
            intersectSelect.appendChild(option);
        });

        // Восстанавливаем выбранное значение, если оно все еще существует
        if (selectedValue && [...intersectSelect.options].some(opt => opt.value === selectedValue)) {
            intersectSelect.value = selectedValue;
        }
    }

    updateGrid() {
        const grid = document.getElementById('crosswordGrid');
        grid.innerHTML = '';
        grid.style.width = `${this.crossword.dimensions.width * 30}px`;
        grid.style.height = `${this.crossword.dimensions.height * 30}px`;

        // Создаем карту занятых ячеек
        const cellMap = new Map();
        
        this.crossword.words.forEach((word, wordIndex) => {
            for (let i = 0; i < word.word.length; i++) {
                const x = word.direction === 'horizontal' ? word.x + i : word.x;
                const y = word.direction === 'vertical' ? word.y + i : word.y;
                
                const cell = document.createElement('div');
                cell.className = 'cell filled';
                cell.style.left = `${x * 30}px`;
                cell.style.top = `${y * 30}px`;
                cell.textContent = word.word[i];

                // Добавляем номер слова только к первой букве
                if (i === 0) {
                    const number = document.createElement('span');
                    number.className = 'word-number';
                    number.textContent = wordIndex + 1;
                    cell.appendChild(number);
                }

                grid.appendChild(cell);
                cellMap.set(`${x},${y}`, true);
            }
        });
    }

    removeWord(wordId) {
        try {
            CrosswordAPI.removeWord(this.crossword, wordId);
            this.updateDisplay();
        } catch (error) {
            alert(error.message);
        }
    }

    saveCrossword() {
        CrosswordAPI.saveCrossword(this.crossword);
    }
}

document.getElementById("useIntersection").addEventListener("change", function() {
    constructor.toggleIntersectionSelect();
});

// Создаем глобальный экземпляр конструктора
window.constructor = new CrosswordConstructor();