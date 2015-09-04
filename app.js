var board = document.getElementById('board');
var rows = board.dataset.rowCount;
var cols = board.dataset.columnCount;
var rowFragment = document.createDocumentFragment();
var letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

for (var r = (rows - 1); r >= 0; --r) {
	var row = document.createElement('div');
	var colFragment = document.createDocumentFragment();

	row.className = 'row';
	row.id = 'row_' +r;

	for (var c = (cols - 1); c >= 0; --c) {
		var col = document.createElement('div');

		col.className = 'column column-' +c+ '-' +r;
		col.id = 'col_' +r+ '_' +c;
		col.dataset.type = 'square';
		col.dataset.rank = r + 1;
		col.dataset.file = letters[c];
		col.dataset.x = c;
		col.dataset.y = r;
		col.dataset.piece = '';

		colFragment.appendChild(col);
	}

	row.appendChild(colFragment);
	rowFragment.appendChild(row);
}

board.appendChild(rowFragment);

var RANDOM_MIN_VALUE = 5000;
var RANDOM_MAX_VALUE = 10000;

for (var r = (rows - 1); r >= 0; --r) {
	var name, color, movements;

	if (r < 2 || r > 5) {
		for (var c = (cols - 1); c >= 0; --c) {
			var square = document.getElementById('col_' +r+ '_' +c);
			var piece = document.createElement('div');
			color = (r < 2) ? 'white' : 'black';

			if (r === 0 || r === 7) {
				if (c === 0 || c === 7) {
					name = 'R';
				} else if (c === 1 || c === 6) {
					name = 'KN';
				} else if (c === 2 || c === 5) {
					name = 'B';
				} else if (c === 3) {
					name = 'Q';
				} else if (c === 4) {
					name = 'K';
				}
			} else {
				name = 'P';
				movements = 'Vertical';
			}

			piece.className = 'piece ' +name+ ' ' +color;
			piece.id = 'piece_' +(Math.ceil(Math.random() * (RANDOM_MAX_VALUE - RANDOM_MIN_VALUE)) + RANDOM_MIN_VALUE);
			piece.setAttribute('draggable', true);
			piece.dataset.type = 'piece';
			piece.dataset.id = name;
			piece.dataset.color = color;
			piece.dataset.x = c;
			piece.dataset.y = r;
			piece.dataset.movements = movements;
			piece.dataset.isMoved = false;
			square.appendChild(piece);
			square.dataset.piece = piece.id;
		}
	}
}

var movement = new Movement(board);
var onDragStart, onDragEnter, onDragOver, onDragLeave, onDrag, onDrop, onDragEnd;
var sourceSquare;

onDragStart = function(e) {
	var piece = e.target;
	if (piece.dataset.type === 'piece') {
		sourceSquare = piece.parentNode;
		sourceSquare.classList.add('start');
		piece.classList.add('move');
		movement.setMovementList(piece.dataset.movements);
		movement.calculatePossibleMoves(piece);
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', piece.id);
	}
};

onDragEnter = function(e) {
	var ele = e.target;

	if (ele.dataset.type === 'square') {
		if (ele.id !== sourceSquare.id) {
			ele.classList.add('over');
		}
	}

	e.preventDefault();
};

onDragOver = function(e) {
	var ele = e.target;

	if (ele.dataset.type === 'square') {
		e.dataTransfer.dropEffect = 'move';
	}

	e.preventDefault();
}

onDragLeave = function(e) {
	var ele = e.target;
	if (ele.dataset.type === 'square') {
		ele.classList.remove('over');
	}
};

onDrop = function(e) {
	var ele = e.target;
	var pieceId = e.dataTransfer.getData('text/plain');
	var piece = document.getElementById(pieceId);

	piece.classList.remove('move'); 
	movement.unhighlightDroppableSquares();

	if (ele.dataset.type === 'square') {
		if (ele.id !== sourceSquare.id) {
			var squareX = ele.dataset.x;
			var squareY = ele.dataset.y;

			if (movement.canMoveToSquare(squareX, squareY)) {
				movement.move(piece, sourceSquare, ele);

				e.preventDefault();
			}
		}
	}
};

