const boardElement = document.getElementById('board');
const playerTurnElement = document.getElementById('current-player');
const capturedSenteElement = document.getElementById('captured-sente');
const capturedGoteElement = document.getElementById('captured-gote');
const infoAreaElement = document.getElementById('info-area');

let board = [];
let currentPlayer = 'sente';
let selectedPiece = null;
let gameMode = null;
let capturedSente = {};
let capturedGote = {};
let isGameOver = false;

const PIECES = {
    '歩': { name: '歩', promoted: 'と' }, '香': { name: '香', promoted: '杏' }, '桂': { name: '桂', promoted: '圭' },
    '銀': { name: '銀', promoted: '全' }, '金': { name: '金', promoted: null }, '角': { name: '角', promoted: '馬' },
    '飛': { name: '飛', promoted: '龍' }, '王': { name: '王', promoted: null }, 'と': { name: 'と', promoted: null },
    '杏': { name: '杏', promoted: null }, '圭': { name: '圭', promoted: null }, '全': { name: '全', promoted: null },
    '馬': { name: '馬', promoted: null }, '龍': { name: '龍', promoted: null },
};

const PIECE_VALUES = {
    '歩': 1, '香': 3, '桂': 3, '銀': 5, '金': 6, '角': 8, '飛': 10, '王': 1000,
    'と': 6, '杏': 6, '圭': 6, '全': 6, '馬': 12, '龍': 14
};

function initGame() {
    board = [
        [{name:'香', owner:'gote'},{name:'桂', owner:'gote'},{name:'銀', owner:'gote'},{name:'金', owner:'gote'},{name:'王', owner:'gote'},{name:'金', owner:'gote'},{name:'銀', owner:'gote'},{name:'桂', owner:'gote'},{name:'香', owner:'gote'}],
        [null, {name:'飛', owner:'gote'}, null, null, null, null, null, {name:'角', owner:'gote'}, null],
        [{name:'歩', owner:'gote'},{name:'歩', owner:'gote'},{name:'歩', owner:'gote'},{name:'歩', owner:'gote'},{name:'歩', owner:'gote'},{name:'歩', owner:'gote'},{name:'歩', owner:'gote'},{name:'歩', owner:'gote'},{name:'歩', owner:'gote'}],
        [null, null, null, null, null, null, null, null, null], [null, null, null, null, null, null, null, null, null], [null, null, null, null, null, null, null, null, null],
        [{name:'歩', owner:'sente'},{name:'歩', owner:'sente'},{name:'歩', owner:'sente'},{name:'歩', owner:'sente'},{name:'歩', owner:'sente'},{name:'歩', owner:'sente'},{name:'歩', owner:'sente'},{name:'歩', owner:'sente'},{name:'歩', owner:'sente'}],
        [null, {name:'角', owner:'sente'}, null, null, null, null, null, {name:'飛', owner:'sente'}, null],
        [{name:'香', owner:'sente'},{name:'桂', owner:'sente'},{name:'銀', owner:'sente'},{name:'金', owner:'sente'},{name:'王', owner:'sente'},{name:'金', owner:'sente'},{name:'銀', owner:'sente'},{name:'桂', owner:'sente'},{name:'香', owner:'sente'}]
    ];
    capturedSente = {}; capturedGote = {};
    currentPlayer = 'sente'; selectedPiece = null;
    isGameOver = false; infoAreaElement.innerText = "";
    renderAll();
}

