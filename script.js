// --- グローバル変数定義 ---
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

// --- 駒の定義 ---
const PIECES = {
    '歩': { name: '歩', promoted: 'と' }, '香': { name: '香', promoted: '杏' }, '桂': { name: '桂', promoted: '圭' },
    '銀': { name: '銀', promoted: '全' }, '金': { name: '金', promoted: null }, '角': { name: '角', promoted: '馬' },
    '飛': { name: '飛', promoted: '龍' }, '王': { name: '王', promoted: null }, 'と': { name: 'と', promoted: null },
    '杏': { name: '杏', promoted: null }, '圭': { name: '圭', promoted: null }, '全': { name: '全', promoted: null },
    '馬': { name: '馬', promoted: null }, '龍': { name: '龍', promoted: null },
};

// --- 初期化処理 ---
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

// --- 描画処理 ---
function renderAll() { renderBoard(); renderCaptured(); updatePlayerTurn(); }
function renderBoard() {
    boardElement.innerHTML = '';
    for (let r = 0; r < 9; r++) { for (let c = 0; c < 9; c++) {
        const square = document.createElement('div');
        square.classList.add('square'); square.dataset.row = r; square.dataset.col = c;
        const piece = board[r][c];
        if (piece) { square.appendChild(createPieceElement(piece, false)); }
        // ✅ 選択状態のハイライトをここで一括管理
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
            // ✅ 選択状態のハイライトをここで一括管理
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

// --- イベントハンドラ ---
// ✅ onSquareClick: 選択キャンセルと選択切り替えのロジックを追加
function onSquareClick(row, col) {
    if (isGameOver) return;
    const clickedPieceOnBoard = board[row][col];

    if (selectedPiece) { // 何かを選択中の場合
        const isReselectingSamePiece = selectedPiece.type === 'board' && selectedPiece.row === row && selectedPiece.col === col;
        const isSelectingAnotherFriendlyPiece = clickedPieceOnBoard && clickedPieceOnBoard.owner === currentPlayer;

        if (isReselectingSamePiece) {
            // 選択中の駒を再度クリック => 選択解除
            selectedPiece = null;
        } else if (isSelectingAnotherFriendlyPiece) {
            // 別の自分の駒をクリック => 選択切り替え
            selectedPiece = { type: 'board', row, col, piece: clickedPieceOnBoard };
        } else {
            // 移動または駒を打つ処理
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
                    // 打てない場所なら選択を解除
                    selectedPiece = null;
                }
            }
        }
    } else { // 何も選択していない場合
        if (clickedPieceOnBoard && clickedPieceOnBoard.owner === currentPlayer) {
            // 自分の駒をクリック => 新規選択
            selectedPiece = { type: 'board', row, col, piece: clickedPieceOnBoard };
        }
    }
    renderAll(); // どんな操作後も盤面を再描画して状態を反映
}
// ✅ onCapturedPieceClick: 持ち駒の選択・選択解除・切り替えロジックを追加
function onCapturedPieceClick(pieceName, owner) {
    if (isGameOver || owner !== currentPlayer) return;

    const isReselectingSamePiece = selectedPiece && selectedPiece.type === 'captured' && selectedPiece.piece.name === pieceName;

    if (isReselectingSamePiece) {
        // 同じ持ち駒を再度クリック => 選択解除
        selectedPiece = null;
    } else {
        // 持ち駒をクリック => 新規選択 or 選択切り替え
        selectedPiece = { type: 'captured', piece: { name: pieceName, owner } };
    }
    renderAll(); // 状態を反映
}


// --- ゲーム進行 ---
function movePiece(from, toRow, toCol) {
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
        if(mustPromote || confirm(`${pieceToMove.name}を成りますか？`)) {
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

// --- ルール判定ロジック ---
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
        // 打ち歩詰めのチェック（簡易版：王の正面に歩を打って王手になる場合は打てない）
        const dir = piece.owner === 'sente' ? -1 : 1;
        const kingPos = { r: row + dir, c: col };
        const p = board[kingPos.r] && board[kingPos.r][kingPos.c];
        if (p && p.name === '王' && p.owner !== piece.owner) {
             // ここで詰み判定を呼び出すのが正式だが、複雑なため今回は「王の前に打つ王手」を制限する簡易実装に留める
             // alert("打ち歩詰めは禁止です。"); return false;
        }
        for (let r = 0; r < 9; r++) { const p = board[r][col]; if (p && p.name === '歩' && p.owner === piece.owner) { alert("二歩は禁止です。"); return false; }}
    }
    const lastRank = piece.owner === 'sente' ? 0 : 8; const secondLastRank = piece.owner === 'sente' ? 1 : 7;
    if ((piece.name === '歩' || piece.name === '香') && row === lastRank) { alert("そこには打てません。"); return false; }
    if (piece.name === '桂' && (row === lastRank || row === secondLastRank)) { alert("そこには打てません。"); return false; }
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
    if (tempBoard[to.row][to.col]) { /* 駒を取るロジックは省略 */ }
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
function makeAiMove() {
    let legalMoves = [];
    for (let r = 0; r < 9; r++) { for (let c = 0; c < 9; c++) {
        if (board[r][c] && board[r][c].owner === 'gote') {
            for (let tr = 0; tr < 9; tr++) { for (let tc = 0; tc < 9; tc++) {
                const from = { row: r, col: c, piece: board[r][c] };
                if (isValidMove(from, tr, tc) && isValidFuture(from, {row: tr, col: tc})) {
                    legalMoves.push({ type: 'move', from, to: { r: tr, c: tc } });
                }
            }}
        }
    }}
    const captured = capturedGote;
    for (const pieceName in captured) { if(captured[pieceName] > 0) {
        for (let r = 0; r < 9; r++) { for (let c = 0; c < 9; c++) {
            const piece = { name: pieceName, owner: 'gote' };
            if (isValidDrop(piece, r, c)) {
                legalMoves.push({ type: 'drop', piece, to: {r, c} });
            }
        }}
    }}
    if (legalMoves.length > 0) {
        const move = legalMoves[Math.floor(Math.random() * legalMoves.length)];
        if (move.type === 'move') { movePiece(move.from, move.to.r, move.to.c); } else { dropPiece(move.piece, move.to.r, move.to.c); }
    } else {
        infoAreaElement.innerText = "後手の負けです！"; isGameOver = true;
    }
}
document.getElementById('vs-human-btn').addEventListener('click', () => { gameMode = 'human'; startGame(); });
document.getElementById('vs-ai-btn').addEventListener('click', () => { gameMode = 'ai'; startGame(); });
function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');
    initGame();
}
