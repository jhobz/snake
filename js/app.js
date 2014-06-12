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
		SNAKE_COLOR  : "black"
	};

	var constants = {
		DIRECTION_DOWN   : 1,
		DIRECTION_RIGHT  : 2,
		DIRECTION_UP     : -1,
		DIRECTION_LEFT   : -2,
		DIRECTION_DEFAULT: 2, // Right
		STATE_START      : 1,
		STATE_PAUSED     : 2,
		STATE_PLAYING    : 3,
		STATE_END        : 4
	};

	var container, config, state, board, snake, scoreboard, view, controller;

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
				matrix[r][c] = value || null;
		}

		// Retrieve the point specified at (row, col). Throw error
		// if (row, col) is not within bounds of the matrix.
		this.at = function(row, col) {
			if (row < 0 || row >= this.rows ||
				col < 0 || col >= this.cols)
				throw "Matrix point out of bounds";
			return matrix[row][col];
		}
	}

	/**
	  * Game board class.
	  */
	function Board(width, height) {
		this.EMPTY_CELL = 0;
		var grid = new Matrix(height, width, this.EMPTY_CELL);


		// Check if point is contained within game board
		this.isValidPoint = function(point) {
			try {
				grid.at(point);
			}
			catch (err) {
				return false;
			}
			return true;
		}

		// Return board value at specified point. Throw error if no point
		// is specified or argument is not of type Point.
		this.at = function(point) {
			if (!point || !(point instanceof Point))
				throw "'point' must be instance of Point in Board.at(point)";
			return grid.at(point.y, point.x);
		}
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
		console.log(snakeId);
		this.length = 1;

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
		// direction. The point should already be checked for validity
		// by the game engine before calling the move() function.
		this.move = function() {
			head.movePoint(heading);
			this.length++;
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

		this.init = function() {
			insertScoreboard();
			insertBoard();
			this.renderState(constants.STATE_START);
		}

		// Render specified state. Throw error if invalid state is specified.
		this.renderState = function(state) {
			if (state == constants.STATE_START)
				renderStartState();
			else if (state == constants.STATE_END)
				renderEndState();
			else if (state == constants.STATE_PAUSED)
				renderPauseState();
			else if (state == constants.STATE_PLAYING)
				renderPlayState();
			else
				throw "Cannot render state: invalid state";
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
					$row.append('<td id="b' + r.toString() + c.toString() +'" />');
				}
				$row.appendTo($board);
			}
			$board.appendTo($parentElem);
		}

		function renderStartState() {
			var $startOverlay = $('<div class="overlay" id="game-overlay" />');
			var $overlayContent = $('<div class="overlay-wrapper">' +
				'<div class="overlay-bg vertically-center">' +
				'<div class="overlay-content text-center vertically-center">' +
				'<p class="title">Text</p>' +
				'<button class="">Start Game</button>' +
				'</div></div></div>');
			$overlayContent.appendTo($startOverlay);
			$startOverlay.appendTo($parentElem);
		}

		function renderEndState() {
			
		}

		function renderPauseState() {

		}

		function renderPlayState() {

		}
	}

	/**
	  * Controller class responsible for running the game and handling user input.
	  */
	function Controller() {
		var intervalHandle;

		this.init = function() {

		}

		this.startGame = function() {

		}

		this.pauseGame = function() {

		}

		this.resumeGame = function() {

		}

		this.endGame = function() {

		}

		this.calculateFrame = function() {

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