function renderAll() { renderBoard(); renderCaptured(); updatePlayerTurn(); }
function renderBoard() {
    boardElement.innerHTML = '';
    for (let r = 0; r < 9; r++) { for (let c = 0; c < 9; c++) {
        const square = document.createElement('div');
        square.classList.add('square'); square.dataset.row = r; square.dataset.col = c;
        const piece = board[r][c];
        if (piece) { square.appendChild(createPieceElement(piece, false)); }
        if (selectedPiece && selectedPiece.type === 'board' && selectedPiece.row === r && selectedPiece.col === c) {
            square.classList.add('selected');
        }
        square.addEventListener('click', () => onSquareClick(r, c));
        boardElement.appendChild(square);
    }}
}
function renderCaptured() {
    capturedSenteElement.innerHTML = ''; capturedGoteElement.innerHTML = '';
    const captured = [{ el: capturedSenteElement, pieces: capturedSente, owner: 'sente' }, { el: capturedGoteElement, pieces: capturedGote, owner: 'gote' }];
    for (const side of captured) { for (const pieceName in side.pieces) {
        if (side.pieces[pieceName] > 0) {
            const pieceData = { name: pieceName, owner: side.owner };
            const pieceElement = createPieceElement(pieceData, true);
            pieceElement.innerText += `x${side.pieces[pieceName]}`;
            if (selectedPiece && selectedPiece.type === 'captured' && selectedPiece.piece.name === pieceName) {
                pieceElement.classList.add('selected');
            }
            pieceElement.addEventListener('click', () => onCapturedPieceClick(pieceName, side.owner));
            side.el.appendChild(pieceElement);
        }
    }}
}
function createPieceElement(piece, isCaptured) {
    const pieceElement = document.createElement('div');
    pieceElement.className = 'piece';
    if(isCaptured) pieceElement.classList.add('captured-piece');
    if(piece.owner === 'gote') pieceElement.classList.add('gote');
    pieceElement.innerText = PIECES[piece.name].name;
    return pieceElement;
}
function updatePlayerTurn() { playerTurnElement.innerText = currentPlayer === 'sente' ? '先手' : '後手'; }

function onSquareClick(row, col) {
    if (isGameOver) return;
    const clickedPieceOnBoard = board[row][col];

    if (selectedPiece) {
        const isReselectingSamePiece = selectedPiece.type === 'board' && selectedPiece.row === row && selectedPiece.col === col;
        const isSelectingAnotherFriendlyPiece = clickedPieceOnBoard && clickedPieceOnBoard.owner === currentPlayer;

        if (isReselectingSamePiece) {
            selectedPiece = null;
        } else if (isSelectingAnotherFriendlyPiece) {
            selectedPiece = { type: 'board', row, col, piece: clickedPieceOnBoard };
        } else {
            if (selectedPiece.type === 'board') {
                const from = { ...selectedPiece };
                if (!isValidFuture(from, {row, col})) {
                    alert("その手は王様が取られてしまうため指せません。");
                    selectedPiece = null;
                } else if (isValidMove(from, row, col)) {
                    movePiece(from, row, col);
                }
            } else if (selectedPiece.type === 'captured') {
                if (isValidDrop(selectedPiece.piece, row, col)) {
                    dropPiece(selectedPiece.piece, row, col);
                } else {
                    selectedPiece = null;
                }
            }
        }
    } else {
        if (clickedPieceOnBoard && clickedPieceOnBoard.owner === currentPlayer) {
            selectedPiece = { type: 'board', row, col, piece: clickedPieceOnBoard };
        }
    }
    renderAll();
}
function onCapturedPieceClick(pieceName, owner) {
    if (isGameOver || owner !== currentPlayer) return;

    const isReselectingSamePiece = selectedPiece && selectedPiece.type === 'captured' && selectedPiece.piece.name === pieceName;

    if (isReselectingSamePiece) {
        selectedPiece = null;
    } else {
        selectedPiece = { type: 'captured', piece: { name: pieceName, owner } };
    }
    renderAll();
}


function movePiece(from, toRow, toCol, forcePromotion = null) {
    const pieceToMove = from.piece;
    const targetPiece = board[toRow][toCol];
    if (targetPiece) {
        const captured = pieceToMove.owner === 'sente' ? capturedSente : capturedGote;
        const originalName = Object.keys(PIECES).find(key => PIECES[key].promoted === targetPiece.name) || targetPiece.name;
        captured[originalName] = (captured[originalName] || 0) + 1;
    }
    const canPromote = (pieceToMove.owner === 'sente' && toRow <= 2) || (pieceToMove.owner === 'gote' && toRow >= 6);
    const mustPromote = ((pieceToMove.name === '歩' || pieceToMove.name === '香') && toRow === (pieceToMove.owner === 'sente' ? 0 : 8)) || (pieceToMove.name === '桂' && (pieceToMove.owner === 'sente' ? toRow <= 1 : toRow >= 7));
    
    if ((canPromote || mustPromote) && PIECES[pieceToMove.name].promoted) {
        let promote = false;
        if (forcePromotion === true) {
            promote = true;
        } else if (forcePromotion === false) {
            promote = false;
        } else {
            if (mustPromote || confirm(`${pieceToMove.name}を成りますか？`)) {
                promote = true;
            }
        }
        if (promote) {
            pieceToMove.name = PIECES[pieceToMove.name].promoted;
        }
    }
    board[toRow][toCol] = pieceToMove;
    board[from.row][from.col] = null;
    selectedPiece = null;
    switchTurn();
}
function dropPiece(piece, row, col) {
    board[row][col] = { ...piece };
    const captured = piece.owner === 'sente' ? capturedSente : capturedGote;
    captured[piece.name]--;
    selectedPiece = null;
    switchTurn();
}
function switchTurn() {
    currentPlayer = (currentPlayer === 'sente') ? 'gote' : 'sente';
    if (isKingInCheck(currentPlayer, board)) {
        if (isCheckmate(currentPlayer)) {
            infoAreaElement.innerText = `詰みです！ ${currentPlayer === 'sente' ? '後手' : '先手'}の勝ち！`;
            isGameOver = true;
            renderAll();
            return;
        }
        infoAreaElement.innerText = "王手です！";
    } else {
        infoAreaElement.innerText = "";
    }
    renderAll();
    if (gameMode === 'ai' && currentPlayer === 'gote' && !isGameOver) {
        setTimeout(makeAiMove, 500);
    }
}

