// game.js
const boardSizeInput = document.getElementById('boardSize');
const startGameBtn = document.getElementById('startGame');
const gameInfoDiv = document.querySelector('.game-info');
const resetGameBtn = document.getElementById('resetGame');
const resetBoardBtn = document.getElementById('resetBoard');
const revealBoardBtn = document.getElementById('revealBoard');
const modeToggleBtn = document.getElementById('modeToggle');
const exitGameBtn = document.getElementById('exitGame');
const gameBoardDiv = document.getElementById('gameBoard');
const agentControlsDiv = document.querySelector('.agent-controls');
const autoAgentControlsDiv = document.querySelector('.auto-agent-controls');
const agentV1Btn = document.getElementById('agentV1');
const agentV2Btn = document.getElementById('agentV2');
const agentV3Btn = document.getElementById('agentV3');
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
let velocity = 10;
let agent = '';
let limitRounds = 30;
let agentMemory = [];

// Parâmetros do Algoritmo Genético
const POPULATION_SIZE = 50;
const MAX_GENERATIONS = 100;
const CROSSOVER_RATE = 0.85;
const MUTATION_RATE = 0.05;
const CHROMOSOME_LENGTH = 50; // Tamanho da sequência de ações

// Variáveis para o Agente V3
let population = [];
let currentGeneration = 0;
let bestIndividual = null;
let executingSequence = false;
let actionIndex = 0;

let evolutionPhase = true;

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

