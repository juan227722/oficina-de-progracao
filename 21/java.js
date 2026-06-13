let deck = [];
let playerHand = [];
let dealerHand = [];
let gameOver = false;

const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Evento automático que inicia o jogo assim que a janela do navegador termina de carregar tudo
window.onload = function() {
    restartGame();
};

function buildDeck() {
    deck = []; // Limpa o baralho antigo garantindo que comece zerado
    for (let s of suits) { // Passa por cada um dos 4 naipes
        for (let v of values) { // Para cada naipe, passa por todos os 13 valores
            deck.push({ value: v, suit: s }); // Adiciona um objeto representando a carta no baralho
        }
    }
}

// Função que embaralha as cartas usando o algoritmo clássico de Fisher-Yates
function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) { // Começa do fim do baralho e vai voltando até a segunda carta
        let j = Math.floor(Math.random() * (i + 1)); // Sorteia um número de índice aleatório entre 0 e 'i'
        let temp = deck[i]; // Guarda temporariamente a carta da posição atual 'i'
        deck[i] = deck[j]; // Substitui a carta da posição 'i' pela carta sorteada na posição 'j'
        deck[j] = temp; // Coloca a carta guardada de 'i' na posição 'j', finalizando a troca de lugares
    }
}

function restartGame() {
    playerHand = [];
    dealerHand = [];
    gameOver = false;
    
    document.getElementById("mensagem").innerText = ""; // Limpa qualquer texto de vitória ou derrota da tela
    document.getElementById("btn-hit").disabled = false; // Reativa o botão de pedir cartas
    document.getElementById("btn-stand").disabled = false; // Reativa o botão de parar
    document.getElementById("btn-restart").classList.add("hidden"); // Esconde novamente o botão de reiniciar rodada

    buildDeck();
    shuffleDeck();

    playerHand.push(deck.pop());
    dealerHand.push(deck.pop());
    playerHand.push(deck.pop());
    dealerHand.push(deck.pop());

    updateUI(true); // Atualiza a tela ocultando a primeira carta do Bot para criar mistério
}

// Função que calcula o valor total de pontos de uma mão de cartas de acordo com as regras do 21
function calculateScore(hand) {
    let score = 0; // Começa a contagem de pontos do zero
    let aces = 0; // Contador exclusivo para controlar quantos Áses ('A') estão na mão

    for (let card of hand) { // Passa inspecionando cada carta da mão enviadalem
        if (card.value === 'A') { // Se a carta for um Ás
            aces += 1; // Registra que encontrou um Ás
            score += 11; // Por padrão, calcula o Ás valendo 11 pontos inicialmente
        } else if (['J', 'Q', 'K'].includes(card.value)) { // Se for uma figura (Valete, Dama ou Rei)
            score += 10; // Figuras sempre valem exatamente 10 pontos
        } else {
            score += parseInt(card.value);
        }
    }

    // Regra inteligente do Ás: se o placar estourar 21 e você tiver um Ás na mão, ele passa a valer apenas 1 ponto
    while (score > 21 && aces > 0) {
        score -= 10; // Subtrai 10 pontos (fazendo o Ás passar de 11 para 1)
        aces -= 1; // Registra que esse Ás já foi convertido e corrigido
    }

    return score;
}

// Função que desenha fisicamente as cartas na tela transformando dados em elementos HTML
function renderCards(hand, containerId, hideFirstCard = false) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    hand.forEach((card, index) => {
        const cardDiv = document.createElement("div");
        cardDiv.classList.add("card");
        
        // Verifica se é a primeira carta do Bot e se ela deve ficar escondida
        if (hideFirstCard && index === 0) {
            cardDiv.classList.add("hidden-card"); // Aplica o visual do verso escuro da carta pelo CSS
            cardDiv.innerText = "?"; // Escreve uma interrogação na carta virada
        } else {
            if (card.suit === '♥' || card.suit === '♦') {
                cardDiv.classList.add("red");
            }
            // Injeta o valor e o naipe dentro da estrutura da carta
            cardDiv.innerHTML = `<div>${card.value}</div><div>${card.suit}</div>`;
        }
        container.appendChild(cardDiv); // Coloca a carta criada visualmente dentro do container na tela do navegador
    });
}

function updateUI(hideDealer = true) {
    renderCards(playerHand, "player-cards"); // Renderiza todas as cartas na área do jogador
    renderCards(dealerHand, "dealer-cards", hideDealer); // Renderiza as cartas do bot (escondendo a primeira se hideDealer for true)

    const playerScore = calculateScore(playerHand);
    document.getElementById("player-score").innerText = playerScore;

    if (hideDealer) {
        document.getElementById("dealer-score").innerText = "?"; // Se o jogo está rodando, esconde o placar total do bot com um "?"
    } else {
        document.getElementById("dealer-score").innerText = calculateScore(dealerHand);
    }
}

function hit() {
    if (gameOver) return;

    playerHand.push(deck.pop());
    const playerScore = calculateScore(playerHand);
    updateUI(true);

    if (playerScore > 21) {
        endGame("Você estourou os 21 pontos! O Bot venceu.");
    }
}

// Função acionada quando o jogador clica em "Parar" (Passa a vez para a inteligência do Bot)
function keepStand() {
    if (gameOver) return; // Segurança: impede a ação caso o jogo já tenha terminado

    document.getElementById("btn-hit").disabled = true; // Desativa o botão de pedir cartas para evitar cliques repetidos
    document.getElementById("btn-stand").disabled = true; // Desativa o próprio botão de parar

    let dealerScore = calculateScore(dealerHand);

    // Regra de IA do Bot (Regra oficial do Cassino): o Dealer é obrigado a comprar cartas até atingir no mínimo 17 pontos
    while (dealerScore < 17) {
        dealerHand.push(deck.pop());
        dealerScore = calculateScore(dealerHand);
    }

    updateUI(false);

    const playerScore = calculateScore(playerHand); // Resgata a pontuação final estável do jogador humano

    // Sistema lógico de checagem de regras para descobrir o vencedor da rodada
    if (dealerScore > 21) {
        endGame("O Bot estourou! Você venceu!");
    } else if (playerScore > dealerScore) {
        endGame(`Você venceu! Seu placar: ${playerScore} vs ${dealerScore} do Bot.`);
    } else if (playerScore < dealerScore) {
        endGame(`O Bot venceu! Placar: ${dealerScore} vs ${playerScore} seu.`); // Se o Bot tiver mais pontos, o Bot vence
    } else {
        endGame(`Empate! Ambos ficaram com ${playerScore} pontos.`); // Se os pontos forem idênticos, acontece um empate técnico
    }
}

function endGame(msg) {
    gameOver = true; // Altera o estado do jogo para finalizado
    updateUI(false); // Força a última atualização da tela revelando todo o cenário sem esconder nada do Bot
    document.getElementById("mensagem").innerText = msg; // Escreve o texto com o resultado da partida na tela
    document.getElementById("btn-hit").disabled = true; // Garante o bloqueio definitivo do botão de pedir cartas
    document.getElementById("btn-stand").disabled = true; // Garante o bloqueio definitivo do botão de parar
    document.getElementById("btn-restart").classList.remove("hidden"); // Exibe o botão "Jogar Novamente" removendo a classe hidden
}
