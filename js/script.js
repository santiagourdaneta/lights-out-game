// --- Constantes del Juego ---
const BOARD_SIZE = 5; // Tablero de 5x5
const OFF = 0;
const ON = 1;

// --- Elementos del DOM ---
const boardElement = document.getElementById('board');
const movesCountDisplay = document.getElementById('moves-count');
const messageDisplay = document.getElementById('message');
const resetButton = document.getElementById('reset-button');

// --- Variables del Juego ---
let board = []; // La matriz 2D que representa el estado de las luces
let moves = 0;
let gameOver = false;

// --- NUEVA: Variable para controlar si las animaciones están activas ---
let isAnimating = false; // Evita clics durante la animación

// --- Funciones del Juego ---

// 1. Inicializa el tablero lógico y visual
function initializeGame() {
    // Configurar el grid CSS para el tamaño del tablero
    boardElement.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 70px)`;
    boardElement.style.gridTemplateRows = `repeat(${BOARD_SIZE}, 70px)`;

    board = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(OFF));
    moves = 0;
    gameOver = false;
    messageDisplay.textContent = '';
    messageDisplay.style.color = ''; // Resetear color
    resetButton.style.display = 'none';
    movesCountDisplay.textContent = moves;

    // Asegurarse de quitar la clase de animación de victoria si queda de una partida anterior
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('win-animation');
    });

    drawBoard();
    scrambleBoard(); // Genera un patrón inicial aleatorio
}

// 2. Dibuja/Redibuja el tablero en el HTML
function drawBoard() {
    boardElement.innerHTML = ''; // Limpia el tablero actual

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;

            if (board[r][c] === ON) {
                cell.classList.add('on');
            }
            boardElement.appendChild(cell);
        }
    }
}

// 3. Genera un patrón inicial aleatorio
function scrambleBoard() {
    // Una forma simple de generar un patrón solvable es hacer clics aleatorios
    // desde un tablero completamente apagado.
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE * 2; i++) { // Hacer el doble de clics que celdas
        const randomRow = Math.floor(Math.random() * BOARD_SIZE);
        const randomCol = Math.floor(Math.random() * BOARD_SIZE);
        // Simular un clic sin contar movimientos ni verificar victoria
        toggleLightAndNeighbors(randomRow, randomCol, false);
    }
    // Asegurarse de que el contador de movimientos esté en 0 al inicio del juego real
    moves = 0;
    movesCountDisplay.textContent = moves;
    drawBoard(); // Redibujar con el patrón aleatorio
}


// 4. Cambia el estado de una luz y sus vecinos
async function toggleLightAndNeighbors(row, col, updateMoves = true) {
    if (isAnimating && updateMoves) return; // Evita clics mientras hay animaciones activas
    if (updateMoves) {
        isAnimating = true; // Activa la bandera de animación
    }

    const cellsToToggle = [
        [row, col],          // La propia celda
        [row - 1, col],      // Arriba
        [row + 1, col],      // Abajo
        [row, col - 1],      // Izquierda
        [row, col + 1]       // Derecha
    ];

    const animationDelay = 80; // Milisegundos de retraso entre cada luz que cambia

    // Crear un array de promesas para esperar cada animación secuencial
    let sequentialAnimationPromises = [];

    for (const [r, c] of cellsToToggle) {
        // Asegurarse de que la celda está dentro de los límites del tablero
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
            // Esperar un momento antes de la siguiente luz
            await new Promise(resolve => setTimeout(resolve, animationDelay));

            // Cambiar estado en el tablero lógico
            board[r][c] = (board[r][c] === ON) ? OFF : ON;

            // Animar el cambio de estado en el DOM
            const cellElement = boardElement.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (cellElement) {
                // Actualizar la clase 'on' inmediatamente
                if (board[r][c] === ON) {
                    cellElement.classList.add('on');
                } else {
                    cellElement.classList.remove('on');
                }
                
                // Aplicar la animación de pulso si updateMoves es true
                if (updateMoves) {
                    cellElement.classList.remove('flash');
                    void cellElement.offsetWidth; // Forzar reflow
                    cellElement.classList.add('flash');

                    // Añadir esta animación a la lista de promesas para esperar si es necesario
                    sequentialAnimationPromises.push(new Promise(resolve => {
                        cellElement.addEventListener('animationend', function handler() {
                            cellElement.classList.remove('flash');
                            cellElement.removeEventListener('animationend', handler);
                            resolve();
                        }, { once: true });
                    }));
                }
            }
        }
    }
    
    // Una vez que todas las luces han sido procesadas secuencialmente
    if (updateMoves) {
        moves++;
        movesCountDisplay.textContent = moves;
        
        // Esperar a que la última animación de pulso (si la hay) termine
        // Aunque Promise.all no es estrictamente necesario aquí si ya usamos await en el bucle,
        // asegura que si hay animaciones de 'flash' que tienen duración, se respeten.
        await Promise.all(sequentialAnimationPromises); 

        isAnimating = false; // Desactiva la bandera de animación
        checkWin(); // Solo comprueba la victoria después de que toda la secuencia termine
    }
}

// 5. Comprueba si todas las luces están apagadas (condición de victoria)
function checkWin() {
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === ON) {
                return false; // Hay al menos una luz encendida, el juego continúa
            }
        }
    }
    
    // Si llegamos aquí, todas las luces están apagadas
    gameOver = true;
    messageDisplay.textContent = `¡Felicidades! Apagaste todas las luces en ${moves} movimientos.`;
    messageDisplay.style.color = '#4CAF50'; // Verde de victoria
    resetButton.style.display = 'block';

    // NUEVO: Activar la animación de victoria en todas las celdas
    const allCells = document.querySelectorAll('.cell');
    allCells.forEach(cell => {
        cell.classList.add('win-animation');
        // Quitar la animación después de que termine para limpiar
        cell.addEventListener('animationend', function handler() {
            cell.classList.remove('win-animation');
            cell.removeEventListener('animationend', handler);
        }, { once: true });
    });
}


// --- Event Listeners ---

// Maneja los clics en las celdas del tablero
boardElement.addEventListener('click', (event) => {
    if (gameOver || isAnimating) return; // No permitir clics si el juego ha terminado o está animando

    const clickedCell = event.target.closest('.cell');
    if (clickedCell) {
        const row = parseInt(clickedCell.dataset.row);
        const col = parseInt(clickedCell.dataset.col);
        toggleLightAndNeighbors(row, col);
    }
});
// Reinicia el juego al hacer clic en el botón
resetButton.addEventListener('click', initializeGame);

// --- Inicio del Juego ---
initializeGame();