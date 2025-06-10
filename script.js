let currentUser = null;
let gameMode = null;
let board = Array(9).fill("");
let currentPlayer = "X";
let difficulty = "facil";
let isDarkTheme = true;

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || {};
}

function register() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const users = getUsers();

  if (users[username]) {
    alert("Usuário já existe!");
    return;
  }

  users[username] = { password, wins: 0, losses: 0, draws: 0 };
  saveUsers(users);
  alert("Cadastro realizado!");
}

function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const users = getUsers();

  if (!users[username] || users[username].password !== password) {
    alert("Usuário ou senha inválidos.");
    return;
  }

  currentUser = username;
  document.getElementById("auth-screen").classList.add("hidden");
  document.getElementById("game-screen").classList.remove("hidden");
  updateStats();
}

function logout() {
  currentUser = null;
  document.getElementById("auth-screen").classList.remove("hidden");
  document.getElementById("game-screen").classList.add("hidden");
}

function updateStats() {
  const user = getUsers()[currentUser];
  document.getElementById("currentUser").textContent = currentUser;
  document.getElementById("wins").textContent = user.wins;
  document.getElementById("losses").textContent = user.losses;
  document.getElementById("draws").textContent = user.draws;
}

function toggleTheme() {
  isDarkTheme = !isDarkTheme;
  document.body.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
  const themeIcon = document.querySelector('.theme-toggle i');
  themeIcon.className = isDarkTheme ? 'fas fa-moon' : 'fas fa-sun';
  localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
}

function loadTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    isDarkTheme = savedTheme === 'dark';
    document.body.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
    const themeIcon = document.querySelector('.theme-toggle i');
    themeIcon.className = isDarkTheme ? 'fas fa-moon' : 'fas fa-sun';
  }
}

function setDifficulty(level) {
  difficulty = level;
  const buttons = document.querySelectorAll('.difficulty-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  event.currentTarget.classList.add('active');
  document.getElementById('status').textContent = `Dificuldade: ${level.toUpperCase()}`;
}

function resetGame() {
  if (!gameMode) {
    alert('Selecione um modo de jogo primeiro!');
    return;
  }
  startGame(gameMode);
}

function startGame(mode) {
  board = Array(9).fill("");
  gameMode = mode;
  currentPlayer = "X";
  document.getElementById("status").textContent = "Vez do jogador X";
  const boardDiv = document.getElementById("board");
  boardDiv.innerHTML = "";

  const difficultyOptions = document.getElementById("difficulty-options");
  if (mode === "pc") {
    difficultyOptions.classList.remove("hidden");
    if (!difficulty) {
      setDifficulty('facil');
    }
  } else {
    difficultyOptions.classList.add("hidden");
  }

  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.index = i;
    cell.onclick = () => makeMove(i);
    boardDiv.appendChild(cell);
  }

  const modeButtons = document.querySelectorAll('.mode-btn');
  modeButtons.forEach(btn => btn.classList.remove('active'));
  event.currentTarget.classList.add('active');
}

function makeMove(index) {
  if (board[index] || !gameMode) return;

  board[index] = currentPlayer;
  renderBoard();

  if (checkWinner(currentPlayer)) {
    const result = currentPlayer === "X" ? "win" : "loss";
    return endGame(result);
  }

  if (board.every(cell => cell)) return endGame("draw");

  if (gameMode === "pc") {
    currentPlayer = "O";
    setTimeout(() => {
      const move = getComputerMove();
      if (move !== -1) {
        board[move] = "O";
        renderBoard();
        if (checkWinner("O")) return endGame("loss");
        if (board.every(cell => cell)) return endGame("draw");
        currentPlayer = "X";
        document.getElementById("status").textContent = "Sua vez!";
      }
    }, 500);
  } else {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    document.getElementById("status").textContent = "Vez do jogador " + currentPlayer;
  }
}

function renderBoard() {
  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell, i) => {
    cell.textContent = board[i];
    if (board[i]) {
      cell.classList.add('winner');
      setTimeout(() => cell.classList.remove('winner'), 500);
    }
  });
}

function checkWinner(player) {
  const wins = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];
  return wins.some(comb => comb.every(i => board[i] === player));
}

function endGame(result) {
  const users = getUsers();
  const user = users[currentUser];

  if (result === "win") {
    user.wins++;
    document.getElementById("status").textContent = "Jogador X venceu!";
  } else if (result === "loss") {
    if (gameMode === "pc") {
      if (currentPlayer === "X") {
        currentPlayer = "O";
        setTimeout(() => {
          const move = getComputerMove();
          if (move !== -1) {
            board[move] = "O";
            renderBoard();
            if (checkWinner("O")) return endGame("loss");
            if (board.every(cell => cell)) return endGame("draw");
            currentPlayer = "X";
            document.getElementById("status").textContent = "Sua vez!";
          }
        }, 500);
      }
      user.losses++;
      document.getElementById("status").textContent = "O PC venceu!";
    } else {
      user.losses++;
      document.getElementById("status").textContent = "Jogador O venceu!";
    }
  } else {
    user.draws++;
    document.getElementById("status").textContent = "Empate!";
  }

  saveUsers(users);
  updateStats();
}

function getComputerMove() {
  let empty = board.map((v, i) => v === "" ? i : -1).filter(i => i !== -1);

  if (difficulty === "facil") {
    return empty[Math.floor(Math.random() * empty.length)];
  }

  if (difficulty === "medio") {
    const win = findBestMove("O");
    if (win !== -1) return win;
    return empty[Math.floor(Math.random() * empty.length)];
  }

  if (difficulty === "dificil") {
    const win = findBestMove("O");
    if (win !== -1) return win;
    const block = findBestMove("X");
    if (block !== -1) return block;
    return empty[Math.floor(Math.random() * empty.length)];
  }

  if (difficulty === "impossivel") {
    return minimax(board, "O").index;
  }

  return empty[0];
}

function findBestMove(player) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  for (let comb of wins) {
    const [a,b,c] = comb;
    const values = [board[a], board[b], board[c]];
    const counts = values.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
    if (counts[player] === 2 && counts[""] === 1) {
      return comb[values.indexOf("")];
    }
  }
  return -1;
}

function minimax(newBoard, player) {
  let availSpots = newBoard.map((v, i) => v === "" ? i : -1).filter(i => i !== -1);
  if (checkWin(newBoard, "X")) return { score: -10 };
  if (checkWin(newBoard, "O")) return { score: 10 };
  if (availSpots.length === 0) return { score: 0 };

  let moves = [];

  for (let i = 0; i < availSpots.length; i++) {
    let move = {};
    move.index = availSpots[i];
    newBoard[availSpots[i]] = player;

    let result = minimax(newBoard, player === "O" ? "X" : "O");
    move.score = result.score;

    newBoard[availSpots[i]] = "";
    moves.push(move);
  }

  let bestMove;
  if (player === "O") {
    let bestScore = -10000;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score > bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  } else {
    let bestScore = 10000;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score < bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  }

  return moves[bestMove];
}

function checkWin(board, player) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return wins.some(comb => comb.every(i => board[i] === player));
}

document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  document.getElementById("difficulty-options").classList.add("hidden");
});
