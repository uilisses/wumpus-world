// game.js
const boardSizeInput = document.getElementById('boardSize');
const startGameBtn = document.getElementById('startGame');
const gameInfoDiv = document.querySelector('.game-info');
const resetGameBtn = document.getElementById('resetGame');
const resetBoardBtn = document.getElementById('resetBoard');
const modeToggleBtn = document.getElementById('modeToggle');
const exitGameBtn = document.getElementById('exitGame');
const gameBoardDiv = document.getElementById('gameBoard');
const agentControlsDiv = document.querySelector('.agent-controls');
const autoAgentControlsDiv = document.querySelector('.auto-agent-controls');
const agentV1Btn = document.getElementById('agentV1');
const agentV2Btn = document.getElementById('agentV2');
const gameMessage = document.getElementById('gameMessage');
const scoreDisplay = document.getElementById('scoreDisplay');
const movesDisplay = document.getElementById('movesDisplay');

let wumpusWorld;
let gameMode = 'manual';
let hasGold = false;
let autoPlayInterval;
let score = 0;
let moves = 0;
let rounds = 0;
let finalStatus = '';
let relatorio = new Map();
let velocity = 20;
let agent = '';
let limitRounds = 10;
let agentMemory = [];

// Evento para iniciar o jogo
startGameBtn.addEventListener('click', () => {
    const size = parseInt(boardSizeInput.value);
    if (size >= 4 && size <= 20) {
        wumpusWorld = new WumpusWorld(size);
        wumpusWorld.board[0][0].isVisited = true;
        
        //Limpa a memória do Agente V2
        agentMemory = initializeAgentMemory(wumpusWorld.size);
        updateAgentMemory(0, 0);

        // Resetar placar ao iniciar um novo jogo
        score = 0;
        moves = 0;
        updateGameStats();

        renderBoard();
        
        startGameBtn.style.display = 'none';
        boardSizeInput.disabled = true;
        gameInfoDiv.style.display = 'flex';
        
        gameMessage.textContent = 'Jogo iniciado. Mova o agente.';
        updateUIForMode();
    } else {
        alert('O tamanho do tabuleiro deve ser entre 4 e 20.');
    }
});

function resetScores() {
    score = 0;
    moves = 0;
    updateGameStats();
}

// Evento para resetar o jogo
resetGameBtn.addEventListener('click', () => {
    //Limpa a memória do Agente V2
    agentMemory = initializeAgentMemory(wumpusWorld.size);
    updateAgentMemory(0, 0);
    
    stopAutoPlay();
    wumpusWorld.reset();
    wumpusWorld.board[0][0].isVisited = true;
    
    // Resetar placar ao resetar o jogo
    resetScores();
    
    renderBoard();
    gameMessage.textContent = 'Novo jogo criado. Mova o agente.';
    hasGold = false;
    updateUIForMode();
});

// Evento para resetar o Board
resetBoardBtn.addEventListener('click', () => {
    stopAutoPlay();
    resetAgentPosition();
    //Limpa a memória do Agente V2
    agentMemory = initializeAgentMemory(wumpusWorld.size);
    updateAgentMemory(0, 0);
    
    // Resetar placar ao resetar o jogo
    resetScores();
    
    renderBoard();
    gameMessage.textContent = 'Jogo reiniciado. Mova o agente.';
    hasGold = false;
    updateUIForMode();
});

