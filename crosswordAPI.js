class CrosswordAPI {
    static createCrossword(name) {
        return {
            id: crypto.randomUUID(),
            name,
            words: [],
            dimensions: { width: 0, height: 0 }
        };
    }

    static addWord(crossword, word, hint, x, y, direction) {
        // Проверяем базовые условия
        if (!word || word.length < 2) {
            throw new Error('Word must be at least 2 characters long');
        }
        if (x < 0 || y < 0) {
            throw new Error('Coordinates cannot be negative');
        }
        if (!['horizontal', 'vertical'].includes(direction)) {
            throw new Error('Direction must be horizontal or vertical');
        }

        // Проверяем, не выходит ли слово за пределы сетки
        const endX = direction === 'horizontal' ? x + word.length - 1 : x;
        const endY = direction === 'vertical' ? y + word.length - 1 : y;
        
        // Проверяем наложения с другими словами
        const intersections = this.findIntersections(crossword, word, x, y, direction);
        
        // Проверяем конфликты (кроме пересечений)
        for (let i = 0; i < word.length; i++) {
            const currentX = direction === 'horizontal' ? x + i : x;
            const currentY = direction === 'vertical' ? y + i : y;

            for (const existingWord of crossword.words) {
                const isOverlap = this.checkOverlap(
                    existingWord,
                    { word, x: currentX, y: currentY },
                    intersections
                );
                if (isOverlap) {
                    throw new Error('Word overlaps with existing word');
                }
            }
        }

        // Проверяем наличие хотя бы одного пересечения (кроме первого слова)
        if (crossword.words.length > 0 && intersections.length === 0) {
            throw new Error('Word must have at least one intersection with existing words');
        }

        const newWord = {
            id: crypto.randomUUID(),
            word,
            hint: hint || '',
            x,
            y,
            direction,
            intersections
        };

        // Обновляем размеры кроссворда
        crossword.dimensions.width = Math.max(crossword.dimensions.width, endX + 1);
        crossword.dimensions.height = Math.max(crossword.dimensions.height, endY + 1);

        // Добавляем слово в кроссворд
        crossword.words.push(newWord);

        // Обновляем пересечения в существующих словах
        for (const intersection of intersections) {
            const crossingWord = crossword.words.find(w => w.id === intersection.wordId);
            if (crossingWord) {
                crossingWord.intersections.push({
                    wordId: newWord.id,
                    position: intersection.crossPosition,
                    crossPosition: intersection.position
                });
            }
        }

        return newWord;
    }

    static findIntersections(crossword, word, x, y, direction) {
        const intersections = [];

        for (let i = 0; i < word.length; i++) {
            const currentX = direction === 'horizontal' ? x + i : x;
            const currentY = direction === 'vertical' ? y + i : y;
            const currentLetter = word[i];

            for (const existingWord of crossword.words) {
                const wordLength = existingWord.word.length;
                
                for (let j = 0; j < wordLength; j++) {
                    const existingX = existingWord.direction === 'horizontal' ? existingWord.x + j : existingWord.x;
                    const existingY = existingWord.direction === 'vertical' ? existingWord.y + j : existingWord.y;
                    
                    if (currentX === existingX && currentY === existingY) {
                        if (currentLetter === existingWord.word[j] && 
                            existingWord.direction !== direction) {
                            intersections.push({
                                wordId: existingWord.id,
                                position: i,
                                crossPosition: j
                            });
                        }
                    }
                }
            }
        }

        return intersections;
    }

    static checkOverlap(existingWord, newWordPos, validIntersections) {
        // Проверяем, не является ли эта позиция валидным пересечением
        const isValidIntersection = validIntersections.some(intersection => 
            intersection.wordId === existingWord.id
        );

        if (isValidIntersection) {
            return false;
        }

        // Проверяем наложение слов
        if (existingWord.direction === 'horizontal') {
            for (let i = 0; i < existingWord.word.length; i++) {
                if (existingWord.x + i === newWordPos.x && 
                    existingWord.y === newWordPos.y) {
                    return true;
                }
            }
        } else {
            for (let i = 0; i < existingWord.word.length; i++) {
                if (existingWord.x === newWordPos.x && 
                    existingWord.y + i === newWordPos.y) {
                    return true;
                }
            }
        }

        return false;
    }

    static removeWord(crossword, wordId) {
        const wordIndex = crossword.words.findIndex(w => w.id === wordId);
        if (wordIndex === -1) {
            throw new Error('Word not found');
        }

        // Проверяем, не нарушит ли удаление связность кроссворда
        if (crossword.words.length > 1) {
            const remainingWords = [...crossword.words];
            remainingWords.splice(wordIndex, 1);
            
            if (!this.isCrosswordConnected(remainingWords)) {
                throw new Error('Removing this word will break crossword connectivity');
            }
        }

        // Удаляем пересечения в других словах
        const removedWord = crossword.words[wordIndex];
        for (const intersection of removedWord.intersections) {
            const crossingWord = crossword.words.find(w => w.id === intersection.wordId);
            if (crossingWord) {
                crossingWord.intersections = crossingWord.intersections.filter(
                    i => i.wordId !== wordId
                );
            }
        }

        // Удаляем слово
        crossword.words.splice(wordIndex, 1);

        // Пересчитываем размеры кроссворда
        this.recalculateDimensions(crossword);

        return true;
    }

    static isCrosswordConnected(words) {
        if (words.length <= 1) return true;

        // Создаём граф пересечений
        const graph = {};
        words.forEach(word => {
            graph[word.id] = word.intersections.map(i => i.wordId);
        });

        // Выполняем поиск в глубину
        const visited = new Set();
        const dfs = (wordId) => {
            visited.add(wordId);
            for (const neighborId of graph[wordId]) {
                if (!visited.has(neighborId)) {
                    dfs(neighborId);
                }
            }
        };

        // Начинаем с первого слова
        dfs(words[0].id);

        // Проверяем, что все слова были посещены
        return visited.size === words.length;
    }

    static recalculateDimensions(crossword) {
        let maxX = 0;
        let maxY = 0;

        for (const word of crossword.words) {
            const endX = word.direction === 'horizontal' ? 
                word.x + word.word.length - 1 : word.x;
            const endY = word.direction === 'vertical' ? 
                word.y + word.word.length - 1 : word.y;
            
            maxX = Math.max(maxX, endX + 1);
            maxY = Math.max(maxY, endY + 1);
        }

        crossword.dimensions = {
            width: maxX,
            height: maxY
        };
    }

    static saveCrossword(crossword) {
        const data = JSON.stringify(crossword, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${crossword.name}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    static async loadCrossword(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const crossword = JSON.parse(e.target.result);
                    if (this.validateCrossword(crossword)) {
                        resolve(crossword);
                    } else {
                        reject(new Error('Invalid crossword format'));
                    }
                } catch (err) {
                    reject(new Error('Invalid JSON format'));
                }
            };

            reader.onerror = () => reject(new Error('File reading error'));
            reader.readAsText(file);
        });
    }

    static validateCrossword(crossword) {
        // Проверяем наличие всех необходимых полей
        if (!crossword.id || !crossword.name || !Array.isArray(crossword.words) || 
            !crossword.dimensions || 
            typeof crossword.dimensions.width !== 'number' || 
            typeof crossword.dimensions.height !== 'number') {
            return false;
        }

        // Проверяем каждое слово
        for (const word of crossword.words) {
            if (!word.id || !word.word || typeof word.x !== 'number' || 
                typeof word.y !== 'number' || 
                !['horizontal', 'vertical'].includes(word.direction) || 
                !Array.isArray(word.intersections)) {
                return false;
            }
        }

        // Проверяем связность кроссворда
        if (crossword.words.length > 0 && !this.isCrosswordConnected(crossword.words)) {
            return false;
        }

        return true;
    }
}