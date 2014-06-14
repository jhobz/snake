/**
  * Wrapper object for game. Used to separate game from global namespace.
  *
  * @param containerId id of element within which to render game
  * @param userConfig user override of configuration options
  */
function SnakeGame(containerId, userConfig) {

	// Default configuration options
	var defaults = {
		game_width   : 30,
		game_height  : 30,
		board_color  : "black",
		snake_color  : "white",
		interval     : 100 // milliseconds
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

	// Global variables used across the application
	var container, config, state, board, snake, scoreboard, view, controller;

	container = $(containerId);
	config = userConfig ? merge(defaults, userConfig) : defaults;

	// Initialization function
	this.init = function() {
		state      = constants.STATE_START;
		board      = new Board(config.game_width, config.game_height);
		scoreboard = new Scoreboard();
		snake      = new Snake();
		view       = new View();
		controller = new Controller();
		controller.init();
	}

	/**
	  * Simple matrix class to be utilized by game board.
	  *
	  * @param rows number of rows
	  * @param cols number of columns
	  * @param value initial value of cells
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
	}

	/**
	  * Game board class.
	  *
	  * @param width width of game grid
	  * @param height height of game grid
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
	}

	/**
	  * Point class for game board.
	  *
	  * @param x horizontal coordinate (from left) in game grid
	  * @param y vertical coordinate (from top) in game grid
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
	  *
	  * @param origin start point of snake (Point type)
	  * @param direction initial heading of snake
	  */
	function Snake(origin, direction) {
		var head = tail = origin instanceof Point ? origin : new Point(0, 0);
		var heading = direction || constants.DIRECTION_DEFAULT;
		var snakeId = this.generateId();
		var length = 1;
		this.color = config.snake_color;

		if (board.isFreeSpace(head))
			board.set(head, snakeId);

		// Attempt to change the heading of the snake. Return true if the heading
		// was changed. Return false if the direction cannot be changed (if the snake
		// is against the wall or an invalid direction is specified).
		this.changeDirection = function(dir) {
			// Prevent the snake from performing an about-face
			if (dir / heading != 1 && dir / heading != -1) {
				var newPoint = head.nextPoint(dir);
				if (board.isValidPoint(newPoint)) {
					heading = dir;
					return true;
				}
				return false;
			}
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

		this.getPoint = function() {
			return head;
		}
	}
	/**
	  * Persistent id used to identify individual snakes on the game board.
	  */
	Snake.prototype.id = 1;
	Snake.prototype.generateId = function() {
		return Snake.prototype.id++;
	}

	/**
	  * Data model for handling current score and table of top 10 scores.
	  *
	  * Note: Ideally, a PriorityQueue would be used to keep track of the top
	  *       scores, but with a number as small as 10 and in an application of
	  *       this size, it is more efficient to simply use and sort an array than
	  *       create our own version of a PriorityQueue.
	  */
	function Scoreboard() {
		this.score     = 0;
		this.highscore = 0;
		this.topscores = [];

		// Load high scores from local storage (if they exist).
		this.loadScores = function() {
			// Top scores are saved in order: [ { name: INITIALS, score: SCORE }, ... ]
			if (localStorage && localStorage.getItem('topscores')) {
				this.topscores = JSON.parse(localStorage.getItem('topscores'));
				this.highscore = this.topscores[0].score;
			}
		}

		// Save new high scores to local storage with specified initials
		// for current score. Issue a warning if unable to access localStorage.
		this.saveScores = function(initials) {
			if (localStorage) {
				this.topscores.push({
					name: initials,
					score: this.score
				});
				this.topscores.sort(comparator);

				if (this.topscores.length > 10)
					this.topscores.pop();

				localStorage.setItem('topscores', JSON.stringify(this.topscores));
			}
			else {
				console.warn('Local storage not found, scores will not be saved.');
			}
		}

		// Update scoreboard with specified score, replacing high score if applicable.
		this.updateScore = function(value) {
			this.score = value;
			if (value > this.highscore)
				this.highscore = value;
		}

		// Check if specified score is in top ten scores.
		this.isTopScore = function(value) {
			if (this.topscores.length < 10)
				return true;
			if (value > this.topscores[9].score)
				return true;
			return false;
		}
		
		// Compare function passed to Array.sort() to sort by highest score.
		function comparator(a, b) {
			return b.score - a.score;
		}
	}

	/**
	  * View class responsible for adding elements to the DOM and changing states.
	  */
	function View() {
		var $parentElem = container;
		var $board, $score, $hscore, $hst;
		var $overlayContent;
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
		// Wrapper to exclude high scores table from overlay
		var $gameWrapper = $('<div class="game-wrapper" />').appendTo($parentElem);

		// Initialization function
		this.init = function() {
			insertScoreboard();
			insertBoard();
			insertScoreTable();
			this.renderHighScores(scoreboard.topscores);
			this.renderState();
		}

		// Render current state. Throw error if invalid state is specified.
		this.renderState = function() {
			if (state == constants.STATE_START)
				$.proxy(renderStartState, this)();
			else if (state == constants.STATE_END)
				$.proxy(renderEndState, this)();
			else if (state == constants.STATE_PLAYING)
				$.proxy(renderPlayState, this)();
			else
				throw "Cannot render state: invalid state";
		}

		// Render current frame during play state.
		this.renderFrame = function() {
			if (state == constants.STATE_PLAYING) {
				for (var r = 0; r < config.game_height; r++)
					for (var c = 0; c < config.game_width; c++)
						if (board.at(new Point(c, r)) == snake.getId())
							$('#' + r + 'x' + c).css('background', snake.color);
				$score.text('Score: ' + scoreboard.score);
				$hscore.text('High Score: ' + scoreboard.highscore);
			}
		}

		// Render table of specified scores.
		this.renderHighScores = function(scores) {
			if ($hst.find('tbody').length > 0)
				$hst.find('tbody').remove();
			for (var i = 0; i < scores.length; i++) {
				$hst.append('<tr><td>' + (i + 1) + '</td><td>' + scores[i].name +
							'<td>' + scores[i].score + '</td></tr>');
			}
			for (var i = scores.length; i < 10; i++) {
				$hst.append('<tr><td>' + (i + 1) + '</td><td>---</td><td>0</td></tr>');
			}
		}

		// Add scoreboard elements to $gameWrapper.
		function insertScoreboard() {
			var $sb = $('<div class="scoreboard text-center" id="game-sb">' +
						'<span class="hidden-xs">Snake</span></div>');
			$score  = $('<div class="score vertically-center pull-left" ' +
						'id="game-sb-score">Score: ' + scoreboard.score + '</div>');
			$hscore = $('<div class="score vertically-center pull-right" ' +
						'id="game-sb-hscore">High Score: ' + scoreboard.highscore + '</div>');
			$sb.append($score).append($hscore);
			$sb.appendTo($gameWrapper);
		}

		// Add board elements to $gameWrapper.
		function insertBoard() {
			$board = $('<table class="board" id="game-board" />');
			$board.css('background-color', config.board_color);
			for (var r = 0; r < config.game_height; r++) {
				var $row = $('<tr />');
				for (var c = 0; c < config.game_width; c++) {
					$row.append('<td id="' + r + 'x' + c +'" />');
				}
				$row.appendTo($board);
			}
			$board.appendTo($gameWrapper);
		}

		// Add high scores table elements to $parentElem.
		function insertScoreTable() {
			var $hstContainer = $('<div class="scoretable-container">' +
								    '<div class="title">High Scores</div>' +
								  '</div>');
			$hst = $('<table class="table scoretable" id="game-scoretable"><thead>' +
					 '<tr><th>#</th><th>Name</th><th>Score</th></tr></thead></table>');
			$hst.appendTo($hstContainer);
			$hstContainer.appendTo($parentElem);
		}

		// Render overlay with start information.
		function renderStartState() {
			$overlayContent = $(
				'<p class="title">simple snake</p>' +
				'<p>Use arrow keys or tap to control</p>' +
				'<button type="button" class="btn btn-primary btn-lg"' +
				        'id="game-start-btn">Start Game</button>'
			);
			
			$overlayContent.appendTo($overlay.find('div:only-child:last'));
			$overlay.appendTo($gameWrapper);
		}

		// Render overlay with game over information.
		function renderEndState() {
			var $btn = $overlay.find('#game-start-btn').detach();
			$overlay.find('div:only-child:last').children().detach();
			$overlayContent = $('<p class="title">game over</p>' +
								'<p>Score: '+ scoreboard.score + '</p>');
			$overlayContent.appendTo($overlay.find('div:only-child:last'));

			if (scoreboard.isTopScore(scoreboard.score)) {
				$('<p>New high score!<br><label for="game-highscoreInput">Enter initials:</label>' +
				  '<input type="text" id="game-highscoreInput" value="AAA" maxlength="3"><br>' +
				  '<input type="submit" id="game-highscoreSubmit" ' +
				  					   'class="btn btn-default btn-sm" value="Submit"></p>')
					.appendTo($overlay.find('div:only-child:last'));
			}

			$btn.text('Play Again').appendTo($overlay.find('div:only-child:last'));

			$overlay.appendTo($gameWrapper);
		}

		// Remove overlay and reset game board to first frame.
		function renderPlayState() {
			$('#game-board td').css('background-color', config.board_color);
			$overlay.detach();
			this.renderFrame();
		}
	}

	/**
	  * Controller class responsible for running the game and handling user input.
	  */
	function Controller() {
		var intervalHandle, listening, direction, played;

		// Initialization function
		this.init = function() {
			listening = played = false;
			direction = snake.getDirection();

			scoreboard.loadScores();
			view.init();

			$('#game-start-btn').click($.proxy(this.startGame, this));
		}

		// Start game by setting state and async function.
		this.startGame = function() {
			if (played)
				this.resetGame();
			state = constants.STATE_PLAYING;
			view.renderState();
			startListening();
			intervalHandle = setInterval($.proxy(this.playFrame, this), config.interval);
		}

		// Reset game to initial state.
		this.resetGame = function() {
			board = new Board(config.game_width, config.game_height);
			snake = new Snake();
			direction = snake.getDirection();
		}

		// End game by clearing handlers and setting state.
		this.endGame = function() {
			clearInterval(intervalHandle);
			stopListening();
			state = constants.STATE_END;
			played = true;
			view.renderState();
			$('#game-highscoreSubmit').one('click', function(e) {
				e.preventDefault();
				scoreboard.saveScores($('#game-highscoreInput').val());
				$(this).closest('p').text('Score saved!');
				view.renderHighScores(scoreboard.topscores);
			});
		}

		// Handle game updates for each frame.
		this.playFrame = function() {
			if (direction != snake.getDirection()) {
				// Snake will not turn directly into wall if lined up against one.
				// This is to prevent unnatural cases where the user might not
				// understand how they lost since there is no visual feedback.
				if(!snake.changeDirection(direction))
					direction = snake.getDirection();
			}
			
			// Game continues if snake makes a valid move
			if (snake.move()) {
				scoreboard.updateScore(snake.getLength());
				view.renderFrame();
			}
			else {
				this.endGame();
			}
		}

		// Bind key and touch listeners.
		function startListening() {
			if (!listening) {
				$(window).keydown(keyPressed);
				$(window).on('touchstart', keyPressed);
				listening = true;
			}
		}

		// Unbind key and touch listeners.
		function stopListening() {
			if (listening) {
				$(window).off('keydown', keyPressed);
				$(window).off('touchstart', keyPressed)
				listening = false;
			}
		}

		// Handle key and touch input to control snake.
		function keyPressed(e) {
			if (e.keyCode) {
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
				e.preventDefault();
			}
			else { // touchevent
				var spoint   = snake.getPoint();
				var offset = $('#' + spoint.y + 'x' + spoint.x).offset();
				var touch = e.originalEvent.touches[0];
				
				// Determine new direction
				if (direction == constants.DIRECTION_LEFT ||
					direction == constants.DIRECTION_RIGHT) {
					if (touch.pageY - offset.top <= 0)
						direction = constants.DIRECTION_UP;
					else
						direction = constants.DIRECTION_DOWN;
				}
				else {
					if (touch.pageX - offset.left <= 0)
						direction = constants.DIRECTION_LEFT;
					else
						direction = constants.DIRECTION_RIGHT;
				}
			}
		}
	}

	// Helper function used to merge default and configuration objects.
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
}