// Evento para alternar o modo
modeToggleBtn.addEventListener('click', () => {
    stopAutoPlay();
    resetAgentPosition();
    
    //Limpa a memória do Agente V2
    agentMemory = initializeAgentMemory(wumpusWorld.size);
    updateAgentMemory(0, 0);

    renderBoard();
    resetScores();
    gameMode = gameMode === 'manual' ? 'agente' : 'manual';
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
    if (gameMode === 'manual' && wumpusWorld && !isGameOver()) {
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

// Função para renderizar o tabuleiro
function renderBoard() {
    gameBoardDiv.innerHTML = '';
    gameBoardDiv.style.gridTemplateColumns = `repeat(${wumpusWorld.size}, 1fr)`;
    gameBoardDiv.style.gridTemplateRows = `repeat(${wumpusWorld.size}, 1fr)`;

    for (let y = 0; y < wumpusWorld.size; y++) {
        for (let x = 0; x < wumpusWorld.size; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');

            const currentCell = wumpusWorld.board[y][x];

            // Adiciona a classe 'visited' se a célula foi visitada
            if (currentCell.isVisited) {
                cell.classList.add('visited');
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

// Lógica de movimento dos Agentes - NÃO PRECISA MEXER
function moveAgent(direction) {
    if (!wumpusWorld || isGameOver()) return;
    
    // Contabiliza movimentos fora do tabuleiro
/*  score -= 1;
    moves += 1;
    updateGameStats(); */

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
        score -= 1; //retirar se quiser contabilizar movimentos foras do tabuleiro
        moves += 1; //retirar se quiser contabilizar movimentos foras do tabuleiro
        updateAgentMemory(newX, newY);
        checkGameState();
    } else {
        score -= 0; //retirar se quiser contabilizar movimentos foras do tabuleiro
        moves += 0; //retirar se quiser contabilizar movimentos foras do tabuleiro
        /* gameMessage.textContent = 'Movimento inválido: fora do tabuleiro.'; */ //incluir se quiser contabilizar movimentos foras do tabuleiro
    }
    renderBoard();
}

// Checar o estado do jogo (vitória, derrota)
function checkGameState() {
    const { x, y } = wumpusWorld.agent;
    const cellContent = wumpusWorld.board[y][x];

    if (cellContent.objects.includes('pit')) {
        score -= 1000;
        gameMessage.textContent = 'Você caiu em um poço. Fim de jogo!';
        gameMessage.style.color = "red";
        finalStatus += 'Caiu no poço!';
        /* stopAutoPlay(); */ //Parar agente
        disableControls();
        updateGameStats();
        createRelatorio(rounds, score, moves, finalStatus);
        console.log('Round do Poço:' + rounds);
        if (gameMode === 'agente') {autoPlayOn();}
        return;
    }
    
    if (cellContent.objects.includes('wumpus')) {
        score -= 1000;
        gameMessage.textContent = 'Você foi devorado pelo Wumpus. Fim de jogo!';
        gameMessage.style.color = "red";
        finalStatus += 'Foi devorado pelo Wumpus!';
        /* stopAutoPlay(); */ //Parar agente
        disableControls();
        updateGameStats();
        createRelatorio(rounds, score, moves, finalStatus);
        console.log('Round do Wumpus:' + rounds);
        if (gameMode === 'agente') {autoPlayOn();}
        return;
    }

    if (cellContent.objects.includes('gold') && !hasGold) {
        score += 1000;
        gameMessage.textContent = 'Você encontrou o Ouro! Agora retorne para a casa inicial.';
        finalStatus = 'Encontrou o Ouro e ';
        /* wumpusWorld.board[y][x].objects[0] = '';  //Retira o ouro do tabuleiro
        console.log(y);
        console.log(x); */
        gameMessage.style.color = "blue";
        hasGold = true;
    }

    if (hasGold && x === 0 && y === 0) {
        score += 1000;
        gameMessage.textContent = 'Você encontrou o ouro e retornou para a casa inicial. YOU WIN!!';
        gameMessage.style.color = "green";
        finalStatus += 'VENCEU!';
        /* stopAutoPlay(); */ //Parar agente
        disableControls();
        createRelatorio(rounds, score, moves, finalStatus);
        if (gameMode === 'agente') {autoPlayOn();}
    }
    updateGameStats();
}

// Função para atualizar os displays de Pontos e Movimentos
function updateGameStats() {
    scoreDisplay.textContent = `${score}`;
    movesDisplay.textContent = `${moves}`;
}

// ... o restante do código (revealBoard, hideBoard, resetAgentPosition, etc.) permanece o mesmo.

// Função para revelar todo o tabuleiro
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
}

// Função para resetar a posição do agente
function resetAgentPosition() {
    wumpusWorld.agent.x = 0;
    wumpusWorld.agent.y = 0;
    hasGold = false;
    hideBoard();
}

// Lógica para o Agente V1 (Autônomo e Aleatório)
function agentV1Logic() {

    //PRIMEIRA VERSÃO DO Agente V1
    /* const possibleMoves = ['north', 'south', 'west', 'east'];
    const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    moveAgent(randomMove); */

    /* agent = 'V1'; */
    const rules = [
    {
        condition: (perceptions) => perceptions.length === 0,
        actions: ['north', 'south', 'east', 'west']
    },
    {
        condition: (perceptions) => perceptions.includes('breeze'),
        actions: ['north', 'south', 'east', 'west']
    },
    {
        condition: (perceptions) => perceptions.includes('stench'),
        actions: ['north', 'south', 'east', 'west']
    },
    {
        condition: (perceptions) => perceptions.includes('breeze') && perceptions.includes('stench'),
        actions: ['north', 'south', 'east', 'west']
    }
    ];

    const currentCell = wumpusWorld.board[wumpusWorld.agent.y][wumpusWorld.agent.x];
    const perceptions = currentCell.perceptions;

    let possibleActions = [];
    for (const rule of rules) {
        if (rule.condition(perceptions)) {
            possibleActions = possibleActions.concat(rule.actions);
        }
    }

    // Se nenhuma regra for aplicável, usar ações padrão
    if (possibleActions.length === 0) {
        possibleActions = ['north', 'south', 'east', 'west'];
    }

    // Escolher aleatoriamente uma ação from the possible actions
    const randomIndex = Math.floor(Math.random() * possibleActions.length);
    const action = possibleActions[randomIndex];
    moveAgent(action);
}


// AQUI INICIA o Agente V2 (Com Memória)
// Inicializa a memória do Agente V2
function initializeAgentMemory(size) {
  let memory = [];
  for (let y = 0; y < size; y++) {
    memory[y] = [];
    for (let x = 0; x < size; x++) {
      memory[y][x] = {
        visited: false,
        breeze: false,
        stench: false,
        safeFromPit: false,
        safeFromWumpus: false
      };
    }
  }
  return memory;
}

// Obtém células adjacentes para o Agente V2
function getAdjacentCells(x, y) {
  return [
    { x: x + 1, y: y },
    { x: x - 1, y: y },
    { x: x, y: y + 1 },
    { x: x, y: y - 1 }
  ];
}

// Atualiza a memória do Agente V2 com base nas percepções da célula (x, y)
function updateAgentMemory(x, y) {
  const cell = wumpusWorld.board[y][x];
  agentMemory[y][x].visited = true;
  agentMemory[y][x].breeze = cell.perceptions.includes('breeze');
  agentMemory[y][x].stench = cell.perceptions.includes('stench');

  // Se não há brisa, marca células adjacentes como seguras contra poços
  if (!agentMemory[y][x].breeze) {
    const adjCells = getAdjacentCells(x, y);
    adjCells.forEach(adj => {
      if (adj.x >= 0 && adj.x < wumpusWorld.size && adj.y >= 0 && adj.y < wumpusWorld.size) {
        agentMemory[adj.y][adj.x].safeFromPit = true;
      }
    });
  }

  // Se não há fedor, marca células adjacentes como seguras contra Wumpus
  if (!agentMemory[y][x].stench) {
    const adjCells = getAdjacentCells(x, y);
    adjCells.forEach(adj => {
      if (adj.x >= 0 && adj.x < wumpusWorld.size && adj.y >= 0 && adj.y < wumpusWorld.size) {
        agentMemory[adj.y][adj.x].safeFromWumpus = true;
      }
    });
  }
}

function agentV2Logic() {
    /* agent = 'V2'; */
    const currentX = wumpusWorld.agent.x;
    const currentY = wumpusWorld.agent.y;

    const adjacentCells = getAdjacentCells(currentX, currentY);
    const safeAdjacent = adjacentCells.filter(adj => {
        if (adj.x < 0 || adj.x >= wumpusWorld.size || adj.y < 0 || adj.y >= wumpusWorld.size) {
        return false;
        }
        const mem = agentMemory[adj.y][adj.x];
        return mem.safeFromPit && mem.safeFromWumpus;
    });

    const unvisitedSafe = safeAdjacent.filter(adj => !agentMemory[adj.y][adj.x].visited);
    let candidates = unvisitedSafe.length > 0 ? unvisitedSafe : safeAdjacent;

    if (candidates.length === 0) {
        candidates = adjacentCells.filter(adj => 
        adj.x >= 0 && adj.x < wumpusWorld.size && adj.y >= 0 && adj.y < wumpusWorld.size
        );
    }

    const target = candidates[Math.floor(Math.random() * candidates.length)];
    const dx = target.x - currentX;
    const dy = target.y - currentY;

    let direction;
    if (dx > 0) direction = 'east';
    else if (dx < 0) direction = 'west';
    else if (dy > 0) direction = 'south';
    else if (dy < 0) direction = 'north';

    moveAgent(direction);
}

//AQUI ENCERRA o Agente V2 (Com Memória)

function startAutoPlay() {
    stopAutoPlay();
    gameMessage.textContent = 'Agente ' + agent + ' iniciado...';
    if (agent === 'V1') {
    autoPlayInterval = setInterval(agentV1Logic, velocity); //velocidade do Agente 1
    }
    else {
    autoPlayInterval = setInterval(agentV2Logic, velocity); //velocidade do Agente 2
    }
}

function stopAutoPlay() {
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
    }
}

// Verifica se o jogo já terminou
function isGameOver() {
    const message = gameMessage.textContent;
    return message.includes('Fim de jogo!') || message.includes('Você VENCEU!');
}

// Função para habilitar ou desabilitar os controles de movimento
function disableControls() {
    agentControlsDiv.querySelectorAll('button').forEach(btn => {
        btn.disabled = true;
    });
    document.removeEventListener('keydown', handleManualMove);
}

function enableControls() {
    agentControlsDiv.querySelectorAll('button').forEach(btn => {
        btn.disabled = false;
    });
    document.addEventListener('keydown', handleManualMove);
}

// Função auxiliar para o event listener
function handleManualMove(event) {
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
}

// Evento para o botão do Agente V1
agentV1Btn.addEventListener('click', () => {
    agent = 'V1';
    rounds = 0;
    finalStatus = '';
    console.clear();
    autoPlayOn();
});

agentV2Btn.addEventListener('click', () => {
    agent = 'V2';
    rounds = 0;
    finalStatus = '';
    console.clear();
    autoPlayOn();
});

function autoPlayOn() {
    if (rounds < limitRounds) { //Quantidade de rounds do Agente
        rounds += 1;
        console.log('Round: ' + rounds + ' e Agente: ' + agent);
        finalStatus = '';
        resetScores();
        resetAgentPosition();
        //Limpa a memória do Agente V2
        agentMemory = initializeAgentMemory(wumpusWorld.size);
        updateAgentMemory(0, 0);
        //Limpa a memória do Agente V2
        renderBoard();
        startAutoPlay();
    } else {
        stopAutoPlay();
        showRelatorio();
    }
}

function createRelatorio(r, s, m, fs) {
    relatorio.set(r, { pontos: s, movimentos: m, status: fs });
}

function showRelatorio() {
    for (const [round, dados] of relatorio.entries()) {
        console.log(`Round ${round} - ` + `Pontos: ${dados.pontos} ` + `Movimentos: ${dados.movimentos} ` + `Conclusão: ${dados.status}`);
        /* console.log(`Pontos: ${dados.pontos}`);
        console.log(`Movimentos: ${dados.movimentos}`); */
    }
}

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
        enableControls();
    } else {
        agentControlsDiv.style.display = 'none';
        autoAgentControlsDiv.style.display = 'flex';
        disableControls(); // Garante que os controles manuais estejam desabilitados
    }
}