function isValidMove(from, toRow, toCol) {
    const piece = from.piece; const fromRow = from.row; const fromCol = from.col;
    const dy = toRow - fromRow; const dx = toCol - fromCol; const dir = piece.owner === 'sente' ? -1 : 1;
    const target = board[toRow][toCol];
    if (target && target.owner === piece.owner) return false;
    switch (piece.name) {
        case '歩': return dx === 0 && dy === dir;
        case '香':
            if (dx === 0 && dy * dir > 0) {
                for (let i = 1; i < Math.abs(dy); i++) { if (board[fromRow + i * dir][fromCol]) return false; } return true;
            } return false;
        case '桂': return Math.abs(dx) === 1 && dy === dir * 2;
        case '銀':  return (dy === dir && Math.abs(dx) <= 1) || (Math.abs(dx) === 1 && dy === -dir);
        case '金': case 'と': case '杏': case '圭': case '全': return (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) && !(Math.abs(dx) === 1 && dy === -dir);
        case '王': return Math.abs(dx) <= 1 && Math.abs(dy) <= 1;
        case '角':
            if (Math.abs(dx) === Math.abs(dy)) {
                const xStep = dx > 0 ? 1 : -1; const yStep = dy > 0 ? 1 : -1;
                for (let i = 1; i < Math.abs(dx); i++) { if (board[fromRow + i * yStep][fromCol + i * xStep]) return false; } return true;
            } return false;
        case '飛':
             if (dx === 0 || dy === 0) {
                const step = dx !== 0 ? {x: dx > 0 ? 1 : -1, y: 0} : {x: 0, y: dy > 0 ? 1 : -1};
                const dist = Math.max(Math.abs(dx), Math.abs(dy));
                for (let i = 1; i < dist; i++) { if (board[fromRow + i * step.y][fromCol + i * step.x]) return false; } return true;
            } return false;
        case '馬':
            if (Math.abs(dx) === Math.abs(dy)) {
                const xStep = dx > 0 ? 1 : -1; const yStep = dy > 0 ? 1 : -1;
                for (let i = 1; i < Math.abs(dx); i++) { if (board[fromRow + i * yStep][fromCol + i * xStep]) return false; } return true;
            } return Math.abs(dx) <= 1 && Math.abs(dy) <= 1;
        case '龍':
            if (dx === 0 || dy === 0) {
                const step = dx !== 0 ? {x: dx > 0 ? 1 : -1, y: 0} : {x: 0, y: dy > 0 ? 1 : -1};
                const dist = Math.max(Math.abs(dx), Math.abs(dy));
                for (let i = 1; i < dist; i++) { if (board[fromRow + i * step.y][fromCol + i * step.x]) return false; } return true;
            } return Math.abs(dx) <= 1 && Math.abs(dy) <= 1;
    }
    return false;
}
function isValidDrop(piece, row, col) {
    if (board[row][col]) { return false; }
    if (piece.name === '歩') {
        const dir = piece.owner === 'sente' ? -1 : 1;
        const kingPos = { r: row + dir, c: col };
        const p = board[kingPos.r] && board[kingPos.r][kingPos.c];
        if (p && p.name === '王' && p.owner !== piece.owner) {
             // TODO: Check for mate by dropping pawn (打ち歩詰め)
             // return false;
        }
        for (let r = 0; r < 9; r++) { 
            const p = board[r][col]; 
            if (p && p.name === '歩' && p.owner === piece.owner) { 
                return false; // Nifu check
            }
        }
    }
    const lastRank = piece.owner === 'sente' ? 0 : 8;
    const secondLastRank = piece.owner === 'sente' ? 1 : 7;
    if ((piece.name === '歩' || piece.name === '香') && row === lastRank) { return false; }
    if (piece.name === '桂' && (row === lastRank || row === secondLastRank)) { return false; }
    return true;
}
function isKingInCheck(kingOwner, currentBoard) {
    let kingPos = null;
    for (let r = 0; r < 9; r++) { for (let c = 0; c < 9; c++) {
        const p = currentBoard[r][c];
        if (p && p.name === '王' && p.owner === kingOwner) { kingPos = { r, c }; break; }
    } if (kingPos) break; }
    if (!kingPos) return false;
    const opponent = kingOwner === 'sente' ? 'gote' : 'sente';
    for (let r = 0; r < 9; r++) { for (let c = 0; c < 9; c++) {
        const p = currentBoard[r][c];
        if (p && p.owner === opponent) {
            const from = { row: r, col: c, piece: p };
            const originalBoard = board; board = currentBoard;
            const valid = isValidMove(from, kingPos.r, kingPos.c);
            board = originalBoard;
            if (valid) return true;
        }
    }}
    return false;
}
function isValidFuture(from, to) {
    const tempBoard = JSON.parse(JSON.stringify(board));
    const piece = from.piece;
    if (tempBoard[to.row][to.col]) {}
    tempBoard[to.row][to.col] = piece;
    tempBoard[from.row][from.col] = null;
    return !isKingInCheck(piece.owner, tempBoard);
}
function isCheckmate(kingOwner) {
    for (let r = 0; r < 9; r++) { for (let c = 0; c < 9; c++) {
        const piece = board[r][c];
        if (piece && piece.owner === kingOwner) {
            for (let tr = 0; tr < 9; tr++) { for (let tc = 0; tc < 9; tc++) {
                const from = { row: r, col: c, piece: piece };
                if (isValidMove(from, tr, tc)) {
                    const tempBoard = JSON.parse(JSON.stringify(board));
                    tempBoard[tr][tc] = piece;
                    tempBoard[from.row][from.col] = null;
                    if (!isKingInCheck(kingOwner, tempBoard)) {
                        return false;
                    }
                }
            }}
        }
    }}
    const captured = kingOwner === 'sente' ? capturedSente : capturedGote;
    for (const pieceName in captured) {
        if (captured[pieceName] > 0) {
            const pieceToDrop = { name: pieceName, owner: kingOwner };
            for (let r = 0; r < 9; r++) { for (let c = 0; c < 9; c++) {
                if (isValidDrop(pieceToDrop, r, c)) {
                    const tempBoard = JSON.parse(JSON.stringify(board));
                    tempBoard[r][c] = pieceToDrop;
                    if (!isKingInCheck(kingOwner, tempBoard)) {
                         return false;
                    }
                }
            }}
        }
    }
    return true;
}

