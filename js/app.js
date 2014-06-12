/**
  * Wrapper object for game. Used to separate game from global namespace.
  */
function SnakeGame(containerId, userConfig) {

	var defaults = {
		GAME_WIDTH   : 30,
		GAME_HEIGHT  : 30,
		SCREEN_WIDTH : 720,
		SCREEN_HEIGHT: 720,
		SBOARD_COLOR : "#006",
		BOARD_COLOR  : "white",
		SNAKE_COLOR  : "black",
		interval     : 100
	};

	var constants = {
		DIRECTION_DOWN   : 1,
		DIRECTION_RIGHT  : 2,
		DIRECTION_UP     : -1,
		DIRECTION_LEFT   : -2,
		DIRECTION_DEFAULT: 2, // Right
		KEY_LEFT         : 37,
		KEY_UP           : 38,
		KEY_RIGHT        : 39,
		KEY_DOWN         : 40,
		STATE_START      : 1,
		STATE_PAUSED     : 2,
		STATE_PLAYING    : 3,
		STATE_END        : 4
	};

	var container, config, state, board, snake, score, view, controller;

	container = $(containerId);
	config = userConfig ? merge(defaults, userConfig) : defaultConfig;

	this.CELL_WIDTH  = config.SCREEN_WIDTH / config.GAME_WIDTH;
	this.CELL_HEIGHT = config.SCREEN_HEIGHT / config.GAME_HEIGHT;

	this.init = function() {
		state      = constants.STATE_START;
		board      = new Board(config.GAME_WIDTH, config.GAME_HEIGHT);
		snake      = new Snake();
		view       = new View();
		controller = new Controller();
		view.init();
		controller.init();
	}

	/**
	  * Simple matrix class to be utilized by game board.
	  */
	function Matrix(rows, cols, value) {
		this.rows = rows || 0;
		this.cols = cols || 0;

		// Initialize empty matrix with default value or null if none is specified
		var matrix = [];
		for (var r = 0; r < this.rows; r++) {
			matrix[r] = [];
			for (var c = 0; c < this.cols; c++)
				matrix[r][c] = value !== undefined ? value : null;
		}

		// Retrieve the point specified at (row, col). Throw error
		// if (row, col) is not within the bounds of the matrix.
		this.at = function(row, col) {
			if (row < 0 || row >= this.rows ||
				col < 0 || col >= this.cols)
				throw "Matrix point out of bounds";
			return matrix[row][col];
		}

		// Set cell at (row, col) to val. Throw error if (row, col)
		// is not within the bounds of the matrix.
		this.set = function(row, col, val) {
			if (row < 0 || row >= this.rows ||
				col < 0 || col >= this.cols)
				throw "Matrix point out of bounds";
			matrix[row][col] = val;
		}

		this.getMatrix=function(){return matrix;}
	}

	/**
	  * Game board class.
	  */
	function Board(width, height) {
		var EMPTY_CELL = 0;
		var grid = new Matrix(height, width, EMPTY_CELL);


		// Check if point is contained within game board
		this.isValidPoint = function(point) {
			try {
				grid.at(point.y, point.x);
			}
			catch (err) {
				return false;
			}
			return true;
		}

		// Check if space on game board is free (equals EMPTY CELL).
		this.isFreeSpace = function(point) {
			if (!this.isValidPoint(point) || this.at(point) != EMPTY_CELL)
				return false;
			return true;
		}

		// Return board value at specified point. Throw error if no point
		// is specified or argument is not of type Point.
		this.at = function(point) {
			if (!point || !(point instanceof Point))
				throw "'point' must be instance of Point in Board.at(point)";
			return grid.at(point.y, point.x);
		}

		// Set board element at point to specified value. Throw error if either
		// argument is not specified, of the wrong type, or point is invalid.
		this.set = function(point, value) {
			if (!point || !(point instanceof Point))
				throw "'point' must be instance of Point in Board.set(point, value)";
			if (value === undefined)
				throw "'value' must not be undefined in Board.set(point, value)";
			if (!this.isValidPoint(point))
				throw "Cannot set point: point must be valid";
			grid.set(point.y, point.x, value);
		}

		this.getGrid=function(){return grid;}
	}

	/**
	  * Point class for game board.
	  */
	function Point(x, y) {
		this.x = x;
		this.y = y;

		// Move point in specified direction. Throw an error if
		// no valid direction is given.
		this.movePoint = function(heading) {
			var newPoint = this.nextPoint(heading);
			this.x = newPoint.x;
			this.y = newPoint.y;
		}

		// Return the next point in the specified direction or throw
		// an error if no valid direction is given.
		this.nextPoint = function(heading) {
			if (heading == constants.DIRECTION_LEFT)
				return new Point(this.x - 1, this.y);
			else if (heading == constants.DIRECTION_UP)
				return new Point(this.x, this.y - 1);
			else if (heading == constants.DIRECTION_RIGHT)
				return new Point(this.x + 1, this.y);
			else if (heading == constants.DIRECTION_DOWN)
				return new Point(this.x, this.y + 1);
			else
				throw "Cannot calculate next point (invalid direction)";
		}
	}

	/**
	  * Model for game snake.
	  */
	function Snake(origin, direction) {
		var head = tail = origin instanceof Point ? origin : new Point(0, 0);
		var heading = direction || constants.DIRECTION_DEFAULT;
		var snakeId = this.generateId();
		var length = 1;
		this.color = config.SNAKE_COLOR;

		if (board.isFreeSpace(head))
			board.set(head, snakeId);

		// Attempt to change the heading of the snake. Return true if the heading
		// was changed. Return false if the direction cannot be changed (if the snake
		// is against the wall or an invalid direction is specified).
		this.changeDirection = function(dir) {
			var newPoint = head.nextPoint(dir);
			if (board.isValidPoint(newPoint)) {
				heading = dir;
				return true;
			}
			return false;
		}

		// Updates the data model with a movement in the current
		// direction. If the movement puts the head in an invalid
		// or non-empty space, return false. Otherwise, return true.
		this.move = function() {
			head.movePoint(heading);

			// Update board and length if space is free
			if (board.isFreeSpace(head)) {
				board.set(head, snakeId);
				length++;
				return true;
			}

			// Game over if the space is not empty
			return false;
		}

		this.getDirection = function() {
			return heading;
		}

		this.getLength = function() {
			return length;
		}

		this.getId = function() {
			return snakeId;
		}
	}
	/**
	  * Persistent id is used to identify individual snakes on the game board.
	  */
	Snake.prototype.id = 1;
	Snake.prototype.generateId = function() {
		return Snake.prototype.id++;
	}

	function Scoreboard(config) {

	}

	/**
	  * View class responsible for adding elements to the DOM and changing states.
	  */
	function View() {
		var $parentElem = container;
		var $board, $score, $hscore;
		var $overlay = $(
			'<div class="overlay" id="game-overlay">' +
			  '<div class="overlay-wrapper">' +
			    '<div class="overlay-bg vertically-center">' +
			      '<div class="overlay-content text-center vertically-center">' +
			      '</div>' +
			    '</div>' +
			  '</div>' +
			'</div>'
		);
		var $overlayContent;

		this.init = function() {
			insertScoreboard();
			insertBoard();
			this.renderState();
		}

		// Render current state. Throw error if invalid state is specified.
		this.renderState = function() {
			if (state == constants.STATE_START)
				$.proxy(renderStartState, this)();
			else if (state == constants.STATE_END)
				$.proxy(renderEndState, this)();
			else if (state == constants.STATE_PAUSED)
				$.proxy(renderPauseState, this)();
			else if (state == constants.STATE_PLAYING)
				$.proxy(renderPlayState, this)();
			else
				throw "Cannot render state: invalid state";
		}

		this.renderFrame = function() {
			console.log('render frame');
			console.log(state);
			console.log(board.at(new Point(0,0)));
			console.log(board.getGrid());
			console.log(board.getGrid().getMatrix());
			if (state == constants.STATE_PLAYING)
				for (var r = 0; r < config.GAME_HEIGHT; r++)
					for (var c = 0; c < config.GAME_WIDTH; c++)
						if (board.at(new Point(c, r)) == snake.getId())
							$('#' + r + 'x' + c).css('background', snake.color);
		}

		// Add scoreboard elements to $parentElem.
		function insertScoreboard() {
			var $sb = $('<div class="scoreboard" id="game-sb" />');
			$sb.css('background-color', config.SBOARD_COLOR);
			$score  = $('<div class="score pull-left" id="game-sb-score" />');
			$hscore = $('<div class="score pull-right" id="game-sb-hscore" />');
			$sb.append($score).append($hscore);
			$sb.appendTo($parentElem);
		}

		// Add board elements to $parentElem.
		function insertBoard() {
			$board = $('<table class="board" id="game-board" />');
			$board.css('background-color', config.BOARD_COLOR);
			for (var r = 0; r < config.GAME_HEIGHT; r++) {
				var $row = $('<tr />');
				for (var c = 0; c < config.GAME_WIDTH; c++) {
					$row.append('<td id="' + r + 'x' + c +'" />');
				}
				$row.appendTo($board);
			}
			$board.appendTo($parentElem);
		}

		function renderStartState() {
			$overlayContent = $(
				'<p class="title">begin game</p>' +
				'<button type="button" class="btn btn-primary btn-lg"' +
				        'id="game-start-btn">Start Game</button>'
			);
			
			$overlayContent.appendTo($overlay.find('div:only-child:last'));
			$overlay.appendTo($parentElem);
		}

		function renderEndState() {
			$overlayContent.remove();
			$overlayContent = $(
				'<p class="title">game over</p>' +
				'<p>Score: '+ score + '</p>'
			);

			$overlayContent.appendTo($overlay.find('div:only-child:last'));
			$overlay.appendTo($parentElem);
		}

		function renderPauseState() {

		}

		function renderPlayState() {
			$overlay.remove();
			this.renderFrame();
		}
	}

	/**
	  * Controller class responsible for running the game and handling user input.
	  */
	function Controller() {
		var intervalHandle, listening, direction;

		this.init = function() {
			listening = false;
			direction = snake.getDirection();
			$('#game-start-btn').click($.proxy(this.startGame, this));
			$('#game-resume-btn').click($.proxy(this.resumeGame, this));
		}

		this.startGame = function() {
			console.log("Start game!");
			state = constants.STATE_PLAYING;
			view.renderState();
			startListening();
			intervalHandle = setInterval($.proxy(this.playFrame, this), config.interval);
		}

		this.pauseGame = function() {

		}

		this.resumeGame = function() {

		}

		this.endGame = function() {
			console.log("End game!");
			clearInterval(intervalHandle);
			stopListening();
			state = constants.STATE_END;
			view.renderState();
		}

		this.playFrame = function() {
			console.log('playFrame');
			if (direction != snake.getDirection()) {
				console.log('directions were not equal');
				// Snake will not turn directly into wall if lined up against one.
				// This is to prevent unnatural cases where the user might not
				// understand how they lost since there is no visual feedback.
				if(!snake.changeDirection(direction))
					direction = snake.getDirection();
			}
			console.log(snake);
			
			// Game continues if snake makes a valid move
			if (snake.move()) {
				console.log('snake moved!');
				score = snake.getLength();
				view.renderFrame();
			}
			else {
				console.log('game over');
				this.endGame();
			}
		}

		function startListening() {
			if (!listening) {
				$(window).keydown(keyPressed);
				listening = true;
			}
		}

		function stopListening() {
			if (listening) {
				$(window).off('keydown', keyPressed);
				listening = false;
			}
		}

		function keyPressed(e) {
			switch (e.keyCode) {
				case 27: // Esc
					clearInterval(intervalHandle);
					stopListening();
					break;
				case 37:
					direction = constants.DIRECTION_LEFT;
					break;
				case 38:
					direction = constants.DIRECTION_UP;
					break;
				case 39:
					direction = constants.DIRECTION_RIGHT;
					break;
				case 40:
					direction = constants.DIRECTION_DOWN;
					break;
			}
			event.preventDefault();
		}
	}

	/**
	  * Helper function used to merge objects.
	  */
	function merge(defaults, overrides) {
		var result = {};
		for (key in defaults) {
			if (typeof overrides[key] === "undefined")
				result[key] = defaults[key];
			else
				result[key] = overrides[key];
		}
		return result;
	}
};