board.addEventListener('dragstart', onDragStart);
board.addEventListener('dragenter', onDragEnter);
board.addEventListener('dragover', onDragOver);
board.addEventListener('dragleave', onDragLeave);
board.addEventListener('drop', onDrop);

/**
 * The movement interface.
 */
function Movement(board) {
	this.board = board;
	this.movementList = [];
	this.possibleSquares = [];
}

Movement.prototype.setMovementList = function(movements) {
	this.movementList = movements.split(/\s?,\s?/);
};

Movement.prototype.canMoveToSquare = function(x, y) {
	var moveable = (this.possibleSquares.indexOf('.column-' +x+ '-' +y) > -1);
	this.movementList = [];
	this.possibleSquares = [];
	return moveable;
};

Movement.prototype.move = function(piece, fromSquare, toSquare) {
	piece.dataset.x = toSquare.dataset.x;
	piece.dataset.y = toSquare.dataset.y;
	piece.dataset.isMoved = true;
	toSquare.appendChild(piece);
	toSquare.dataset.piece = piece.id;
	fromSquare.dataset.piece = '';
	fromSquare.classList.remove('start');
};

Movement.prototype.calculatePossibleMoves = function(piece) {
	this.piece = piece;

	for (var i = (this.movementList.length - 1); i >=0; --i) {
		var action = this['calculate' +this.movementList[i]+ 'Moves'];

		if (typeof action === 'function') {
			action.call(this, piece.dataset.x, piece.dataset.y, piece.dataset.id);
		}
	}

	this.droppableSquares = this.board.querySelectorAll(this.possibleSquares.join(','));
	this.highlightDroppableSquares();
};

Movement.prototype.highlightDroppableSquares = function() {
	for (var i = (this.droppableSquares.length - 1); i >= 0; --i) {
		var square = this.droppableSquares.item(i);
		square.classList.add('droppable');
	}
};

Movement.prototype.unhighlightDroppableSquares = function() {
	for (var i = (this.droppableSquares.length - 1); i >= 0; --i) {
		var square = this.droppableSquares.item(i);
		square.classList.remove('droppable');
	}

	this.droppableSquares = null;
};

Movement.prototype.calculateHorizontalMoves = function(x, y, pieceId) {
	// Get horizontal x, y coordinates related to current square.
	for (var i = (this.board.dataset.columnCount - 1); i > x; --i) {
		this.possibleSquares.push('.column-' +i+ '-' +y);
	}

	for (var i = (x - 1); i < x; --i) {
		this.possibleSquares.push('.column-' +i+ '-' +y);
	}
};

Movement.prototype.calculateVerticalMoves = function(x, y, pieceId) {
	console.log('id: ' +pieceId+ ', color: ' +this.piece.dataset.color+ ', y: ' +y);
	var isMoved = this.piece.dataset.isMoved;
	var isWhitePawn = (pieceId === 'P' && this.piece.dataset.color === 'white');
	var isBlackPawn = (pieceId === 'P' && this.piece.dataset.color === 'black');
	var destUp = 7;
	var destDown = 1;

	console.log('isMoved: ' +isMoved);
	console.log('isWhitePawn: ' +isWhitePawn);
	console.log('isBlackPawn: ' +isBlackPawn);

	if ((isWhitePawn || pieceId !== 'P') && y < 7) {
		if (isWhitePawn) {
			console.log('setting destUp...');
			destUp = isMoved ? (parseInt(y) + 1) : (parseInt(y) + 2);
			console.log('destUp is set to ' +destUp);
		}

		for (var i = destUp; i > y; --i) {
			this.possibleSquares.push('.column-' +x+ '-' +i);
		}
	}

	if ((isBlackPawn || pieceId !== 'P') && y > 1) {
		if (isBlackPawn) {
			destDown = isMoved ? (y - 1) : (y - 2);
		}

		for (var i = (y - 1); i >= destDown; --i) {
			this.possibleSquares.push('.column-' +x+ '-' +i);
		}
	}

};

Movement.prototype.calculateDiagonalMoves = function(x, y) {

};