// Evento para revelar o Board
revealBoardBtn.addEventListener('click', () => {
    revealBoard();
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

// Nova função para gerenciar o fim de uma rodada e o início da próxima
function endRound() {
    stopAutoPlay();
    createRelatorio(rounds, score, moves, finalStatus);
    console.log(`Rodada ${rounds} - Pontos: ${score}, Movimentos: ${moves}, Conclusão: ${finalStatus}`);
    
    // Inicia a próxima rodada se o limite não foi alcançado
    if (rounds < limitRounds) {
        setTimeout(autoPlayOn, 100); // Pequeno atraso para visualização e evitar loops
    } else {
        showRelatorio();
    }
}

// Checar o estado do jogo (vitória, derrota)
function checkGameState() {
    const { x, y } = wumpusWorld.agent;
    const cellContent = wumpusWorld.board[y][x];
    
    if (cellContent.objects.includes('pit')) {
        score -= 1000;
        gameMessage.textContent = 'Você caiu em um poço. Fim de jogo!';
        gameMessage.style.color = "red";
        finalStatus = 'Caiu no poço!';
        disableControls();
        updateGameStats();
        if (gameMode === 'agente') {
            endRound();
        }
        return;
    }
    
    if (cellContent.objects.includes('wumpus')) {
        score -= 1000;
        gameMessage.textContent = 'Você foi devorado pelo Wumpus. Fim de jogo!';
        gameMessage.style.color = "red";
        finalStatus = 'Foi devorado pelo Wumpus!';
        disableControls();
        updateGameStats();
        if (gameMode === 'agente') {
            endRound();
        }
        return;
    }

    if (cellContent.objects.includes('gold') && !hasGold) {
        score += 1000;
        gameMessage.textContent = 'Você encontrou o Ouro! Agora retorne para a casa inicial.';
        finalStatus = 'Encontrou o Ouro e ';
        gameMessage.style.color = "blue";
        hasGold = true;
        
        // Adicionar verificação imediata para Agente V3
        if (agent === 'V3' && x === 0 && y === 0) {
            score += 1000;
            gameMessage.textContent = 'Você encontrou o ouro e já está na base. Você VENCEU!';
            gameMessage.style.color = "green";
            finalStatus += 'VENCEU!';
            disableControls();
            endRound();
        }
    }

    if (hasGold && x === 0 && y === 0) {
        score += 1000;
        gameMessage.textContent = 'Você encontrou o ouro e retornou para a casa inicial. Você VENCEU!';
        gameMessage.style.color = "green";
        finalStatus += 'VENCEU!';
        disableControls();
        if (gameMode === 'agente') {
            endRound();
        }
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


//AQUI COMEÇA o Agente V3 (AG)
// Função para inicializar o algoritmo genético
function initializeGeneticAlgorithm() {
    // Ajustar comprimento do cromossomo baseado no tamanho do tabuleiro
    //CHROMOSOME_LENGTH = wumpusWorld.size * 15;
    
    population = [];
    currentGeneration = 0;
    
    // Criar população inicial
    for (let i = 0; i < POPULATION_SIZE; i++) {
        population.push(createIndividual());
    }
    
    // Avaliar população inicial
    evaluatePopulation();
}

// Função para criar um indivíduo (sequência de ações)
function createIndividual() {
    const actions = ['north', 'south', 'east', 'west'];
    const chromosome = [];
    
    for (let i = 0; i < CHROMOSOME_LENGTH; i++) {
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        chromosome.push(randomAction);
    }
    
    return {
        chromosome: chromosome,
        fitness: 0
    };
}

// Função para avaliar a população
function evaluatePopulation() {
    for (let individual of population) {
        individual.fitness = evaluateFitness(individual.chromosome);
    }
    
    // Ordenar população por fitness (maior primeiro)
    population.sort((a, b) => b.fitness - a.fitness);
    
    // Manter o melhor indivíduo
    bestIndividual = {...population[0]};
}

// Função para avaliar o fitness de um indivíduo
function evaluateFitness(chromosome) {
    const simulator = new WorldSimulator(wumpusWorld);
    let fitness = 0;
    let hasGold = false;
    let moves = 0;

    for (let action of chromosome) {
        moves++;
        const result = simulator.move(action);
        
        if (result === 'death') {
            fitness = -10000; // Penalidade alta por morte
            break;
        }
        
        if (result === 'gold') {
            hasGold = true;
            fitness += 1000; // Recompensa por pegar o ouro
        }
        
        if (hasGold && simulator.isAtStart()) {
            fitness += 1000; // Recompensa por retornar com o ouro
            break; // Para a simulação quando objetivo for alcançado
        }
        
        fitness -= 1; // Penalidade por movimento
    }
    
    // Bônus adicional por completar a missão rapidamente
    if (hasGold && simulator.isAtStart()) {
        fitness += (1000 - moves);
    }
    
    return fitness;
}

// Função para encontrar a posição do ouro
function findGoldPosition() {
    for (let y = 0; y < wumpusWorld.size; y++) {
        for (let x = 0; x < wumpusWorld.size; x++) {
            if (wumpusWorld.board[y][x].objects.includes('gold')) {
                return { x, y };
            }
        }
    }
    return { x: 0, y: 0 };
}

// Classe para simular o mundo (para avaliação de fitness)
class WorldSimulator {
    constructor(world) {
        this.size = world.size;
        this.agent = { x: world.agent.x, y: world.agent.y };
        this.hasGold = false;
        
        // Criar uma cópia do tabuleiro
        this.board = [];
        for (let y = 0; y < this.size; y++) {
            this.board[y] = [];
            for (let x = 0; x < this.size; x++) {
                this.board[y][x] = {
                    objects: [...world.board[y][x].objects],
                    perceptions: [...world.board[y][x].perceptions]
                };
            }
        }
    }
    
    move(direction) {
        const { x, y } = this.agent;
        let newX = x;
        let newY = y;
        
        switch (direction) {
            case 'north': newY--; break;
            case 'south': newY++; break;
            case 'west': newX--; break;
            case 'east': newX++; break;
        }
        
        // Verificar se o movimento é válido
        if (newX < 0 || newX >= this.size || newY < 0 || newY >= this.size) {
            return 'invalid';
        }
        
        // Atualizar posição do agente
        this.agent.x = newX;
        this.agent.y = newY;
        
        // Verificar se encontrou perigos
        const cell = this.board[newY][newX];
        if (cell.objects.includes('pit') || cell.objects.includes('wumpus')) {
            return 'death';
        }
        
        // Verificar se encontrou ouro
        if (cell.objects.includes('gold') && !this.hasGold) {
            this.hasGold = true;
            // Remover ouro do tabuleiro (simulação)
            cell.objects = cell.objects.filter(obj => obj !== 'gold');
            return 'gold';
        }
        
        return 'safe';
    }
    
    isAtStart() {
        return this.agent.x === 0 && this.agent.y === 0;
    }
}

// Função de seleção por torneio
function tournamentSelection(tournamentSize = 3) {
    let selected = [];
    
    for (let i = 0; i < 2; i++) {
        let tournament = [];
        for (let j = 0; j < tournamentSize; j++) {
            const randomIndex = Math.floor(Math.random() * population.length);
            tournament.push(population[randomIndex]);
        }
        
        // Encontrar o melhor no torneio
        tournament.sort((a, b) => b.fitness - a.fitness);
        selected.push(tournament[0]);
    }
    
    return selected;
}

// Função de crossover (um ponto)
function crossover(parent1, parent2) {
    if (Math.random() > CROSSOVER_RATE) {
        return [parent1, parent2];
    }
    
    const crossoverPoint = Math.floor(Math.random() * CHROMOSOME_LENGTH);
    
    const child1 = {
        chromosome: [
            ...parent1.chromosome.slice(0, crossoverPoint),
            ...parent2.chromosome.slice(crossoverPoint)
        ],
        fitness: 0
    };
    
    const child2 = {
        chromosome: [
            ...parent2.chromosome.slice(0, crossoverPoint),
            ...parent1.chromosome.slice(crossoverPoint)
        ],
        fitness: 0
    };
    
    return [child1, child2];
}

// Função de mutação
function mutate(individual) {
    const actions = ['north', 'south', 'east', 'west'];
    
    for (let i = 0; i < individual.chromosome.length; i++) {
        if (Math.random() < MUTATION_RATE) {
            individual.chromosome[i] = actions[Math.floor(Math.random() * actions.length)];
        }
    }
    
    return individual;
}

// Função para evoluir a população
function evolvePopulation() {
    const newPopulation = [];
    
    // Manter o melhor indivíduo (elitismo)
    newPopulation.push({...bestIndividual});
    
    // Preencher o restante da população
    while (newPopulation.length < POPULATION_SIZE) {
        // Seleção
        const [parent1, parent2] = tournamentSelection();
        
        // Crossover
        const [child1, child2] = crossover(parent1, parent2);
        
        // Mutação
        newPopulation.push(mutate(child1));
        if (newPopulation.length < POPULATION_SIZE) {
            newPopulation.push(mutate(child2));
        }
    }
    
    population = newPopulation;
    currentGeneration++;
}

// Função principal do Agente V3
function agentV3Logic() {
    if (isGameOver()) {
        return;
    }

    if (evolutionPhase) {
        if (currentGeneration < MAX_GENERATIONS) {
            evolvePopulation();
            evaluatePopulation();
            
            const bestFitness = population[0].fitness;
            console.log(`Geração ${currentGeneration}: Melhor Fitness: ${bestFitness}`);
            gameMessage.textContent = `Agente V3: Geração ${currentGeneration}, Melhor Fitness: ${bestFitness}`;

            if (bestFitness >= 2000) { // Ajustado o threshold para objetivo completo
                gameMessage.textContent += " - Solução ótima encontrada!";
                evolutionPhase = false;
            }
        } else {
            gameMessage.textContent = "Agente V3: Evolução concluída. Executando melhor sequência.";
            evolutionPhase = false;
        }
    } else {
        if (!bestIndividual || !bestIndividual.chromosome) {
            gameMessage.textContent = "Agente V3: Falha ao encontrar uma solução. Fim de rodada.";
            endRound();
            return;
        }

        // Verificar se já alcançou o objetivo
        if (hasGold && wumpusWorld.agent.x === 0 && wumpusWorld.agent.y === 0) {
            gameMessage.textContent = "Agente V3: Missão cumprida! Ouro recuperado e retornado à base.";
            endRound();
            return;
        }

        if (actionIndex >= bestIndividual.chromosome.length) {
            gameMessage.textContent = "Agente V3: Sequência concluída.";
            endRound();
            return;
        }

        const action = bestIndividual.chromosome[actionIndex];
        moveAgent(action);
        actionIndex++;
    }
}

// Função para executar a melhor sequência encontrada
function executeBestSequence() {
    if (!bestIndividual) return;
    
    gameMessage.textContent = "Agente V3: Executando melhor sequência encontrada";
    
    // Parar o intervalo do algoritmo genético
    stopAutoPlay();
    
    // Executar a sequência de ações
    let actionIndex = 0;
    
    agentV3Interval = setInterval(() => {
        if (actionIndex >= bestIndividual.chromosome.length || isGameOver()) {
            clearInterval(agentV3Interval);
            gameMessage.textContent = "Agente V3: Sequência concluída";
            return;
        }
        
        const action = bestIndividual.chromosome[actionIndex];
        moveAgent(action);
        actionIndex++;
    }, velocity);
}
//AQUI ENCERRA o Agente V3 (AG)

function startAutoPlay() {
    stopAutoPlay();
    gameMessage.textContent = 'Agente ' + agent + ' iniciado...';
    
    autoPlayInterval = setInterval(() => {
        if (isGameOver()) {
            stopAutoPlay();
            return;
        }
        if (agent === 'V1') {
            agentV1Logic();
        } else if (agent === 'V2') {
            agentV2Logic();
        } else if (agent === 'V3') {
            agentV3Logic();
        }
    }, velocity);
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
    console.clear();
    autoPlayOn();
});

agentV2Btn.addEventListener('click', () => {
    agent = 'V2';
    rounds = 0;
    console.clear();
    autoPlayOn();
});

agentV3Btn.addEventListener('click', () => {
    agent = 'V3';
    rounds = 0;
    console.clear();
    autoPlayOn();
});

function autoPlayOn() {
    finalStatus = '';
    resetScores();
    resetAgentPosition();

    if (agent === 'V2') {
        agentMemory = initializeAgentMemory(wumpusWorld.size);
        updateAgentMemory(0, 0);
    } else if (agent === 'V3') {
        // Reset all V3 specific variables.
        population = [];
        currentGeneration = 0;
        bestIndividual = null;
        executingSequence = false;
        actionIndex = 0;
        evolutionPhase = true;
        
        // This is the critical part: initialize the GA at the start of every round.
        // This will populate the initial population and set the first bestIndividual.
        initializeGeneticAlgorithm();
    }

    rounds += 1;
    console.log(`--- Rodada: ${rounds} | Agente: ${agent} ---`);
    
    renderBoard();
    startAutoPlay();
}

function createRelatorio(r, s, m, fs) {
    relatorio.set(r, { pontos: s, movimentos: m, status: fs });
}

function showRelatorio() {
    if (agent === 'V3'){
        console.log('Agente V3 finalizado com sucesso!')
    } else {
    for (const [round, dados] of relatorio.entries()) {
        console.log(`Round ${round} - ` + `Pontos: ${dados.pontos} ` + `Movimentos: ${dados.movimentos} ` + `Conclusão: ${dados.status}`);
        /* console.log(`Pontos: ${dados.pontos}`);
        console.log(`Movimentos: ${dados.movimentos}`); */
    }
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