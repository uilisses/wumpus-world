// wumpus_world.js
class WumpusWorld {
    constructor(size) {
        this.size = size;
        this.board = [];
        this.agent = { x: 0, y: 0 };
        this.wumpus = null;
        this.gold = null;
        this.pits = [];

        this.generateBoard();
        this.placeObjects();
    }

    generateBoard() {
        for (let y = 0; y < this.size; y++) {
            this.board[y] = [];
            for (let x = 0; x < this.size; x++) {
                this.board[y][x] = {
                    objects: [],
                    perceptions: [],
                    isVisited: false // Nova propriedade para controlar a visibilidade
                };
            }
        }
    }

    placeObjects() {
        // Regra 1: A casa (0,0) não pode ter objetos.
        const forbiddenCells = [{ x: 0, y: 0 }];
        const availableCells = [];
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                if (x !== 0 || y !== 0) {
                    availableCells.push({ x, y });
                }
            }
        }

        // Posicionar Wumpus
        const wumpusPosIndex = Math.floor(Math.random() * availableCells.length);
        this.wumpus = availableCells.splice(wumpusPosIndex, 1)[0];
        this.board[this.wumpus.y][this.wumpus.x].objects.push('wumpus');

        // Posicionar Ouro
        const goldPosIndex = Math.floor(Math.random() * availableCells.length);
        this.gold = availableCells.splice(goldPosIndex, 1)[0];
        this.board[this.gold.y][this.gold.x].objects.push('gold');

        // Posicionar Poços
        const minPits = Math.floor(this.size * this.size * 0.1);
        const maxPits = Math.floor(this.size * this.size * 0.25);
        const numPits = Math.floor(Math.random() * (maxPits - minPits + 1)) + minPits;

        for (let i = 0; i < numPits; i++) {
            if (availableCells.length === 0) break;
            const pitPosIndex = Math.floor(Math.random() * availableCells.length);
            const pitPos = availableCells.splice(pitPosIndex, 1)[0];
            this.pits.push(pitPos);
            this.board[pitPos.y][pitPos.x].objects.push('pit');
        }

        // Gerar percepções
        this.generatePerceptions();
    }

    generatePerceptions() {
        // Limpar percepções antigas
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                this.board[y][x].perceptions = [];
            }
        }

        const addPerception = (x, y, perception) => {
            if (x >= 0 && x < this.size && y >= 0 && y < this.size) {
                if (!this.board[y][x].perceptions.includes(perception)) {
                    this.board[y][x].perceptions.push(perception);
                }
            }
        };

        const adjacentCells = (x, y) => [
            { x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 }
        ];

        // Fedor (Wumpus)
        adjacentCells(this.wumpus.x, this.wumpus.y).forEach(cell => {
            addPerception(cell.x, cell.y, 'stench');
        });

        // Brisa (Poços)
        this.pits.forEach(pit => {
            adjacentCells(pit.x, pit.y).forEach(cell => {
                addPerception(cell.x, cell.y, 'breeze');
            });
        });

        // Brilho (Ouro)
        adjacentCells(this.gold.x, this.gold.y).forEach(cell => {
            addPerception(cell.x, cell.y, 'glow');
        });
    }

    reset() {
        this.board = [];
        this.agent = { x: 0, y: 0 };
        this.wumpus = null;
        this.gold = null;
        this.pits = [];
        this.generateBoard();
        this.placeObjects();
    }
}