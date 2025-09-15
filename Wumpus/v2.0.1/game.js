// game.js
const boardSizeInput = document.getElementById('boardSize');
const startGameBtn = document.getElementById('startGame');
const gameInfoDiv = document.querySelector('.game-info');
const resetGameBtn = document.getElementById('resetGame');
const modeToggleBtn = document.getElementById('modeToggle');
const exitGameBtn = document.getElementById('exitGame');
const gameBoardDiv = document.getElementById('gameBoard');
const agentControlsDiv = document.querySelector('.agent-controls');
const autoAgentControlsDiv = document.querySelector('.auto-agent-controls');
const agentV1Btn = document.getElementById('agentV1');
const gameMessage = document.getElementById('gameMessage');

gameMessage.style.color = "black";

let wumpusWorld;
let gameMode = 'manual';
let hasGold = false;
let autoPlayInterval;

// Evento para iniciar o jogo
startGameBtn.addEventListener('click', () => {
    const size = parseInt(boardSizeInput.value);
    if (size >= 4 && size <= 20) {
        wumpusWorld = new WumpusWorld(size);
        wumpusWorld.board[0][0].isVisited = true;
        renderBoard();
        
        // Esconde o menu inicial e mostra os controles do jogo
        startGameBtn.style.display = 'none';
        boardSizeInput.disabled = true;
        gameInfoDiv.style.display = 'flex';
        
        gameMessage.textContent = 'Jogo iniciado. Mova o agente.';
        updateUIForMode();
    } else {
        alert('O tamanho do tabuleiro deve ser entre 4 e 20.');
    }
});

// Evento para resetar o jogo
resetGameBtn.addEventListener('click', () => {
    stopAutoPlay();
    wumpusWorld.reset();
    wumpusWorld.board[0][0].isVisited = true;
    renderBoard();
    gameMessage.textContent = 'Um novo tabuleiro foi criado.';
    gameMessage.style.color = "black";
    hasGold = false;
    updateUIForMode();
});

// Evento para alternar o modo
modeToggleBtn.addEventListener('click', () => {
    gameMode = gameMode === 'automático' ? 'manual' : 'automático';
    modeToggleBtn.textContent = `Modo Atual: ${gameMode.charAt(0).toUpperCase() + gameMode.slice(1)}`;
    gameMessage.textContent = `Modo alterado para ${gameMode}.`;
    updateUIForMode();
});

// Evento para sair do jogo
exitGameBtn.addEventListener('click', () => {
    stopAutoPlay();
    window.location.reload();
});

// Lógica para controle do agente via teclado
document.addEventListener('keydown', (event) => {
    if (gameMode === 'manual' && wumpusWorld) {
        switch (event.key) {
            case 'ArrowUp':
                moveAgent('north');
                break;
            case 'ArrowDown':
                moveAgent('south');
                break;
            case 'ArrowLeft':
                moveAgent('west');
                break;
            case 'ArrowRight':
                moveAgent('east');
                break;
        }
    }
});

// Função para renderizar o tabuleiro (código inalterado)
function renderBoard() {
    gameBoardDiv.innerHTML = '';
    gameBoardDiv.style.gridTemplateColumns = `repeat(${wumpusWorld.size}, 1fr)`;
    gameBoardDiv.style.gridTemplateRows = `repeat(${wumpusWorld.size}, 1fr)`;

    for (let y = 0; y < wumpusWorld.size; y++) {
        for (let x = 0; x < wumpusWorld.size; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');

            const currentCell = wumpusWorld.board[y][x];
            if (currentCell.isVisited) {
                currentCell.perceptions.forEach(p => {
                    const perceptionDiv = document.createElement('div');
                    perceptionDiv.classList.add('perception', p);
                    perceptionDiv.textContent = p.charAt(0).toUpperCase();
                    cell.appendChild(perceptionDiv);
                });

                if (currentCell.objects.includes('wumpus')) {
                    cell.textContent = '👹';
                }
                if (currentCell.objects.includes('pit')) {
                    cell.textContent = '🕳️';
                }
                if (currentCell.objects.includes('gold')) {
                    cell.textContent = '💰';
                }
            }
            
            if (wumpusWorld.agent.x === x && wumpusWorld.agent.y === y) {
                const agentDiv = document.createElement('div');
                agentDiv.classList.add('agent');
                cell.appendChild(agentDiv);
            }

            gameBoardDiv.appendChild(cell);
        }
    }
}