function getPieceValue(piece) {
    if (!piece || !piece.name) return 0;
    return PIECE_VALUES[piece.name] || 0;
}

function evaluateBoard(board, player, capturedPlayer, capturedOpponent) {
    let score = 0;
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const piece = board[r][c];
            if (piece) {
                if (piece.owner === player) {
                    score += getPieceValue(piece);
                } else {
                    score -= getPieceValue(piece);
                }
            }
        }
    }
    for (const pieceName in capturedPlayer) {
        score += getPieceValue({ name: pieceName }) * capturedPlayer[pieceName];
    }
    for (const pieceName in capturedOpponent) {
        score -= getPieceValue({ name: pieceName }) * capturedOpponent[pieceName];
    }
    return score;
}

function makeAiMove() {
    let bestMoves = [];
    let bestScore = -Infinity;
    let legalMovesAvailable = false;
    const player = 'gote';

    // 1. Evaluate board moves
    for (let r = 0; r < 9; r++) { for (let c = 0; c < 9; c++) {
        const piece = board[r][c];
        if (piece && piece.owner === player) {
            const from = { row: r, col: c, piece: piece };
            for (let tr = 0; tr < 9; tr++) { for (let tc = 0; tc < 9; tc++) {
                if (isValidMove(from, tr, tc)) {
                    const tempBoardMove = JSON.parse(JSON.stringify(board));
                    tempBoardMove[tr][tc] = from.piece;
                    tempBoardMove[r][c] = null;

                    if (!isKingInCheck(player, tempBoardMove)) {
                        legalMovesAvailable = true;
                        
                        const tempCapturedSente = JSON.parse(JSON.stringify(capturedSente));
                        const tempCapturedGote = JSON.parse(JSON.stringify(capturedGote));

                        const targetPiece = board[tr][tc];
                        if (targetPiece) {
                            const originalName = Object.keys(PIECES).find(key => PIECES[key].promoted === targetPiece.name) || targetPiece.name;
                            tempCapturedGote[originalName] = (tempCapturedGote[originalName] || 0) + 1;
                        }

                        const pieceToMove = from.piece;
                        const canPromote = (player === 'gote' && tr >= 6) || (player === 'sente' && tr <= 2);
                        const mustPromote = ((pieceToMove.name === '歩' || pieceToMove.name === '香') && tr === (player === 'sente' ? 0 : 8)) || (pieceToMove.name === '桂' && (player === 'sente' ? tr <= 1 : tr >= 7));
                        
                        let score, promotedMove = false;

                        if ((canPromote || mustPromote) && PIECES[pieceToMove.name].promoted) {
                            const promotedPiece = JSON.parse(JSON.stringify(pieceToMove));
                            promotedPiece.name = PIECES[pieceToMove.name].promoted;
                            const promotedBoard = JSON.parse(JSON.stringify(tempBoardMove));
                            promotedBoard[tr][tc] = promotedPiece;
                            
                            const promotedScore = evaluateBoard(promotedBoard, player, tempCapturedGote, tempCapturedSente);

                            if (!mustPromote) {
                                const nonPromotedScore = evaluateBoard(tempBoardMove, player, tempCapturedGote, tempCapturedSente);
                                if (promotedScore > nonPromotedScore) {
                                    score = promotedScore;
                                    promotedMove = true;
                                } else {
                                    score = nonPromotedScore;
                                }
                            } else {
                                score = promotedScore;
                                promotedMove = true;
                            }
                        } else {
                            score = evaluateBoard(tempBoardMove, player, tempCapturedGote, tempCapturedSente);
                        }
                        
                        const move = { type: 'move', from, to: { r: tr, c: tc }, promote: promotedMove };
                        if (score > bestScore) {
                            bestScore = score;
                            bestMoves = [move];
                        } else if (score === bestScore) {
                            bestMoves.push(move);
                        }
                    }
                }
            }}
        }
    }}

    // 2. Evaluate drops
    const captured = capturedGote;
    for (const pieceName in captured) { if(captured[pieceName] > 0) {
        const pieceToDrop = { name: pieceName, owner: player };
        for (let r = 0; r < 9; r++) { for (let c = 0; c < 9; c++) {
            if (isValidDrop(pieceToDrop, r, c)) {
                const tempBoard = JSON.parse(JSON.stringify(board));
                tempBoard[r][c] = pieceToDrop;
                if (!isKingInCheck(player, tempBoard)) {
                    legalMovesAvailable = true;
                    
                    const tempCapturedGote = JSON.parse(JSON.stringify(capturedGote));
                    tempCapturedGote[pieceName]--;
                    
                    const score = evaluateBoard(tempBoard, player, tempCapturedGote, capturedSente);
                    const move = { type: 'drop', piece: pieceToDrop, to: { r, c } };
                    if (score > bestScore) {
                        bestScore = score;
                        bestMoves = [move];
                    } else if (score === bestScore) {
                        bestMoves.push(move);
                    }
                }
            }
        }}
    }}

    if (bestMoves.length > 0) {
        const bestMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
        if (bestMove.type === 'move') {
            movePiece(bestMove.from, bestMove.to.r, bestMove.to.c, bestMove.promote);
        } else {
            dropPiece(bestMove.piece, bestMove.to.r, bestMove.to.c);
        }
    } else if (!legalMovesAvailable) {
        infoAreaElement.innerText = "後手の負けです！"; 
        isGameOver = true;
    }
}
document.getElementById('vs-human-btn').addEventListener('click', () => { gameMode = 'human'; startGame(); });
document.getElementById('vs-ai-btn').addEventListener('click', () => { gameMode = 'ai'; startGame(); });
function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');
    initGame();
}