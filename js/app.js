/**
  * Wrapper object for game. Used to separate game from global namespace.
  */
function SnakeGame(containerId, config) {

	var defaults = {
		GAME_WIDTH   : 30,
		GAME_HEIGHT  : 30,
		SCREEN_WIDTH : 750,
		SCREEN_HEIGHT: 750
	};

	var constants = {
		DIRECTION_UP     : 1,
		DIRECTION_RIGHT  : 2,
		DIRECTION_DOWN   : -1,
		DIRECTION_LEFT   : -2,
		DIRECTION_DEFAULT: 2,
		STATE_START      : 1,
		STATE_PAUSED     : 2,
		STATE_PLAYING    : 3,
		STATE_END        : 4
	};

	var container = $(containerId);
	var config = config ? merge(defaults, config) : defaultConfig;

	this.CELL_WIDTH  = config.SCREEN_WIDTH / config.GAME_WIDTH;
	this.CELL_HEIGHT = config.SCREEN_HEIGHT / config.GAME_HEIGHT;

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

	var board = new Board(config.GAME_WIDTH, config.GAME_HEIGHT);

	/**
	  * Point class for game board.
	  */
	function Point(x, y) {
		this.x = x;
		this.y = y;
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