// Lógica de movimento
function moveAgent(direction) {
    const { x, y } = wumpusWorld.agent;
    let newX = x;
    let newY = y;

    switch (direction) {
        case 'north': newY--; break;
        case 'south': newY++; break;
        case 'west': newX--; break;
        case 'east': newX++; break;
    }

    if (newX >= 0 && newX < wumpusWorld.size && newY >= 0 && newY < wumpusWorld.size) {
        wumpusWorld.agent.x = newX;
        wumpusWorld.agent.y = newY;
        wumpusWorld.board[newY][newX].isVisited = true;
        checkGameState();
    } else {
        gameMessage.textContent = 'Movimento inválido: fora do tabuleiro.';
        gameMessage.style.color = "red";
    }
    renderBoard();
}

// Checar o estado do jogo (vitória, derrota)
function checkGameState() {
    const { x, y } = wumpusWorld.agent;
    const cellContent = wumpusWorld.board[y][x];

    if (cellContent.objects.includes('pit') || cellContent.objects.includes('wumpus')) {
        gameMessage.textContent = 'YOU LOSE!!!';
        gameMessage.style.color = "red";
        revealBoard();
        stopAutoPlay();
        return;
    }

    if (cellContent.objects.includes('gold')) {
        gameMessage.textContent = 'Você encontrou o Ouro! Encontre a saída!';
        gameMessage.style.color = "darkorange";
        hasGold = true;
    }

    if (hasGold && x === 0 && y === 0) {
        gameMessage.textContent = 'YOU WIN!!!!';
        gameMessage.style.color = "green";
        revealBoard();
        stopAutoPlay();
    }
}

// Função para revelar todo o tabuleiro (código inalterado)
function revealBoard() {
    for (let y = 0; y < wumpusWorld.size; y++) {
        for (let x = 0; x < wumpusWorld.size; x++) {
            wumpusWorld.board[y][x].isVisited = true;
        }
    }
    renderBoard();
}

// Função para ocultar o tabuleiro
function hideBoard() {
    for (let y = 0; y < wumpusWorld.size; y++) {
        for (let x = 0; x < wumpusWorld.size; x++) {
            wumpusWorld.board[y][x].isVisited = false;
        }
    }
    wumpusWorld.board[0][0].isVisited = true;
    renderBoard();
}

// --- Lógica para o Agente V1 (Autônomo e Aleatório) ---

// Função para resetar a posição do agente e ocultar o tabuleiro
function resetAgentPosition() {
    wumpusWorld.agent.x = 0;
    wumpusWorld.agent.y = 0;
    hasGold = false;
    hideBoard();
}

function agentV1Logic() {
    const possibleMoves = ['north', 'south', 'west', 'east'];
    const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    moveAgent(randomMove);
}

function startAutoPlay() {
    // Para garantir que o jogo não comece a se mover sozinho
    // se o usuário clicar várias vezes
    stopAutoPlay(); 
    gameMessage.textContent = 'Agente v1 iniciado...';
    // Move o agente a cada 1000ms (ajustável)
    autoPlayInterval = setInterval(agentV1Logic, 1000); 
}

function stopAutoPlay() {
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
    }
}

// Evento para o botão do Agente V1
agentV1Btn.addEventListener('click', () => {
    // Para garantir que cada clique inicie uma nova tentativa
    resetAgentPosition(); 
    renderBoard();
    startAutoPlay();
});

// Controles para o modo manual
document.getElementById('moveNorth').addEventListener('click', () => {
    stopAutoPlay();
    moveAgent('north');
});
document.getElementById('moveSouth').addEventListener('click', () => {
    stopAutoPlay();
    moveAgent('south');
});
document.getElementById('moveWest').addEventListener('click', () => {
    stopAutoPlay();
    moveAgent('west');
});
document.getElementById('moveEast').addEventListener('click', () => {
    stopAutoPlay();
    moveAgent('east');
});

// Atualiza a interface de acordo com o modo
function updateUIForMode() {
    if (gameMode === 'manual') {
        agentControlsDiv.style.display = 'flex';
        autoAgentControlsDiv.style.display = 'none';
        stopAutoPlay();
    } else {
        agentControlsDiv.style.display = 'none';
        autoAgentControlsDiv.style.display = 'flex';
    }
}