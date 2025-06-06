class Ghost {
  constructor(
    scaledTileSize, mazeArray, pacman, name, level, characterUtil, blinky,
  ) {
    this.scaledTileSize = scaledTileSize;
    this.mazeArray = mazeArray;
    this.pacman = pacman;
    this.name = name;
    this.level = level;
    this.characterUtil = characterUtil;
    this.blinky = blinky;
    this.animationTarget = document.getElementById(name);

    this.reset();
  }

  /**
   * Rests the character to its default state
   * @param {Boolean} fullGameReset
   */
  reset(fullGameReset) {
    if (fullGameReset) {
      delete this.defaultSpeed;
      delete this.cruiseElroy;
    }

    this.setDefaultMode();
    this.setMovementStats(this.pacman, this.name, this.level);
    this.setSpriteAnimationStats();
    this.setStyleMeasurements(this.scaledTileSize, this.spriteFrames);
    this.setDefaultPosition(this.scaledTileSize, this.name);
    this.setSpriteSheet(this.name, this.direction, this.mode);
  }

  /**
   * Sets the default mode and idleMode behavior
   */
  setDefaultMode() {
    this.allowCollision = true;
    this.defaultMode = 'scatter';
    this.mode = 'scatter';
    if (this.name !== 'blinky') {
      this.idleMode = 'idle';
    }
  }

  /**
   * Sets various properties related to the ghost's movement
   * @param {Object} pacman - Pacman's speed is used as the base for the ghosts' speeds
   * @param {('inky'|'blinky'|'pinky'|'clyde')} name - The name of the current ghost
   */
  setMovementStats(pacman, name, level) {
    const pacmanSpeed = pacman.velocityPerMs;
    const levelAdjustment = level / 100;

    this.slowSpeed = pacmanSpeed * (0.75 + levelAdjustment);
    this.mediumSpeed = pacmanSpeed * (0.875 + levelAdjustment);
    this.fastSpeed = pacmanSpeed * (1 + levelAdjustment);

    if (!this.defaultSpeed) {
      this.defaultSpeed = this.slowSpeed;
    }

    this.scaredSpeed = pacmanSpeed * 0.5;
    this.transitionSpeed = pacmanSpeed * 0.4;
    this.eyeSpeed = pacmanSpeed * 2;

    this.velocityPerMs = this.defaultSpeed;
    this.moving = false;

    switch (name) {
      case 'blinky':
        this.defaultDirection = this.characterUtil.directions.left;
        break;
      case 'pinky':
        this.defaultDirection = this.characterUtil.directions.down;
        break;
      case 'inky':
        this.defaultDirection = this.characterUtil.directions.up;
        break;
      case 'clyde':
        this.defaultDirection = this.characterUtil.directions.up;
        break;
      default:
        this.defaultDirection = this.characterUtil.directions.left;
        break;
    }
    this.direction = this.defaultDirection;
  }

  /**
   * Sets values pertaining to the ghost's spritesheet animation
   */
  setSpriteAnimationStats() {
    this.display = true;
    this.loopAnimation = true;
    this.animate = true;
    this.msBetweenSprites = 250;
    this.msSinceLastSprite = 0;
    this.spriteFrames = 2;
    this.backgroundOffsetPixels = 0;
    this.animationTarget.style.backgroundPosition = '0px 0px';
  }

  /**
   * Sets css property values for the ghost
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @param {number} spriteFrames - The number of frames in the ghost's spritesheet
   */
  setStyleMeasurements(scaledTileSize, spriteFrames) {
    // The ghosts are the size of 2x2 game tiles.
    this.measurement = scaledTileSize * 2;

    this.animationTarget.style.height = `${this.measurement}px`;
    this.animationTarget.style.width = `${this.measurement}px`;
    const bgSize = this.measurement * spriteFrames;
    this.animationTarget.style.backgroundSize = `${bgSize}px`;
  }

  /**
   * Sets the default position and direction for the ghosts at the game's start
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @param {('inky'|'blinky'|'pinky'|'clyde')} name - The name of the current ghost
   */
  setDefaultPosition(scaledTileSize, name) {
    switch (name) {
      case 'blinky':
        this.defaultPosition = {
          top: scaledTileSize * 10.5,
          left: scaledTileSize * 13,
        };
        break;
      case 'pinky':
        this.defaultPosition = {
          top: scaledTileSize * 13.5,
          left: scaledTileSize * 13,
        };
        break;
      case 'inky':
        this.defaultPosition = {
          top: scaledTileSize * 13.5,
          left: scaledTileSize * 11,
        };
        break;
      case 'clyde':
        this.defaultPosition = {
          top: scaledTileSize * 13.5,
          left: scaledTileSize * 15,
        };
        break;
      default:
        this.defaultPosition = {
          top: 0,
          left: 0,
        };
        break;
    }
    this.position = Object.assign({}, this.defaultPosition);
    this.oldPosition = Object.assign({}, this.position);
    this.animationTarget.style.top = `${this.position.top}px`;
    this.animationTarget.style.left = `${this.position.left}px`;
  }

  /**
   * Chooses a movement Spritesheet depending upon direction
   * @param {('inky'|'blinky'|'pinky'|'clyde')} name - The name of the current ghost
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   */
  setSpriteSheet(name, direction, mode) {
    let emotion = '';
    if (this.defaultSpeed !== this.slowSpeed) {
      emotion = (this.defaultSpeed === this.mediumSpeed)
        ? '_annoyed' : '_angry';
    }

    if (mode === 'scared') {
      this.animationTarget.style.backgroundImage = 'url(app/style/graphics/'
        + `spriteSheets/characters/ghosts/scared_${this.scaredColor}.svg)`;
    } else if (mode === 'eyes') {
      this.animationTarget.style.backgroundImage = 'url(app/style/graphics/'
        + `spriteSheets/characters/ghosts/eyes_${direction}.svg)`;
    } else {
      this.animationTarget.style.backgroundImage = 'url(app/style/graphics/'
        + `spriteSheets/characters/ghosts/${name}/${name}_${direction}`
        + `${emotion}.svg)`;
    }
  }

  /**
   * Checks to see if the ghost is currently in the 'tunnels' on the outer edges of the maze
   * @param {({x: number, y: number})} gridPosition - The current x-y position on the 2D Maze Array
   * @returns {Boolean}
   */
  isInTunnel(gridPosition) {
    return (
      gridPosition.y === 14
      && (gridPosition.x < 6 || gridPosition.x > 21)
    );
  }

  /**
   * Checks to see if the ghost is currently in the 'Ghost House' in the center of the maze
   * @param {({x: number, y: number})} gridPosition - The current x-y position on the 2D Maze Array
   * @returns {Boolean}
   */
  isInGhostHouse(gridPosition) {
    return (
      (gridPosition.x > 9 && gridPosition.x < 18)
      && (gridPosition.y > 11 && gridPosition.y < 17)
    );
  }

  /**
   * Checks to see if the tile at the given coordinates of the Maze is an open position
   * @param {Array} mazeArray - 2D array representing the game board
   * @param {number} y - The target row
   * @param {number} x - The target column
   * @returns {(false | { x: number, y: number})} - x-y pair if the tile is free, false otherwise
   */
  getTile(mazeArray, y, x) {
    let tile = false;

    if (mazeArray[y] && mazeArray[y][x] && mazeArray[y][x] !== 'X') {
      tile = {
        x,
        y,
      };
    }

    return tile;
  }

  /**
   * Returns a list of all of the possible moves for the ghost to make on the next turn
   * @param {({x: number, y: number})} gridPosition - The current x-y position on the 2D Maze Array
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {Array} mazeArray - 2D array representing the game board
   * @returns {object}
   */
  determinePossibleMoves(gridPosition, direction, mazeArray) {
    const { x, y } = gridPosition;

    const possibleMoves = {
      up: this.getTile(mazeArray, y - 1, x),
      down: this.getTile(mazeArray, y + 1, x),
      left: this.getTile(mazeArray, y, x - 1),
      right: this.getTile(mazeArray, y, x + 1),
    };

    // Ghosts are not allowed to turn around at crossroads
    possibleMoves[this.characterUtil.getOppositeDirection(direction)] = false;

    Object.keys(possibleMoves).forEach((tile) => {
      if (possibleMoves[tile] === false) {
        delete possibleMoves[tile];
      }
    });

    return possibleMoves;
  }

  /**
   * Uses the Pythagorean Theorem to measure the distance between a given postion and Pacman
   * @param {({x: number, y: number})} position - An x-y position on the 2D Maze Array
   * @param {({x: number, y: number})} pacman - Pacman's current x-y position on the 2D Maze Array
   * @returns {number}
   */
  calculateDistance(position, pacman) {
    return Math.sqrt(
      ((position.x - pacman.x) ** 2) + ((position.y - pacman.y) ** 2),
    );
  }

  /**
   * Gets a position a number of spaces in front of Pacman's direction
   * @param {({x: number, y: number})} pacmanGridPosition
   * @param {number} spaces
   */
  getPositionInFrontOfPacman(pacmanGridPosition, spaces) {
    const target = Object.assign({}, pacmanGridPosition);
    const pacDirection = this.pacman.direction;
    const propToChange = (pacDirection === 'up' || pacDirection === 'down')
      ? 'y' : 'x';
    const tileOffset = (pacDirection === 'up' || pacDirection === 'left')
      ? (spaces * -1) : spaces;
    target[propToChange] += tileOffset;

    return target;
  }

  /**
   * Determines Pinky's target, which is four tiles in front of Pacman's direction
   * @param {({x: number, y: number})} pacmanGridPosition
   * @returns {({x: number, y: number})}
   */
  determinePinkyTarget(pacmanGridPosition) {
    return this.getPositionInFrontOfPacman(
      pacmanGridPosition, 4,
    );
  }

  /**
   * Determines Inky's target, which is a mirror image of Blinky's position
   * reflected across a point two tiles in front of Pacman's direction.
   * Example @ app\style\graphics\spriteSheets\references\inky_target.png
   * @param {({x: number, y: number})} pacmanGridPosition
   * @returns {({x: number, y: number})}
   */
  determineInkyTarget(pacmanGridPosition) {
    const blinkyGridPosition = this.characterUtil.determineGridPosition(
      this.blinky.position, this.scaledTileSize,
    );
    const pivotPoint = this.getPositionInFrontOfPacman(
      pacmanGridPosition, 2,
    );
    return {
      x: pivotPoint.x + (pivotPoint.x - blinkyGridPosition.x),
      y: pivotPoint.y + (pivotPoint.y - blinkyGridPosition.y),
    };
  }

  /**
   * Clyde targets Pacman when the two are far apart, but retreats to the
   * lower-left corner when the two are within eight tiles of each other
   * @param {({x: number, y: number})} gridPosition
   * @param {({x: number, y: number})} pacmanGridPosition
   * @returns {({x: number, y: number})}
   */
  determineClydeTarget(gridPosition, pacmanGridPosition) {
    const distance = this.calculateDistance(gridPosition, pacmanGridPosition);
    return (distance > 8) ? pacmanGridPosition : { x: 0, y: 30 };
  }

  /**
   * Determines the appropriate target for the ghost's AI
   * @param {('inky'|'blinky'|'pinky'|'clyde')} name - The name of the current ghost
   * @param {({x: number, y: number})} gridPosition - The current x-y position on the 2D Maze Array
   * @param {({x: number, y: number})} pacmanGridPosition - x-y position on the 2D Maze Array
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @returns {({x: number, y: number})}
   */
  getTarget(name, gridPosition, pacmanGridPosition, mode) {
    // Ghosts return to the ghost-house after eaten
    if (mode === 'eyes') {
      return { x: 13.5, y: 10 };
    }

    // Ghosts run from Pacman if scared
    if (mode === 'scared') {
      return pacmanGridPosition;
    }

    // Ghosts seek out corners in Scatter mode
    if (mode === 'scatter') {
      switch (name) {
        case 'blinky':
          // Blinky will chase Pacman, even in Scatter mode, if he's in Cruise Elroy form
          return (this.cruiseElroy ? pacmanGridPosition : { x: 27, y: 0 });
        case 'pinky':
          return { x: 0, y: 0 };
        case 'inky':
          return { x: 27, y: 30 };
        case 'clyde':
          return { x: 0, y: 30 };
        default:
          return { x: 0, y: 0 };
      }
    }

    switch (name) {
      // Blinky goes after Pacman's position
      case 'blinky':
        return pacmanGridPosition;
      case 'pinky':
        return this.determinePinkyTarget(pacmanGridPosition);
      case 'inky':
        return this.determineInkyTarget(pacmanGridPosition);
      case 'clyde':
        return this.determineClydeTarget(gridPosition, pacmanGridPosition);
      default:
        // TODO: Other ghosts
        return pacmanGridPosition;
    }
  }

  /**
   * Calls the appropriate function to determine the best move depending on the ghost's name
   * @param {('inky'|'blinky'|'pinky'|'clyde')} name - The name of the current ghost
   * @param {Object} possibleMoves - All of the moves the ghost could choose to make this turn
   * @param {({x: number, y: number})} gridPosition - The current x-y position on the 2D Maze Array
   * @param {({x: number, y: number})} pacmanGridPosition - x-y position on the 2D Maze Array
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @returns {('up'|'down'|'left'|'right')}
   */
  determineBestMove(
    name, possibleMoves, gridPosition, pacmanGridPosition, mode,
  ) {
    let bestDistance = (mode === 'scared') ? 0 : Infinity;
    let bestMove;
    const target = this.getTarget(name, gridPosition, pacmanGridPosition, mode);

    Object.keys(possibleMoves).forEach((move) => {
      const distance = this.calculateDistance(
        possibleMoves[move], target,
      );
      const betterMove = (mode === 'scared')
        ? (distance > bestDistance)
        : (distance < bestDistance);

      if (betterMove) {
        bestDistance = distance;
        bestMove = move;
      }
    });

    return bestMove;
  }

  /**
   * Determines the best direction for the ghost to travel in during the current frame
   * @param {('inky'|'blinky'|'pinky'|'clyde')} name - The name of the current ghost
   * @param {({x: number, y: number})} gridPosition - The current x-y position on the 2D Maze Array
   * @param {({x: number, y: number})} pacmanGridPosition - x-y position on the 2D Maze Array
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {Array} mazeArray - 2D array representing the game board
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @returns {('up'|'down'|'left'|'right')}
   */
  determineDirection(
    name, gridPosition, pacmanGridPosition, direction, mazeArray, mode,
  ) {
    let newDirection = direction;
    const possibleMoves = this.determinePossibleMoves(
      gridPosition, direction, mazeArray,
    );

    if (Object.keys(possibleMoves).length === 1) {
      [newDirection] = Object.keys(possibleMoves);
    } else if (Object.keys(possibleMoves).length > 1) {
      newDirection = this.determineBestMove(
        name, possibleMoves, gridPosition, pacmanGridPosition, mode,
      );
    }

    return newDirection;
  }

  /**
   * Handles movement for idle Ghosts in the Ghost House
   * @param {*} elapsedMs
   * @param {*} position
   * @param {*} velocity
   * @returns {({ top: number, left: number})}
   */
  handleIdleMovement(elapsedMs, position, velocity) {
    const newPosition = Object.assign({}, this.position);

    if (position.y <= 13.5) {
      this.direction = this.characterUtil.directions.down;
    } else if (position.y >= 14.5) {
      this.direction = this.characterUtil.directions.up;
    }

    if (this.idleMode === 'leaving') {
      if (position.x === 13.5 && (position.y > 10.8 && position.y < 11)) {
        this.idleMode = undefined;
        newPosition.top = this.scaledTileSize * 10.5;
        this.direction = this.characterUtil.directions.left;
        window.dispatchEvent(new Event('releaseGhost'));
      } else if (position.x > 13.4 && position.x < 13.6) {
        newPosition.left = this.scaledTileSize * 13;
        this.direction = this.characterUtil.directions.up;
      } else if (position.y > 13.9 && position.y < 14.1) {
        newPosition.top = this.scaledTileSize * 13.5;
        this.direction = (position.x < 13.5)
          ? this.characterUtil.directions.right
          : this.characterUtil.directions.left;
      }
    }

    newPosition[this.characterUtil.getPropertyToChange(this.direction)]
      += this.characterUtil.getVelocity(this.direction, velocity) * elapsedMs;

    return newPosition;
  }

  /**
   * Sets idleMode to 'leaving', allowing the ghost to leave the Ghost House
   */
  endIdleMode() {
    this.idleMode = 'leaving';
  }

  /**
   * Handle the ghost's movement when it is snapped to the x-y grid of the Maze Array
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   * @param {({x: number, y: number})} gridPosition - x-y position during the current frame
   * @param {number} velocity - The distance the character should travel in a single millisecond
   * @param {({x: number, y: number})} pacmanGridPosition - x-y position on the 2D Maze Array
   * @returns {({ top: number, left: number})}
   */
  handleSnappedMovement(elapsedMs, gridPosition, velocity, pacmanGridPosition) {
    const newPosition = Object.assign({}, this.position);

    this.direction = this.determineDirection(
      this.name, gridPosition, pacmanGridPosition, this.direction,
      this.mazeArray, this.mode,
    );
    newPosition[this.characterUtil.getPropertyToChange(this.direction)]
      += this.characterUtil.getVelocity(this.direction, velocity) * elapsedMs;

    return newPosition;
  }

  /**
   * Determines if an eaten ghost is at the entrance of the Ghost House
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @param {({x: number, y: number})} position - x-y position during the current frame
   * @returns {Boolean}
   */
  enteringGhostHouse(mode, position) {
    return (
      mode === 'eyes'
      && position.y === 11
      && (position.x > 13.4 && position.x < 13.6)
    );
  }

  /**
   * Determines if an eaten ghost has reached the center of the Ghost House
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @param {({x: number, y: number})} position - x-y position during the current frame
   * @returns {Boolean}
   */
  enteredGhostHouse(mode, position) {
    return (
      mode === 'eyes'
      && position.x === 13.5
      && (position.y > 13.8 && position.y < 14.2)
    );
  }

  /**
   * Determines if a restored ghost is at the exit of the Ghost House
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @param {({x: number, y: number})} position - x-y position during the current frame
   * @returns {Boolean}
   */
  leavingGhostHouse(mode, position) {
    return (
      mode !== 'eyes'
      && position.x === 13.5
      && (position.y > 10.8 && position.y < 11)
    );
  }

  /**
   * Handles entering and leaving the Ghost House after a ghost is eaten
   * @param {({x: number, y: number})} gridPosition - x-y position during the current frame
   * @returns {({x: number, y: number})}
   */
  handleGhostHouse(gridPosition) {
    const gridPositionCopy = Object.assign({}, gridPosition);

    if (this.enteringGhostHouse(this.mode, gridPosition)) {
      this.direction = this.characterUtil.directions.down;
      gridPositionCopy.x = 13.5;
      this.position = this.characterUtil.snapToGrid(
        gridPositionCopy, this.direction, this.scaledTileSize,
      );
    }

    if (this.enteredGhostHouse(this.mode, gridPosition)) {
      this.direction = this.characterUtil.directions.up;
      gridPositionCopy.y = 14;
      this.position = this.characterUtil.snapToGrid(
        gridPositionCopy, this.direction, this.scaledTileSize,
      );
      this.mode = this.defaultMode;
      window.dispatchEvent(new Event('restoreGhost'));
    }

    if (this.leavingGhostHouse(this.mode, gridPosition)) {
      gridPositionCopy.y = 11;
      this.position = this.characterUtil.snapToGrid(
        gridPositionCopy, this.direction, this.scaledTileSize,
      );
      this.direction = this.characterUtil.directions.left;
    }

    return gridPositionCopy;
  }

  /**
   * Handle the ghost's movement when it is inbetween tiles on the x-y grid of the Maze Array
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   * @param {({x: number, y: number})} gridPosition - x-y position during the current frame
   * @param {number} velocity - The distance the character should travel in a single millisecond
   * @returns {({ top: number, left: number})}
   */
  handleUnsnappedMovement(elapsedMs, gridPosition, velocity) {
    const gridPositionCopy = this.handleGhostHouse(gridPosition);

    const desired = this.characterUtil.determineNewPositions(
      this.position, this.direction, velocity, elapsedMs, this.scaledTileSize,
    );

    if (this.characterUtil.changingGridPosition(
      gridPositionCopy, desired.newGridPosition,
    )) {
      return this.characterUtil.snapToGrid(
        gridPositionCopy, this.direction, this.scaledTileSize,
      );
    }

    return desired.newPosition;
  }

  /**
   * Determines the new Ghost position
   * @param {number} elapsedMs
   * @returns {({ top: number, left: number})}
   */
  handleMovement(elapsedMs) {
    let newPosition;

    const gridPosition = this.characterUtil.determineGridPosition(
      this.position, this.scaledTileSize,
    );
    const pacmanGridPosition = this.characterUtil.determineGridPosition(
      this.pacman.position, this.scaledTileSize,
    );
    const velocity = this.determineVelocity(
      gridPosition, this.mode,
    );

    if (this.idleMode) {
      newPosition = this.handleIdleMovement(
        elapsedMs, gridPosition, velocity,
      );
    } else if (JSON.stringify(this.position) === JSON.stringify(
      this.characterUtil.snapToGrid(
        gridPosition, this.direction, this.scaledTileSize,
      ),
    )) {
      newPosition = this.handleSnappedMovement(
        elapsedMs, gridPosition, velocity, pacmanGridPosition,
      );
    } else {
      newPosition = this.handleUnsnappedMovement(
        elapsedMs, gridPosition, velocity,
      );
    }

    newPosition = this.characterUtil.handleWarp(
      newPosition, this.scaledTileSize, this.mazeArray,
    );

    this.checkCollision(gridPosition, pacmanGridPosition);

    return newPosition;
  }

  /**
   * Changes the defaultMode to chase or scatter, and turns the ghost around
   * if needed
   * @param {('chase'|'scatter')} newMode
   */
  changeMode(newMode) {
    this.defaultMode = newMode;

    const gridPosition = this.characterUtil.determineGridPosition(
      this.position, this.scaledTileSize,
    );

    if ((this.mode === 'chase' || this.mode === 'scatter')
      && !this.cruiseElroy) {
      this.mode = newMode;

      if (!this.isInGhostHouse(gridPosition)) {
        this.direction = this.characterUtil.getOppositeDirection(
          this.direction,
        );
      }
    }
  }

  /**
   * Toggles a scared ghost between blue and white, then updates its spritsheet
   */
  toggleScaredColor() {
    this.scaredColor = (this.scaredColor === 'blue')
      ? 'white' : 'blue';
    this.setSpriteSheet(this.name, this.direction, this.mode);
  }

  /**
   * Sets the ghost's mode to SCARED, turns the ghost around,
   * and changes spritesheets accordingly
   */
  becomeScared() {
    const gridPosition = this.characterUtil.determineGridPosition(
      this.position, this.scaledTileSize,
    );

    if (this.mode !== 'eyes') {
      if (!this.isInGhostHouse(gridPosition) && this.mode !== 'scared') {
        this.direction = this.characterUtil.getOppositeDirection(
          this.direction,
        );
      }
      this.mode = 'scared';
      this.scaredColor = 'blue';
      this.setSpriteSheet(this.name, this.direction, this.mode);
    }
  }

  /**
   * Returns the scared ghost to chase/scatter mode and sets its spritesheet
   */
  endScared() {
    this.mode = this.defaultMode;
    this.setSpriteSheet(this.name, this.direction, this.mode);
  }

  /**
   * Speeds up the ghost (used for Blinky as Pacdots are eaten)
   */
  speedUp() {
    this.cruiseElroy = true;

    if (this.defaultSpeed === this.slowSpeed) {
      this.defaultSpeed = this.mediumSpeed;
    } else if (this.defaultSpeed === this.mediumSpeed) {
      this.defaultSpeed = this.fastSpeed;
    }
  }

  /**
   * Resets defaultSpeed to slow and updates the spritesheet
   */
  resetDefaultSpeed() {
    this.defaultSpeed = this.slowSpeed;
    this.cruiseElroy = false;
    this.setSpriteSheet(this.name, this.direction, this.mode);
  }

  /**
   * Sets a flag to indicate when the ghost should pause its movement
   * @param {Boolean} newValue
   */
  pause(newValue) {
    this.paused = newValue;
  }

  /**
   * Checks if the ghost contacts Pacman - starts the death sequence if so
   * @param {({x: number, y: number})} position - An x-y position on the 2D Maze Array
   * @param {({x: number, y: number})} pacman - Pacman's current x-y position on the 2D Maze Array
   */
  checkCollision(position, pacman) {
    if (this.calculateDistance(position, pacman) < 1
      && this.mode !== 'eyes'
      && this.allowCollision) {
      if (this.mode === 'scared') {
        window.dispatchEvent(new CustomEvent('eatGhost', {
          detail: {
            ghost: this,
          },
        }));
        this.mode = 'eyes';
      } else {
        window.dispatchEvent(new Event('deathSequence'));
      }
    }
  }

  /**
   * Determines the appropriate speed for the ghost
   * @param {({x: number, y: number})} position - An x-y position on the 2D Maze Array
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @returns {number}
   */
  determineVelocity(position, mode) {
    if (mode === 'eyes') {
      return this.eyeSpeed;
    }

    if (this.paused) {
      return 0;
    }

    if (this.isInTunnel(position) || this.isInGhostHouse(position)) {
      return this.transitionSpeed;
    }

    if (mode === 'scared') {
      return this.scaredSpeed;
    }

    return this.defaultSpeed;
  }

  /**
   * Updates the css position, hides if there is a stutter, and animates the spritesheet
   * @param {number} interp - The animation accuracy as a percentage
   */
  draw(interp) {
    const newTop = this.characterUtil.calculateNewDrawValue(
      interp, 'top', this.oldPosition, this.position,
    );
    const newLeft = this.characterUtil.calculateNewDrawValue(
      interp, 'left', this.oldPosition, this.position,
    );
    this.animationTarget.style.top = `${newTop}px`;
    this.animationTarget.style.left = `${newLeft}px`;

    this.animationTarget.style.visibility = this.display
      ? this.characterUtil.checkForStutter(this.position, this.oldPosition)
      : 'hidden';

    const updatedProperties = this.characterUtil.advanceSpriteSheet(this);
    this.msSinceLastSprite = updatedProperties.msSinceLastSprite;
    this.animationTarget = updatedProperties.animationTarget;
    this.backgroundOffsetPixels = updatedProperties.backgroundOffsetPixels;
  }

  /**
   * Handles movement logic for the ghost
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   */
  update(elapsedMs) {
    this.oldPosition = Object.assign({}, this.position);

    if (this.moving) {
      this.position = this.handleMovement(elapsedMs);
      this.setSpriteSheet(this.name, this.direction, this.mode);
      this.msSinceLastSprite += elapsedMs;
    }
  }
}


class Pacman {
  constructor(scaledTileSize, mazeArray, characterUtil) {
    this.scaledTileSize = scaledTileSize;
    this.mazeArray = mazeArray;
    this.characterUtil = characterUtil;
    this.animationTarget = document.getElementById('pacman');
    this.pacmanArrow = document.getElementById('pacman-arrow');

    this.reset();
  }

  /**
   * Rests the character to its default state
   */
  reset() {
    this.setMovementStats(this.scaledTileSize);
    this.setSpriteAnimationStats();
    this.setStyleMeasurements(this.scaledTileSize, this.spriteFrames);
    this.setDefaultPosition(this.scaledTileSize);
    this.setSpriteSheet(this.direction);
    this.pacmanArrow.style.backgroundImage = 'url(app/style/graphics/'
      + `spriteSheets/characters/pacman/arrow_${this.direction}.svg)`;
  }

  /**
   * Sets various properties related to Pacman's movement
   * @param {number} scaledTileSize - The dimensions of a single tile
   */
  setMovementStats(scaledTileSize) {
    this.velocityPerMs = this.calculateVelocityPerMs(scaledTileSize);
    this.desiredDirection = this.characterUtil.directions.left;
    this.direction = this.characterUtil.directions.left;
    this.moving = false;
  }

  /**
   * Sets values pertaining to Pacman's spritesheet animation
   */
  setSpriteAnimationStats() {
    this.specialAnimation = false;
    this.display = true;
    this.animate = true;
    this.loopAnimation = true;
    this.msBetweenSprites = 50;
    this.msSinceLastSprite = 0;
    this.spriteFrames = 4;
    this.backgroundOffsetPixels = 0;
    this.animationTarget.style.backgroundPosition = '0px 0px';
  }

  /**
   * Sets css property values for Pacman and Pacman's Arrow
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @param {number} spriteFrames - The number of frames in Pacman's spritesheet
   */
  setStyleMeasurements(scaledTileSize, spriteFrames) {
    this.measurement = scaledTileSize * 2;

    this.animationTarget.style.height = `${this.measurement}px`;
    this.animationTarget.style.width = `${this.measurement}px`;
    this.animationTarget.style.backgroundSize = `${
      this.measurement * spriteFrames
    }px`;

    this.pacmanArrow.style.height = `${this.measurement * 2}px`;
    this.pacmanArrow.style.width = `${this.measurement * 2}px`;
    this.pacmanArrow.style.backgroundSize = `${this.measurement * 2}px`;
  }

  /**
   * Sets the default position and direction for Pacman at the game's start
   * @param {number} scaledTileSize - The dimensions of a single tile
   */
  setDefaultPosition(scaledTileSize) {
    this.defaultPosition = {
      top: scaledTileSize * 22.5,
      left: scaledTileSize * 13,
    };
    this.position = Object.assign({}, this.defaultPosition);
    this.oldPosition = Object.assign({}, this.position);
    this.animationTarget.style.top = `${this.position.top}px`;
    this.animationTarget.style.left = `${this.position.left}px`;
  }

  /**
   * Calculates how fast Pacman should move in a millisecond
   * @param {number} scaledTileSize - The dimensions of a single tile
   */
  calculateVelocityPerMs(scaledTileSize) {
    // In the original game, Pacman moved at 11 tiles per second.
    const velocityPerSecond = scaledTileSize * 11;
    return velocityPerSecond / 1000;
  }

  /**
   * Chooses a movement Spritesheet depending upon direction
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   */
  setSpriteSheet(direction) {
    this.animationTarget.style.backgroundImage = 'url(app/style/graphics/'
      + `spriteSheets/characters/pacman/pacman_${direction}.svg)`;
  }

  prepDeathAnimation() {
    this.loopAnimation = false;
    this.msBetweenSprites = 125;
    this.spriteFrames = 12;
    this.specialAnimation = true;
    this.backgroundOffsetPixels = 0;
    const bgSize = this.measurement * this.spriteFrames;
    this.animationTarget.style.backgroundSize = `${bgSize}px`;
    this.animationTarget.style.backgroundImage = 'url(app/style/'
      + 'graphics/spriteSheets/characters/pacman/pacman_death.svg)';
    this.animationTarget.style.backgroundPosition = '0px 0px';
    this.pacmanArrow.style.backgroundImage = '';
  }

  /**
   * Changes Pacman's desiredDirection, updates the PacmanArrow sprite, and sets moving to true
   * @param {Event} e - The keydown event to evaluate
   * @param {Boolean} startMoving - If true, Pacman will move upon key press
   */
  changeDirection(newDirection, startMoving) {
    this.desiredDirection = newDirection;
    this.pacmanArrow.style.backgroundImage = 'url(app/style/graphics/'
      + `spriteSheets/characters/pacman/arrow_${this.desiredDirection}.svg)`;

    if (startMoving) {
      this.moving = true;
    }
  }

  /**
   * Updates the position of the leading arrow in front of Pacman
   * @param {({top: number, left: number})} position - Pacman's position during the current frame
   * @param {number} scaledTileSize - The dimensions of a single tile
   */
  updatePacmanArrowPosition(position, scaledTileSize) {
    this.pacmanArrow.style.top = `${position.top - scaledTileSize}px`;
    this.pacmanArrow.style.left = `${position.left - scaledTileSize}px`;
  }

  /**
   * Handle Pacman's movement when he is snapped to the x-y grid of the Maze Array
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   * @returns {({ top: number, left: number})}
   */
  handleSnappedMovement(elapsedMs) {
    const desired = this.characterUtil.determineNewPositions(
      this.position, this.desiredDirection, this.velocityPerMs,
      elapsedMs, this.scaledTileSize,
    );
    const alternate = this.characterUtil.determineNewPositions(
      this.position, this.direction, this.velocityPerMs,
      elapsedMs, this.scaledTileSize,
    );

    if (this.characterUtil.checkForWallCollision(
      desired.newGridPosition, this.mazeArray, this.desiredDirection,
    )) {
      if (this.characterUtil.checkForWallCollision(
        alternate.newGridPosition, this.mazeArray, this.direction,
      )) {
        this.moving = false;
        return this.position;
      }
      return alternate.newPosition;
    }
    this.direction = this.desiredDirection;
    this.setSpriteSheet(this.direction);
    return desired.newPosition;
  }

  /**
   * Handle Pacman's movement when he is inbetween tiles on the x-y grid of the Maze Array
   * @param {({x: number, y: number})} gridPosition - x-y position during the current frame
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   * @returns {({ top: number, left: number})}
   */
  handleUnsnappedMovement(gridPosition, elapsedMs) {
    const desired = this.characterUtil.determineNewPositions(
      this.position, this.desiredDirection, this.velocityPerMs,
      elapsedMs, this.scaledTileSize,
    );
    const alternate = this.characterUtil.determineNewPositions(
      this.position, this.direction, this.velocityPerMs,
      elapsedMs, this.scaledTileSize,
    );

    if (this.characterUtil.turningAround(
      this.direction, this.desiredDirection,
    )) {
      this.direction = this.desiredDirection;
      this.setSpriteSheet(this.direction);
      return desired.newPosition;
    } if (this.characterUtil.changingGridPosition(
      gridPosition, alternate.newGridPosition,
    )) {
      return this.characterUtil.snapToGrid(
        gridPosition, this.direction, this.scaledTileSize,
      );
    }
    return alternate.newPosition;
  }

  /**
   * Updates the css position, hides if there is a stutter, and animates the spritesheet
   * @param {number} interp - The animation accuracy as a percentage
   */
  draw(interp) {
    const newTop = this.characterUtil.calculateNewDrawValue(
      interp, 'top', this.oldPosition, this.position,
    );
    const newLeft = this.characterUtil.calculateNewDrawValue(
      interp, 'left', this.oldPosition, this.position,
    );
    this.animationTarget.style.top = `${newTop}px`;
    this.animationTarget.style.left = `${newLeft}px`;

    this.animationTarget.style.visibility = this.display
      ? this.characterUtil.checkForStutter(this.position, this.oldPosition)
      : 'hidden';
    this.pacmanArrow.style.visibility = this.animationTarget.style.visibility;

    this.updatePacmanArrowPosition(this.position, this.scaledTileSize);

    const updatedProperties = this.characterUtil.advanceSpriteSheet(this);
    this.msSinceLastSprite = updatedProperties.msSinceLastSprite;
    this.animationTarget = updatedProperties.animationTarget;
    this.backgroundOffsetPixels = updatedProperties.backgroundOffsetPixels;
  }

  /**
   * Handles movement logic for Pacman
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   */
  update(elapsedMs) {
    this.oldPosition = Object.assign({}, this.position);

    if (this.moving) {
      const gridPosition = this.characterUtil.determineGridPosition(
        this.position, this.scaledTileSize,
      );

      if (JSON.stringify(this.position) === JSON.stringify(
        this.characterUtil.snapToGrid(
          gridPosition, this.direction, this.scaledTileSize,
        ),
      )) {
        this.position = this.handleSnappedMovement(elapsedMs);
      } else {
        this.position = this.handleUnsnappedMovement(gridPosition, elapsedMs);
      }

      this.position = this.characterUtil.handleWarp(
        this.position, this.scaledTileSize, this.mazeArray,
      );
    }

    if (this.moving || this.specialAnimation) {
      this.msSinceLastSprite += elapsedMs;
    }
  }
}


class GameCoordinator {
  constructor() {
    this.gameUi = document.getElementById('game-ui');
    this.rowTop = document.getElementById('row-top');
    this.mazeDiv = document.getElementById('maze');
    this.mazeImg = document.getElementById('maze-img');
    this.mazeCover = document.getElementById('maze-cover');
    this.pointsDisplay = document.getElementById('points-display');
    this.highScoreDisplay = document.getElementById('high-score-display');
    this.extraLivesDisplay = document.getElementById('extra-lives');
    this.fruitDisplay = document.getElementById('fruit-display');
    this.mainMenu = document.getElementById('main-menu-container');
    this.gameStartButton = document.getElementById('game-start');
    this.pauseButton = document.getElementById('pause-button');
    this.soundButton = document.getElementById('sound-button');
    this.leftCover = document.getElementById('left-cover');
    this.rightCover = document.getElementById('right-cover');
    this.pausedText = document.getElementById('paused-text');
    this.bottomRow = document.getElementById('bottom-row');

    this.mazeArray = [
      ['XXXXXXXXXXXXXXXXXXXXXXXXXXXX'],
      ['XooooooooooooXXooooooooooooX'],
      ['XoXXXXoXXXXXoXXoXXXXXoXXXXoX'],
      ['XOXXXXoXXXXXoXXoXXXXXoXXXXOX'],
      ['XoXXXXoXXXXXoXXoXXXXXoXXXXoX'],
      ['XooooooooooooooooooooooooooX'],
      ['XoXXXXoXXoXXXXXXXXoXXoXXXXoX'],
      ['XoXXXXoXXoXXXXXXXXoXXoXXXXoX'],
      ['XooooooXXooooXXooooXXooooooX'],
      ['XXXXXXoXXXXX XX XXXXXoXXXXXX'],
      ['XXXXXXoXXXXX XX XXXXXoXXXXXX'],
      ['XXXXXXoXX          XXoXXXXXX'],
      ['XXXXXXoXX XXXXXXXX XXoXXXXXX'],
      ['XXXXXXoXX X      X XXoXXXXXX'],
      ['      o   X      X   o      '],
      ['XXXXXXoXX X      X XXoXXXXXX'],
      ['XXXXXXoXX XXXXXXXX XXoXXXXXX'],
      ['XXXXXXoXX          XXoXXXXXX'],
      ['XXXXXXoXX XXXXXXXX XXoXXXXXX'],
      ['XXXXXXoXX XXXXXXXX XXoXXXXXX'],
      ['XooooooooooooXXooooooooooooX'],
      ['XoXXXXoXXXXXoXXoXXXXXoXXXXoX'],
      ['XoXXXXoXXXXXoXXoXXXXXoXXXXoX'],
      ['XOooXXooooooo  oooooooXXooOX'],
      ['XXXoXXoXXoXXXXXXXXoXXoXXoXXX'],
      ['XXXoXXoXXoXXXXXXXXoXXoXXoXXX'],
      ['XooooooXXooooXXooooXXooooooX'],
      ['XoXXXXXXXXXXoXXoXXXXXXXXXXoX'],
      ['XoXXXXXXXXXXoXXoXXXXXXXXXXoX'],
      ['XooooooooooooooooooooooooooX'],
      ['XXXXXXXXXXXXXXXXXXXXXXXXXXXX'],
    ];

    this.maxFps = 120;
    this.tileSize = 8;
    this.scale = this.determineScale(1);
    this.scaledTileSize = this.tileSize * this.scale;
    this.firstGame = true;

    this.movementKeys = {
      // WASD
      87: 'up',
      83: 'down',
      65: 'left',
      68: 'right',

      // Arrow Keys
      38: 'up',
      40: 'down',
      37: 'left',
      39: 'right',
    };

    // Mobile touch trackers
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;

    this.fruitPoints = {
      1: 100,
      2: 300,
      3: 500,
      4: 700,
      5: 1000,
      6: 2000,
      7: 3000,
      8: 5000,
    };

    this.mazeArray.forEach((row, rowIndex) => {
      this.mazeArray[rowIndex] = row[0].split('');
    });

    this.gameStartButton.addEventListener(
      'click',
      this.startButtonClick.bind(this),
    );
    this.pauseButton.addEventListener('click', this.handlePauseKey.bind(this));
    this.soundButton.addEventListener(
      'click',
      this.soundButtonClick.bind(this),
    );

    const head = document.getElementsByTagName('head')[0];
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'build/app.css';

    link.onload = this.preloadAssets.bind(this);

    head.appendChild(link);
    
    this.initializeExperiment();
  }

  initializeExperiment() {
    this.experimentManager = new ExperimentManager();
    this.sessionManager = new SessionManager(this.experimentManager);
    this.progressController = new ProgressController(this.experimentManager, this.sessionManager);
    this.dataManager = new DataManager(this.experimentManager, this.sessionManager);
    this.experimentUI = new ExperimentUI(this.experimentManager);
    this.speedController = new SpeedController();
    this.metricsCollector = new MetricsCollector(this.experimentManager);
    
    // Set cross-references
    this.experimentManager.sessionManager = this.sessionManager;
    this.experimentManager.progressController = this.progressController;
    this.experimentManager.dataManager = this.dataManager;
    
    this.sessionManager.initialize();
    this.progressController.initialize();
    this.dataManager.initialize();
    this.experimentUI.initialize();
    this.bindExperimentEvents();
  }

  bindExperimentEvents() {
    window.addEventListener('experimentSessionStarted', () => {
      if (this.speedController && !this.speedController.isInitialized) {
        this.speedController.initialize(this);
      }
      if (this.metricsCollector && !this.metricsCollector.isInitialized) {
        this.metricsCollector.initialize(this);
      }
      if (this.experimentUI && this.metricsCollector) {
        this.experimentUI.setMetricsCollector(this.metricsCollector);
      }
      
      window.gameCoordinator = this;
    });
  }

  /**
   * Recursive method which determines the largest possible scale the game's graphics can use
   * @param {Number} scale
   */
  determineScale(scale) {
    const availableScreenHeight = Math.min(
      document.documentElement.clientHeight,
      window.innerHeight || 0,
    );
    const availableScreenWidth = Math.min(
      document.documentElement.clientWidth,
      window.innerWidth || 0,
    );
    const scaledTileSize = this.tileSize * scale;

    // The original Pac-Man game leaves 5 tiles of height (3 above, 2 below) surrounding the
    // maze for the UI. See app\style\graphics\spriteSheets\references\mazeGridSystemReference.png
    // for reference.
    const mazeTileHeight = this.mazeArray.length + 5;
    const mazeTileWidth = this.mazeArray[0][0].split('').length;

    if (
      scaledTileSize * mazeTileHeight < availableScreenHeight
      && scaledTileSize * mazeTileWidth < availableScreenWidth
    ) {
      return this.determineScale(scale + 1);
    }

    return scale - 1;
  }

  /**
   * Reveals the game underneath the loading covers and starts gameplay
   */
  startButtonClick() {
    this.leftCover.style.left = '-50%';
    this.rightCover.style.right = '-50%';
    this.mainMenu.style.opacity = 0;
    this.gameStartButton.disabled = true;

    setTimeout(() => {
      this.mainMenu.style.visibility = 'hidden';
    }, 1000);

    this.reset();
    if (this.firstGame) {
      this.firstGame = false;
      this.init();
    }
    this.startGameplay(true);
  }

  /**
   * Toggles the master volume for the soundManager, and saves the preference to storage
   */
  soundButtonClick() {
    const newVolume = this.soundManager.masterVolume === 1 ? 0 : 1;
    this.soundManager.setMasterVolume(newVolume);
    localStorage.setItem('volumePreference', newVolume);
    this.setSoundButtonIcon(newVolume);
  }

  /**
   * Sets the icon for the sound button
   */
  setSoundButtonIcon(newVolume) {
    this.soundButton.innerHTML = newVolume === 0 ? 'volume_off' : 'volume_up';
  }

  /**
   * Displays an error message in the event assets are unable to download
   */
  displayErrorMessage() {
    const loadingContainer = document.getElementById('loading-container');
    const errorMessage = document.getElementById('error-message');
    loadingContainer.style.opacity = 0;
    setTimeout(() => {
      loadingContainer.remove();
      errorMessage.style.opacity = 1;
      errorMessage.style.visibility = 'visible';
    }, 1500);
  }

  /**
   * Load all assets into a hidden Div to pre-load them into memory.
   * There is probably a better way to read all of these file names.
   */
  preloadAssets() {
    return new Promise((resolve) => {
      const loadingContainer = document.getElementById('loading-container');
      const loadingPacman = document.getElementById('loading-pacman');
      const loadingDotMask = document.getElementById('loading-dot-mask');

      const imgBase = 'app/style/graphics/spriteSheets/';
      const imgSources = [
        // Pacman
        `${imgBase}characters/pacman/arrow_down.svg`,
        `${imgBase}characters/pacman/arrow_left.svg`,
        `${imgBase}characters/pacman/arrow_right.svg`,
        `${imgBase}characters/pacman/arrow_up.svg`,
        `${imgBase}characters/pacman/pacman_death.svg`,
        `${imgBase}characters/pacman/pacman_error.svg`,
        `${imgBase}characters/pacman/pacman_down.svg`,
        `${imgBase}characters/pacman/pacman_left.svg`,
        `${imgBase}characters/pacman/pacman_right.svg`,
        `${imgBase}characters/pacman/pacman_up.svg`,

        // Blinky
        `${imgBase}characters/ghosts/blinky/blinky_down_angry.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_down_annoyed.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_down.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_left_angry.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_left_annoyed.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_left.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_right_angry.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_right_annoyed.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_right.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_up_angry.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_up_annoyed.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_up.svg`,

        // Clyde
        `${imgBase}characters/ghosts/clyde/clyde_down.svg`,
        `${imgBase}characters/ghosts/clyde/clyde_left.svg`,
        `${imgBase}characters/ghosts/clyde/clyde_right.svg`,
        `${imgBase}characters/ghosts/clyde/clyde_up.svg`,

        // Inky
        `${imgBase}characters/ghosts/inky/inky_down.svg`,
        `${imgBase}characters/ghosts/inky/inky_left.svg`,
        `${imgBase}characters/ghosts/inky/inky_right.svg`,
        `${imgBase}characters/ghosts/inky/inky_up.svg`,

        // Pinky
        `${imgBase}characters/ghosts/pinky/pinky_down.svg`,
        `${imgBase}characters/ghosts/pinky/pinky_left.svg`,
        `${imgBase}characters/ghosts/pinky/pinky_right.svg`,
        `${imgBase}characters/ghosts/pinky/pinky_up.svg`,

        // Ghosts Common
        `${imgBase}characters/ghosts/eyes_down.svg`,
        `${imgBase}characters/ghosts/eyes_left.svg`,
        `${imgBase}characters/ghosts/eyes_right.svg`,
        `${imgBase}characters/ghosts/eyes_up.svg`,
        `${imgBase}characters/ghosts/scared_blue.svg`,
        `${imgBase}characters/ghosts/scared_white.svg`,

        // Dots
        `${imgBase}pickups/pacdot.svg`,
        `${imgBase}pickups/powerPellet.svg`,

        // Fruit
        `${imgBase}pickups/apple.svg`,
        `${imgBase}pickups/bell.svg`,
        `${imgBase}pickups/cherry.svg`,
        `${imgBase}pickups/galaxian.svg`,
        `${imgBase}pickups/key.svg`,
        `${imgBase}pickups/melon.svg`,
        `${imgBase}pickups/orange.svg`,
        `${imgBase}pickups/strawberry.svg`,

        // Text
        `${imgBase}text/ready.svg`,

        // Points
        `${imgBase}text/100.svg`,
        `${imgBase}text/200.svg`,
        `${imgBase}text/300.svg`,
        `${imgBase}text/400.svg`,
        `${imgBase}text/500.svg`,
        `${imgBase}text/700.svg`,
        `${imgBase}text/800.svg`,
        `${imgBase}text/1000.svg`,
        `${imgBase}text/1600.svg`,
        `${imgBase}text/2000.svg`,
        `${imgBase}text/3000.svg`,
        `${imgBase}text/5000.svg`,

        // Maze
        `${imgBase}maze/maze_blue.svg`,

        // Misc
        'app/style/graphics/extra_life.svg',
      ];

      const audioBase = 'app/style/audio/';
      const audioSources = [
        `${audioBase}game_start.mp3`,
        `${audioBase}pause.mp3`,
        `${audioBase}pause_beat.mp3`,
        `${audioBase}siren_1.mp3`,
        `${audioBase}siren_2.mp3`,
        `${audioBase}siren_3.mp3`,
        `${audioBase}power_up.mp3`,
        `${audioBase}extra_life.mp3`,
        `${audioBase}eyes.mp3`,
        `${audioBase}eat_ghost.mp3`,
        `${audioBase}death.mp3`,
        `${audioBase}fruit.mp3`,
        `${audioBase}dot_1.mp3`,
        `${audioBase}dot_2.mp3`,
      ];

      const totalSources = imgSources.length + audioSources.length;
      this.remainingSources = totalSources;

      loadingPacman.style.left = '0';
      loadingDotMask.style.width = '0';

      Promise.all([
        this.createElements(imgSources, 'img', totalSources, this),
        this.createElements(audioSources, 'audio', totalSources, this),
      ])
        .then(() => {
          loadingContainer.style.opacity = 0;
          resolve();

          setTimeout(() => {
            loadingContainer.remove();
            this.mainMenu.style.opacity = 1;
            this.mainMenu.style.visibility = 'visible';
          }, 1500);
        })
        .catch(this.displayErrorMessage);
    });
  }

  /**
   * Iterates through a list of sources and updates the loading bar as the assets load in
   * @param {String[]} sources
   * @param {('img'|'audio')} type
   * @param {Number} totalSources
   * @param {Object} gameCoord
   * @returns {Promise}
   */
  createElements(sources, type, totalSources, gameCoord) {
    const loadingContainer = document.getElementById('loading-container');
    const preloadDiv = document.getElementById('preload-div');
    const loadingPacman = document.getElementById('loading-pacman');
    const containerWidth = loadingContainer.scrollWidth
      - loadingPacman.scrollWidth;
    const loadingDotMask = document.getElementById('loading-dot-mask');

    const gameCoordRef = gameCoord;

    return new Promise((resolve, reject) => {
      let loadedSources = 0;

      sources.forEach((source) => {
        const element = type === 'img' ? new Image() : new Audio();
        preloadDiv.appendChild(element);

        const elementReady = () => {
          gameCoordRef.remainingSources -= 1;
          loadedSources += 1;
          const percent = 1 - gameCoordRef.remainingSources / totalSources;
          loadingPacman.style.left = `${percent * containerWidth}px`;
          loadingDotMask.style.width = loadingPacman.style.left;

          if (loadedSources === sources.length) {
            resolve();
          }
        };

        if (type === 'img') {
          element.onload = elementReady;
          element.onerror = reject;
        } else {
          element.addEventListener('canplaythrough', elementReady);
          element.onerror = reject;
        }

        element.src = source;

        if (type === 'audio') {
          element.load();
        }
      });
    });
  }

  /**
   * Resets gameCoordinator values to their default states
   */
  reset() {
    this.activeTimers = [];
    this.points = 0;
    this.level = 1;
    this.lives = 2;
    this.extraLifeGiven = false;
    this.remainingDots = 0;
    this.allowKeyPresses = true;
    this.allowPacmanMovement = false;
    this.allowPause = false;
    this.cutscene = true;
    this.highScore = localStorage.getItem('highScore');

    if (this.firstGame) {
      setInterval(() => {
        this.collisionDetectionLoop();
      }, 500);

      this.pacman = new Pacman(
        this.scaledTileSize,
        this.mazeArray,
        new CharacterUtil(this.scaledTileSize),
      );
      this.blinky = new Ghost(
        this.scaledTileSize,
        this.mazeArray,
        this.pacman,
        'blinky',
        this.level,
        new CharacterUtil(this.scaledTileSize),
      );
      this.pinky = new Ghost(
        this.scaledTileSize,
        this.mazeArray,
        this.pacman,
        'pinky',
        this.level,
        new CharacterUtil(this.scaledTileSize),
      );
      this.inky = new Ghost(
        this.scaledTileSize,
        this.mazeArray,
        this.pacman,
        'inky',
        this.level,
        new CharacterUtil(this.scaledTileSize),
        this.blinky,
      );
      this.clyde = new Ghost(
        this.scaledTileSize,
        this.mazeArray,
        this.pacman,
        'clyde',
        this.level,
        new CharacterUtil(this.scaledTileSize),
      );
      this.fruit = new Pickup(
        'fruit',
        this.scaledTileSize,
        13.5,
        17,
        this.pacman,
        this.mazeDiv,
        100,
      );
    }

    this.entityList = [
      this.pacman,
      this.blinky,
      this.pinky,
      this.inky,
      this.clyde,
      this.fruit,
    ];

    this.ghosts = [this.blinky, this.pinky, this.inky, this.clyde];

    this.scaredGhosts = [];
    this.eyeGhosts = 0;

    if (this.firstGame) {
      this.drawMaze(this.mazeArray, this.entityList);
      this.soundManager = new SoundManager();
      this.setUiDimensions();
    } else {
      this.pacman.reset();
      this.ghosts.forEach((ghost) => {
        ghost.reset(true);
      });
      this.pickups.forEach((pickup) => {
        if (pickup.type !== 'fruit') {
          this.remainingDots += 1;
          pickup.reset();
          this.entityList.push(pickup);
        }
      });
    }

    this.pointsDisplay.innerHTML = '00';
    this.highScoreDisplay.innerHTML = this.highScore || '00';
    this.clearDisplay(this.fruitDisplay);

    const volumePreference = parseInt(
      localStorage.getItem('volumePreference') || 1,
      10,
    );
    this.setSoundButtonIcon(volumePreference);
    this.soundManager.setMasterVolume(volumePreference);
  }

  /**
   * Calls necessary setup functions to start the game
   */
  init() {
    this.registerEventListeners();
    this.registerTouchListeners();

    this.gameEngine = new GameEngine(this.maxFps, this.entityList);
    this.gameEngine.start();
  }

  /**
   * Adds HTML elements to draw on the webpage by iterating through the 2D maze array
   * @param {Array} mazeArray - 2D array representing the game board
   * @param {Array} entityList - List of entities to be used throughout the game
   */
  drawMaze(mazeArray, entityList) {
    this.pickups = [this.fruit];

    this.mazeDiv.style.height = `${this.scaledTileSize * 31}px`;
    this.mazeDiv.style.width = `${this.scaledTileSize * 28}px`;
    this.gameUi.style.width = `${this.scaledTileSize * 28}px`;
    this.bottomRow.style.minHeight = `${this.scaledTileSize * 2}px`;
    this.dotContainer = document.getElementById('dot-container');

    mazeArray.forEach((row, rowIndex) => {
      row.forEach((block, columnIndex) => {
        if (block === 'o' || block === 'O') {
          const type = block === 'o' ? 'pacdot' : 'powerPellet';
          const points = block === 'o' ? 10 : 50;
          const dot = new Pickup(
            type,
            this.scaledTileSize,
            columnIndex,
            rowIndex,
            this.pacman,
            this.dotContainer,
            points,
          );

          entityList.push(dot);
          this.pickups.push(dot);
          this.remainingDots += 1;
        }
      });
    });
  }

  setUiDimensions() {
    this.gameUi.style.fontSize = `${this.scaledTileSize}px`;
    this.rowTop.style.marginBottom = `${this.scaledTileSize}px`;
  }

  /**
   * Loop which periodically checks which pickups are nearby Pacman.
   * Pickups which are far away will not be considered for collision detection.
   */
  collisionDetectionLoop() {
    if (this.pacman.position) {
      const maxDistance = this.pacman.velocityPerMs * 750;
      const pacmanCenter = {
        x: this.pacman.position.left + this.scaledTileSize,
        y: this.pacman.position.top + this.scaledTileSize,
      };

      // Set this flag to TRUE to see how two-phase collision detection works!
      const debugging = false;

      this.pickups.forEach((pickup) => {
        pickup.checkPacmanProximity(maxDistance, pacmanCenter, debugging);
      });
    }
  }

  /**
   * Displays "Ready!" and allows Pacman to move after a brief delay
   * @param {Boolean} initialStart - Special condition for the game's beginning
   */
  startGameplay(initialStart) {
    if (initialStart) {
      this.soundManager.play('game_start');
    }

    this.scaredGhosts = [];
    this.eyeGhosts = 0;
    this.allowPacmanMovement = false;

    const left = this.scaledTileSize * 11;
    const top = this.scaledTileSize * 16.5;
    const duration = initialStart ? 4500 : 2000;
    const width = this.scaledTileSize * 6;
    const height = this.scaledTileSize * 2;

    this.displayText({ left, top }, 'ready', duration, width, height);
    this.updateExtraLivesDisplay();

    new Timer(() => {
      this.allowPause = true;
      this.cutscene = false;
      this.soundManager.setCutscene(this.cutscene);
      this.soundManager.setAmbience(this.determineSiren(this.remainingDots));

      this.allowPacmanMovement = true;
      this.pacman.moving = true;

      this.ghosts.forEach((ghost) => {
        const ghostRef = ghost;
        ghostRef.moving = true;
      });

      this.ghostCycle('scatter');

      this.idleGhosts = [this.pinky, this.inky, this.clyde];
      this.releaseGhost();
    }, duration);
  }

  /**
   * Clears out all children nodes from a given display element
   * @param {String} display
   */
  clearDisplay(display) {
    while (display.firstChild) {
      display.removeChild(display.firstChild);
    }
  }

  /**
   * Displays extra life images equal to the number of remaining lives
   */
  updateExtraLivesDisplay() {
    this.clearDisplay(this.extraLivesDisplay);

    for (let i = 0; i < this.lives; i += 1) {
      const extraLifePic = document.createElement('img');
      extraLifePic.setAttribute('src', 'app/style/graphics/extra_life.svg');
      extraLifePic.style.height = `${this.scaledTileSize * 2}px`;
      this.extraLivesDisplay.appendChild(extraLifePic);
    }
  }

  /**
   * Displays a rolling log of the seven most-recently eaten fruit
   * @param {String} rawImageSource
   */
  updateFruitDisplay(rawImageSource) {
    const parsedSource = rawImageSource.slice(
      rawImageSource.indexOf('(') + 1,
      rawImageSource.indexOf(')'),
    );

    if (this.fruitDisplay.children.length === 7) {
      this.fruitDisplay.removeChild(this.fruitDisplay.firstChild);
    }

    const fruitPic = document.createElement('img');
    fruitPic.setAttribute('src', parsedSource);
    fruitPic.style.height = `${this.scaledTileSize * 2}px`;
    this.fruitDisplay.appendChild(fruitPic);
  }

  /**
   * Cycles the ghosts between 'chase' and 'scatter' mode
   * @param {('chase'|'scatter')} mode
   */
  ghostCycle(mode) {
    const delay = mode === 'scatter' ? 7000 : 20000;
    const nextMode = mode === 'scatter' ? 'chase' : 'scatter';

    this.ghostCycleTimer = new Timer(() => {
      this.ghosts.forEach((ghost) => {
        ghost.changeMode(nextMode);
      });

      this.ghostCycle(nextMode);
    }, delay);
  }

  /**
   * Releases a ghost from the Ghost House after a delay
   */
  releaseGhost() {
    if (this.idleGhosts.length > 0) {
      const delay = Math.max((8 - (this.level - 1) * 4) * 1000, 0);

      this.endIdleTimer = new Timer(() => {
        this.idleGhosts[0].endIdleMode();
        this.idleGhosts.shift();
      }, delay);
    }
  }

  /**
   * Register listeners for various game sequences
   */
  registerEventListeners() {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('swipe', this.handleSwipe.bind(this));
    window.addEventListener('awardPoints', this.awardPoints.bind(this));
    window.addEventListener('deathSequence', this.deathSequence.bind(this));
    window.addEventListener('dotEaten', this.dotEaten.bind(this));
    window.addEventListener('powerUp', this.powerUp.bind(this));
    window.addEventListener('eatGhost', this.eatGhost.bind(this));
    window.addEventListener('restoreGhost', this.restoreGhost.bind(this));
    window.addEventListener('addTimer', this.addTimer.bind(this));
    window.addEventListener('removeTimer', this.removeTimer.bind(this));
    window.addEventListener('releaseGhost', this.releaseGhost.bind(this));
  }

  /**
   * Register listeners for touchstart and touchend to handle mobile device swipes
   */
  registerTouchListeners() {
    document.addEventListener('touchstart', this.handleTouchStart.bind(this));
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  /**
   * Sets touch values where the user's touch begins
   * @param {Event} event
   */
  handleTouchStart(event) {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  /**
   * Sets touch values where the user's touch ends and attempts to change Pac-Man's direction
   * @param {*} event
   */
  handleTouchEnd(event) {
    this.touchEndX = event.changedTouches[0].clientX;
    this.touchEndY = event.changedTouches[0].clientY;
    const diffX = this.touchEndX - this.touchStartX;
    const diffY = this.touchEndY - this.touchStartY;
    let direction;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      direction = diffX > 0 ? 'right' : 'left';
    } else {
      direction = diffY > 0 ? 'down' : 'up';
    }

    window.dispatchEvent(new CustomEvent('swipe', {
      detail: {
        direction,
      },
    }));
  }

  /**
   * Calls Pacman's changeDirection event if certain conditions are met
   * @param {({'up'|'down'|'left'|'right'})} direction
   */
  changeDirection(direction) {
    if (this.allowKeyPresses && this.gameEngine.running) {
      this.pacman.changeDirection(direction, this.allowPacmanMovement);
    }
  }

  /**
   * Calls various class functions depending upon the pressed key
   * @param {Event} e - The keydown event to evaluate
   */
  handleKeyDown(e) {
    if (e.keyCode === 27) {
      // ESC key
      this.handlePauseKey();
    } else if (e.keyCode === 81) {
      // Q
      this.soundButtonClick();
    } else if (this.movementKeys[e.keyCode]) {
      this.changeDirection(this.movementKeys[e.keyCode]);
    }
  }

  /**
   * Calls changeDirection with the direction of the user's swipe
   * @param {Event} e - The direction of the swipe
   */
  handleSwipe(e) {
    const { direction } = e.detail;
    this.changeDirection(direction);
  }

  /**
   * Handle behavior for the pause key
   */
  handlePauseKey() {
    if (this.allowPause) {
      this.allowPause = false;

      setTimeout(() => {
        if (!this.cutscene) {
          this.allowPause = true;
        }
      }, 500);

      this.gameEngine.changePausedState(this.gameEngine.running);
      this.soundManager.play('pause');

      if (this.gameEngine.started) {
        this.soundManager.resumeAmbience();
        this.gameUi.style.filter = 'unset';
        this.pausedText.style.visibility = 'hidden';
        this.pauseButton.innerHTML = 'pause';
        this.activeTimers.forEach((timer) => {
          timer.resume();
        });
      } else {
        this.soundManager.stopAmbience();
        this.soundManager.setAmbience('pause_beat', true);
        this.gameUi.style.filter = 'blur(5px)';
        this.pausedText.style.visibility = 'visible';
        this.pauseButton.innerHTML = 'play_arrow';
        this.activeTimers.forEach((timer) => {
          timer.pause();
        });
      }
    }
  }

  /**
   * Adds points to the player's total
   * @param {({ detail: { points: Number }})} e - Contains a quantity of points to add
   */
  awardPoints(e) {
    this.points += e.detail.points;
    this.pointsDisplay.innerText = this.points;
    if (this.points > (this.highScore || 0)) {
      this.highScore = this.points;
      this.highScoreDisplay.innerText = this.points;
      localStorage.setItem('highScore', this.highScore);
    }

    if (this.points >= 10000 && !this.extraLifeGiven) {
      this.extraLifeGiven = true;
      this.soundManager.play('extra_life');
      this.lives += 1;
      this.updateExtraLivesDisplay();
    }

    if (e.detail.type === 'fruit') {
      const left = e.detail.points >= 1000
        ? this.scaledTileSize * 12.5
        : this.scaledTileSize * 13;
      const top = this.scaledTileSize * 16.5;
      const width = e.detail.points >= 1000
        ? this.scaledTileSize * 3
        : this.scaledTileSize * 2;
      const height = this.scaledTileSize * 2;

      this.displayText({ left, top }, e.detail.points, 2000, width, height);
      this.soundManager.play('fruit');
      this.updateFruitDisplay(
        this.fruit.determineImage('fruit', e.detail.points),
      );
    }
  }

  /**
   * Animates Pacman's death, subtracts a life, and resets character positions if
   * the player has remaining lives.
   */
  deathSequence() {
    this.allowPause = false;
    this.cutscene = true;
    this.soundManager.setCutscene(this.cutscene);
    this.soundManager.stopAmbience();
    this.removeTimer({ detail: { timer: this.fruitTimer } });
    this.removeTimer({ detail: { timer: this.ghostCycleTimer } });
    this.removeTimer({ detail: { timer: this.endIdleTimer } });
    this.removeTimer({ detail: { timer: this.ghostFlashTimer } });

    this.allowKeyPresses = false;
    this.pacman.moving = false;
    this.ghosts.forEach((ghost) => {
      const ghostRef = ghost;
      ghostRef.moving = false;
    });

    new Timer(() => {
      this.ghosts.forEach((ghost) => {
        const ghostRef = ghost;
        ghostRef.display = false;
      });
      this.pacman.prepDeathAnimation();
      this.soundManager.play('death');

      if (this.lives > 0) {
        this.lives -= 1;

        new Timer(() => {
          this.mazeCover.style.visibility = 'visible';
          new Timer(() => {
            this.allowKeyPresses = true;
            this.mazeCover.style.visibility = 'hidden';
            this.pacman.reset();
            this.ghosts.forEach((ghost) => {
              ghost.reset();
            });
            this.fruit.hideFruit();

            this.startGameplay();
          }, 500);
        }, 2250);
      } else {
        this.gameOver();
      }
    }, 750);
  }

  /**
   * Displays GAME OVER text and displays the menu so players can play again
   */
  gameOver() {
    localStorage.setItem('highScore', this.highScore);

    new Timer(() => {
      this.displayText(
        {
          left: this.scaledTileSize * 9,
          top: this.scaledTileSize * 16.5,
        },
        'game_over',
        4000,
        this.scaledTileSize * 10,
        this.scaledTileSize * 2,
      );
      this.fruit.hideFruit();

      new Timer(() => {
        this.leftCover.style.left = '0';
        this.rightCover.style.right = '0';

        setTimeout(() => {
          this.mainMenu.style.opacity = 1;
          this.gameStartButton.disabled = false;
          this.mainMenu.style.visibility = 'visible';
        }, 1000);
      }, 2500);
    }, 2250);
  }

  /**
   * Handle events related to the number of remaining dots
   */
  dotEaten() {
    this.remainingDots -= 1;

    this.soundManager.playDotSound();

    if (this.remainingDots === 174 || this.remainingDots === 74) {
      this.createFruit();
    }

    if (this.remainingDots === 40 || this.remainingDots === 20) {
      this.speedUpBlinky();
    }

    if (this.remainingDots === 0) {
      this.advanceLevel();
    }
  }

  /**
   * Creates a bonus fruit for ten seconds
   */
  createFruit() {
    this.removeTimer({ detail: { timer: this.fruitTimer } });
    this.fruit.showFruit(this.fruitPoints[this.level] || 5000);
    this.fruitTimer = new Timer(() => {
      this.fruit.hideFruit();
    }, 10000);
  }

  /**
   * Speeds up Blinky and raises the background noise pitch
   */
  speedUpBlinky() {
    this.blinky.speedUp();

    if (this.scaredGhosts.length === 0 && this.eyeGhosts === 0) {
      this.soundManager.setAmbience(this.determineSiren(this.remainingDots));
    }
  }

  /**
   * Determines the correct siren ambience
   * @param {Number} remainingDots
   * @returns {String}
   */
  determineSiren(remainingDots) {
    let sirenNum;

    if (remainingDots > 40) {
      sirenNum = 1;
    } else if (remainingDots > 20) {
      sirenNum = 2;
    } else {
      sirenNum = 3;
    }

    return `siren_${sirenNum}`;
  }

  /**
   * Resets the gameboard and prepares the next level
   */
  advanceLevel() {
    this.allowPause = false;
    this.cutscene = true;
    this.soundManager.setCutscene(this.cutscene);
    this.allowKeyPresses = false;
    this.soundManager.stopAmbience();

    this.entityList.forEach((entity) => {
      const entityRef = entity;
      entityRef.moving = false;
    });

    this.removeTimer({ detail: { timer: this.fruitTimer } });
    this.removeTimer({ detail: { timer: this.ghostCycleTimer } });
    this.removeTimer({ detail: { timer: this.endIdleTimer } });
    this.removeTimer({ detail: { timer: this.ghostFlashTimer } });

    const imgBase = 'app/style//graphics/spriteSheets/maze/';

    new Timer(() => {
      this.ghosts.forEach((ghost) => {
        const ghostRef = ghost;
        ghostRef.display = false;
      });

      this.mazeImg.src = `${imgBase}maze_white.svg`;
      new Timer(() => {
        this.mazeImg.src = `${imgBase}maze_blue.svg`;
        new Timer(() => {
          this.mazeImg.src = `${imgBase}maze_white.svg`;
          new Timer(() => {
            this.mazeImg.src = `${imgBase}maze_blue.svg`;
            new Timer(() => {
              this.mazeImg.src = `${imgBase}maze_white.svg`;
              new Timer(() => {
                this.mazeImg.src = `${imgBase}maze_blue.svg`;
                new Timer(() => {
                  this.mazeCover.style.visibility = 'visible';
                  new Timer(() => {
                    this.mazeCover.style.visibility = 'hidden';
                    this.level += 1;
                    this.allowKeyPresses = true;
                    this.entityList.forEach((entity) => {
                      const entityRef = entity;
                      if (entityRef.level) {
                        entityRef.level = this.level;
                      }
                      entityRef.reset();
                      if (entityRef instanceof Ghost) {
                        entityRef.resetDefaultSpeed();
                      }
                      if (
                        entityRef instanceof Pickup
                        && entityRef.type !== 'fruit'
                      ) {
                        this.remainingDots += 1;
                      }
                    });
                    this.startGameplay();
                  }, 500);
                }, 250);
              }, 250);
            }, 250);
          }, 250);
        }, 250);
      }, 250);
    }, 2000);
  }

  /**
   * Flashes ghosts blue and white to indicate the end of the powerup
   * @param {Number} flashes - Total number of elapsed flashes
   * @param {Number} maxFlashes - Total flashes to show
   */
  flashGhosts(flashes, maxFlashes) {
    if (flashes === maxFlashes) {
      this.scaredGhosts.forEach((ghost) => {
        ghost.endScared();
      });
      this.scaredGhosts = [];
      if (this.eyeGhosts === 0) {
        this.soundManager.setAmbience(this.determineSiren(this.remainingDots));
      }
    } else if (this.scaredGhosts.length > 0) {
      this.scaredGhosts.forEach((ghost) => {
        ghost.toggleScaredColor();
      });

      this.ghostFlashTimer = new Timer(() => {
        this.flashGhosts(flashes + 1, maxFlashes);
      }, 250);
    }
  }

  /**
   * Upon eating a power pellet, sets the ghosts to 'scared' mode
   */
  powerUp() {
    if (this.remainingDots !== 0) {
      this.soundManager.setAmbience('power_up');
    }

    this.removeTimer({ detail: { timer: this.ghostFlashTimer } });

    this.ghostCombo = 0;
    this.scaredGhosts = [];

    this.ghosts.forEach((ghost) => {
      if (ghost.mode !== 'eyes') {
        this.scaredGhosts.push(ghost);
      }
    });

    this.scaredGhosts.forEach((ghost) => {
      ghost.becomeScared();
    });

    const powerDuration = Math.max((7 - this.level) * 1000, 0);
    this.ghostFlashTimer = new Timer(() => {
      this.flashGhosts(0, 9);
    }, powerDuration);
  }

  /**
   * Determines the quantity of points to give based on the current combo
   */
  determineComboPoints() {
    return 100 * (2 ** this.ghostCombo);
  }

  /**
   * Upon eating a ghost, award points and temporarily pause movement
   * @param {CustomEvent} e - Contains a target ghost object
   */
  eatGhost(e) {
    const pauseDuration = 1000;
    const { position, measurement } = e.detail.ghost;

    this.pauseTimer({ detail: { timer: this.ghostFlashTimer } });
    this.pauseTimer({ detail: { timer: this.ghostCycleTimer } });
    this.pauseTimer({ detail: { timer: this.fruitTimer } });
    this.soundManager.play('eat_ghost');

    this.scaredGhosts = this.scaredGhosts.filter(
      ghost => ghost.name !== e.detail.ghost.name,
    );
    this.eyeGhosts += 1;

    this.ghostCombo += 1;
    const comboPoints = this.determineComboPoints();
    window.dispatchEvent(
      new CustomEvent('awardPoints', {
        detail: {
          points: comboPoints,
        },
      }),
    );
    this.displayText(position, comboPoints, pauseDuration, measurement);

    this.allowPacmanMovement = false;
    this.pacman.display = false;
    this.pacman.moving = false;
    e.detail.ghost.display = false;
    e.detail.ghost.moving = false;

    this.ghosts.forEach((ghost) => {
      const ghostRef = ghost;
      ghostRef.animate = false;
      ghostRef.pause(true);
      ghostRef.allowCollision = false;
    });

    new Timer(() => {
      this.soundManager.setAmbience('eyes');

      this.resumeTimer({ detail: { timer: this.ghostFlashTimer } });
      this.resumeTimer({ detail: { timer: this.ghostCycleTimer } });
      this.resumeTimer({ detail: { timer: this.fruitTimer } });
      this.allowPacmanMovement = true;
      this.pacman.display = true;
      this.pacman.moving = true;
      e.detail.ghost.display = true;
      e.detail.ghost.moving = true;
      this.ghosts.forEach((ghost) => {
        const ghostRef = ghost;
        ghostRef.animate = true;
        ghostRef.pause(false);
        ghostRef.allowCollision = true;
      });
    }, pauseDuration);
  }

  /**
   * Decrements the count of "eye" ghosts and updates the ambience
   */
  restoreGhost() {
    this.eyeGhosts -= 1;

    if (this.eyeGhosts === 0) {
      const sound = this.scaredGhosts.length > 0
        ? 'power_up'
        : this.determineSiren(this.remainingDots);
      this.soundManager.setAmbience(sound);
    }
  }

  /**
   * Creates a temporary div to display points on screen
   * @param {({ left: number, top: number })} position - CSS coordinates to display the points at
   * @param {Number} amount - Amount of points to display
   * @param {Number} duration - Milliseconds to display the points before disappearing
   * @param {Number} width - Image width in pixels
   * @param {Number} height - Image height in pixels
   */
  displayText(position, amount, duration, width, height) {
    const pointsDiv = document.createElement('div');

    pointsDiv.style.position = 'absolute';
    pointsDiv.style.backgroundSize = `${width}px`;
    pointsDiv.style.backgroundImage = 'url(app/style/graphics/'
        + `spriteSheets/text/${amount}.svg`;
    pointsDiv.style.width = `${width}px`;
    pointsDiv.style.height = `${height || width}px`;
    pointsDiv.style.top = `${position.top}px`;
    pointsDiv.style.left = `${position.left}px`;
    pointsDiv.style.zIndex = 2;

    this.mazeDiv.appendChild(pointsDiv);

    new Timer(() => {
      this.mazeDiv.removeChild(pointsDiv);
    }, duration);
  }

  /**
   * Pushes a Timer to the activeTimers array
   * @param {({ detail: { timer: Object }})} e
   */
  addTimer(e) {
    this.activeTimers.push(e.detail.timer);
  }

  /**
   * Checks if a Timer with a matching ID exists
   * @param {({ detail: { timer: Object }})} e
   * @returns {Boolean}
   */
  timerExists(e) {
    return !!(e.detail.timer || {}).timerId;
  }

  /**
   * Pauses a timer
   * @param {({ detail: { timer: Object }})} e
   */
  pauseTimer(e) {
    if (this.timerExists(e)) {
      e.detail.timer.pause(true);
    }
  }

  /**
   * Resumes a timer
   * @param {({ detail: { timer: Object }})} e
   */
  resumeTimer(e) {
    if (this.timerExists(e)) {
      e.detail.timer.resume(true);
    }
  }

  /**
   * Removes a Timer from activeTimers
   * @param {({ detail: { timer: Object }})} e
   */
  removeTimer(e) {
    if (this.timerExists(e)) {
      window.clearTimeout(e.detail.timer.timerId);
      this.activeTimers = this.activeTimers.filter(
        timer => timer.timerId !== e.detail.timer.timerId,
      );
    }
  }
}


class GameEngine {
  constructor(maxFps, entityList) {
    this.fpsDisplay = document.getElementById('fps-display');
    this.elapsedMs = 0;
    this.lastFrameTimeMs = 0;
    this.entityList = entityList;
    this.maxFps = maxFps;
    this.timestep = 1000 / this.maxFps;
    this.fps = this.maxFps;
    this.framesThisSecond = 0;
    this.lastFpsUpdate = 0;
    this.frameId = 0;
    this.running = false;
    this.started = false;
  }

  /**
   * Toggles the paused/running status of the game
   * @param {Boolean} running - Whether the game is currently in motion
   */
  changePausedState(running) {
    if (running) {
      this.stop();
    } else {
      this.start();
    }
  }

  /**
   * Updates the on-screen FPS counter once per second
   * @param {number} timestamp - The amount of MS which has passed since starting the game engine
   */
  updateFpsDisplay(timestamp) {
    if (timestamp > this.lastFpsUpdate + 1000) {
      this.fps = (this.framesThisSecond + this.fps) / 2;
      this.lastFpsUpdate = timestamp;
      this.framesThisSecond = 0;
    }
    this.framesThisSecond += 1;
    this.fpsDisplay.textContent = `${Math.round(this.fps)} FPS`;
  }

  /**
   * Calls the draw function for every member of the entityList
   * @param {number} interp - The animation accuracy as a percentage
   * @param {Array} entityList - List of entities to be used throughout the game
   */
  draw(interp, entityList) {
    entityList.forEach((entity) => {
      if (typeof entity.draw === 'function') {
        entity.draw(interp);
      }
    });
  }

  /**
   * Calls the update function for every member of the entityList
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   * @param {Array} entityList - List of entities to be used throughout the game
   */
  update(elapsedMs, entityList) {
    entityList.forEach((entity) => {
      if (typeof entity.update === 'function') {
        entity.update(elapsedMs);
      }
    });
  }

  /**
   * In the event that a ton of unsimulated frames pile up, discard all of these frames
   * to prevent crashing the game
   */
  panic() {
    this.elapsedMs = 0;
  }

  /**
   * Draws an initial frame, resets a few tracking variables related to animation, and calls
   * the mainLoop function to start the engine
   */
  start() {
    if (!this.started) {
      this.started = true;

      this.frameId = requestAnimationFrame((firstTimestamp) => {
        this.draw(1, []);
        this.running = true;
        this.lastFrameTimeMs = firstTimestamp;
        this.lastFpsUpdate = firstTimestamp;
        this.framesThisSecond = 0;

        this.frameId = requestAnimationFrame((timestamp) => {
          this.mainLoop(timestamp);
        });
      });
    }
  }

  /**
   * Stops the engine and cancels the current animation frame
   */
  stop() {
    this.running = false;
    this.started = false;
    cancelAnimationFrame(this.frameId);
  }

  /**
   * The loop which will process all necessary frames to update the game's entities
   * prior to animating them
   */
  processFrames() {
    let numUpdateSteps = 0;
    while (this.elapsedMs >= this.timestep) {
      this.update(this.timestep, this.entityList);
      this.elapsedMs -= this.timestep;
      numUpdateSteps += 1;
      if (numUpdateSteps >= this.maxFps) {
        this.panic();
        break;
      }
    }
  }

  /**
   * A single cycle of the engine which checks to see if enough time has passed, and, if so,
   * will kick off the loops to update and draw the game's entities.
   * @param {number} timestamp - The amount of MS which has passed since starting the game engine
   */
  engineCycle(timestamp) {
    if (timestamp < this.lastFrameTimeMs + (1000 / this.maxFps)) {
      this.frameId = requestAnimationFrame((nextTimestamp) => {
        this.mainLoop(nextTimestamp);
      });
      return;
    }

    this.elapsedMs += timestamp - this.lastFrameTimeMs;
    this.lastFrameTimeMs = timestamp;
    this.updateFpsDisplay(timestamp);
    this.processFrames();
    this.draw(this.elapsedMs / this.timestep, this.entityList);

    this.frameId = requestAnimationFrame((nextTimestamp) => {
      this.mainLoop(nextTimestamp);
    });
  }

  /**
   * The endless loop which will kick off engine cycles so long as the game is running
   * @param {number} timestamp - The amount of MS which has passed since starting the game engine
   */
  mainLoop(timestamp) {
    this.engineCycle(timestamp);
  }
}


class DataManager {
  constructor(experimentManager, sessionManager) {
    this.experimentManager = experimentManager;
    this.sessionManager = sessionManager;
    this.backupInterval = null;
    this.compressionEnabled = true;
    this.maxStorageSize = 50 * 1024 * 1024; // 50MB
    this.isInitialized = false;
    this.DEBUG = true;
  }

  initialize() {
    if (this.isInitialized) return;
    
    this.setupAutoBackup();
    this.checkStorageHealth();
    this.bindEvents();
    this.isInitialized = true;
    
    if (this.DEBUG) {
      console.log('[DataManager] Initialized with auto-backup');
    }
  }

  bindEvents() {
    window.addEventListener('experimentSessionStarted', () => {
      this.createSessionBackup();
    });

    window.addEventListener('experimentSessionEnded', () => {
      this.createSessionBackup();
      this.cleanupOldBackups();
    });

    window.addEventListener('beforeunload', () => {
      this.createEmergencyBackup();
    });

    // Backup on significant events
    window.addEventListener('awardPoints', () => {
      this.deferredBackup();
    });

    window.addEventListener('deathSequence', () => {
      this.createEventBackup('death');
    });
  }

  setupAutoBackup() {
    // Create backup every 2 minutes during active session
    this.backupInterval = setInterval(() => {
      if (this.experimentManager.isExperimentActive) {
        this.createPeriodicBackup();
      }
    }, 2 * 60 * 1000);
  }

  createSessionBackup() {
    try {
      const backupData = this.gatherSessionData();
      const compressed = this.compressData(backupData);
      
      const backupKey = `session_backup_${this.experimentManager.userId}_${Date.now()}`;
      localStorage.setItem(backupKey, compressed);
      
      this.logBackup('session', backupKey, backupData);
      return true;
    } catch (error) {
      console.error('[DataManager] Session backup failed:', error);
      return false;
    }
  }

  createPeriodicBackup() {
    try {
      const backupData = this.gatherLiveData();
      const compressed = this.compressData(backupData);
      
      const backupKey = `periodic_backup_${this.experimentManager.userId}`;
      localStorage.setItem(backupKey, compressed);
      
      if (this.DEBUG) {
        console.log('[DataManager] Periodic backup created');
      }
      return true;
    } catch (error) {
      console.error('[DataManager] Periodic backup failed:', error);
      return false;
    }
  }

  createEventBackup(eventType) {
    try {
      const backupData = {
        type: 'event_backup',
        eventType,
        timestamp: Date.now(),
        currentSession: this.experimentManager.currentSession,
        recentEvents: this.getRecentEvents(10)
      };
      
      const compressed = this.compressData(backupData);
      const backupKey = `event_backup_${eventType}_${this.experimentManager.userId}_${Date.now()}`;
      
      localStorage.setItem(backupKey, compressed);
      this.logBackup('event', backupKey, backupData);
      return true;
    } catch (error) {
      console.error('[DataManager] Event backup failed:', error);
      return false;
    }
  }

  createEmergencyBackup() {
    try {
      const backupData = {
        type: 'emergency_backup',
        timestamp: Date.now(),
        reason: 'page_unload',
        ...this.gatherCriticalData()
      };
      
      const compressed = this.compressData(backupData);
      localStorage.setItem(`emergency_backup_${this.experimentManager.userId}`, compressed);
      
      if (this.DEBUG) {
        console.log('[DataManager] Emergency backup created');
      }
      return true;
    } catch (error) {
      console.error('[DataManager] Emergency backup failed:', error);
      return false;
    }
  }

  deferredBackup() {
    // Debounced backup for frequent events
    if (this.deferredBackupTimeout) {
      clearTimeout(this.deferredBackupTimeout);
    }
    
    this.deferredBackupTimeout = setTimeout(() => {
      this.createPeriodicBackup();
    }, 5000);
  }

  gatherSessionData() {
    return {
      type: 'session_backup',
      timestamp: Date.now(),
      userId: this.experimentManager.userId,
      sessionOrder: this.experimentManager.sessionOrder,
      metrics: this.experimentManager.metrics,
      currentSession: this.experimentManager.currentSession,
      sessionHistory: this.sessionManager.sessionHistory,
      analytics: this.sessionManager.getSessionAnalytics()
    };
  }

  gatherLiveData() {
    return {
      type: 'live_backup',
      timestamp: Date.now(),
      userId: this.experimentManager.userId,
      currentSession: this.experimentManager.currentSession,
      recentEvents: this.getRecentEvents(20),
      sessionState: this.sessionManager.currentSessionData
    };
  }

  gatherCriticalData() {
    return {
      userId: this.experimentManager.userId,
      currentSession: this.experimentManager.currentSession,
      completedSessions: this.experimentManager.getCompletedSessionsCount(),
      sessionOrder: this.experimentManager.sessionOrder,
      lastEvents: this.getRecentEvents(5)
    };
  }

  getRecentEvents(count) {
    if (!this.experimentManager.currentSession || !this.experimentManager.currentSession.events) {
      return [];
    }
    
    const events = this.experimentManager.currentSession.events;
    return events.slice(-count);
  }

  compressData(data) {
    if (!this.compressionEnabled) {
      return JSON.stringify(data);
    }
    
    try {
      // Simple compression: remove whitespace and compress common patterns
      const json = JSON.stringify(data);
      const compressed = json
        .replace(/\s+/g, ' ')
        .replace(/","/g, '","')
        .replace(/":"/g, '":"');
      
      return btoa(compressed); // Base64 encode
    } catch (error) {
      console.warn('[DataManager] Compression failed, using raw JSON');
      return JSON.stringify(data);
    }
  }

  decompressData(compressed) {
    try {
      // Try base64 decode first
      const decoded = atob(compressed);
      return JSON.parse(decoded);
    } catch (error) {
      // Fallback to direct JSON parse
      try {
        return JSON.parse(compressed);
      } catch (parseError) {
        console.error('[DataManager] Decompression failed:', parseError);
        return null;
      }
    }
  }

  recoverFromBackup(backupType = 'latest') {
    try {
      const backups = this.listBackups();
      
      if (backups.length === 0) {
        console.warn('[DataManager] No backups found for recovery');
        return null;
      }
      
      let targetBackup;
      
      switch (backupType) {
        case 'latest':
          targetBackup = backups[backups.length - 1];
          break;
        case 'session':
          targetBackup = backups.find(b => b.type === 'session');
          break;
        case 'emergency':
          targetBackup = backups.find(b => b.type === 'emergency');
          break;
        default:
          targetBackup = backups.find(b => b.key === backupType);
      }
      
      if (!targetBackup) {
        console.warn('[DataManager] Backup type not found:', backupType);
        return null;
      }
      
      const backupData = this.loadBackup(targetBackup.key);
      if (backupData) {
        this.restoreFromBackupData(backupData);
        console.log('[DataManager] Successfully recovered from backup:', targetBackup.key);
        return backupData;
      }
      
      return null;
    } catch (error) {
      console.error('[DataManager] Recovery failed:', error);
      return null;
    }
  }

  restoreFromBackupData(backupData) {
    if (backupData.userId && backupData.userId !== this.experimentManager.userId) {
      console.warn('[DataManager] Backup user ID mismatch');
      return false;
    }
    
    // Restore session order
    if (backupData.sessionOrder) {
      this.experimentManager.sessionOrder = backupData.sessionOrder;
    }
    
    // Restore metrics
    if (backupData.metrics) {
      this.experimentManager.metrics = backupData.metrics;
    }
    
    // Restore current session if valid
    if (backupData.currentSession && this.isValidSession(backupData.currentSession)) {
      this.experimentManager.currentSession = backupData.currentSession;
      this.experimentManager.currentMetrics = backupData.currentSession;
    }
    
    // Save restored data
    this.experimentManager.saveUserData();
    this.experimentManager.saveCurrentSession();
    
    return true;
  }

  isValidSession(session) {
    return session && 
           session.userId && 
           session.sessionId && 
           session.speedConfig && 
           Array.isArray(session.events);
  }

  loadBackup(backupKey) {
    try {
      const compressed = localStorage.getItem(backupKey);
      if (!compressed) {
        return null;
      }
      
      return this.decompressData(compressed);
    } catch (error) {
      console.error('[DataManager] Failed to load backup:', backupKey, error);
      return null;
    }
  }

  listBackups() {
    const backups = [];
    const userId = this.experimentManager.userId;
    
    if (!userId) return backups;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && key.includes(`backup_${userId}`)) {
        const timestamp = this.extractTimestampFromKey(key);
        const type = this.extractTypeFromKey(key);
        
        backups.push({
          key,
          timestamp,
          type,
          age: Date.now() - timestamp
        });
      }
    }
    
    return backups.sort((a, b) => a.timestamp - b.timestamp);
  }

  extractTimestampFromKey(key) {
    const match = key.match(/_(\d+)$/);
    return match ? parseInt(match[1]) : 0;
  }

  extractTypeFromKey(key) {
    if (key.includes('session_backup')) return 'session';
    if (key.includes('periodic_backup')) return 'periodic';
    if (key.includes('event_backup')) return 'event';
    if (key.includes('emergency_backup')) return 'emergency';
    return 'unknown';
  }

  cleanupOldBackups() {
    try {
      const backups = this.listBackups();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      const maxBackups = 50;
      
      // Remove old backups
      const oldBackups = backups.filter(b => b.age > maxAge);
      oldBackups.forEach(backup => {
        localStorage.removeItem(backup.key);
      });
      
      // Keep only latest backups if too many
      const remainingBackups = backups.filter(b => b.age <= maxAge);
      if (remainingBackups.length > maxBackups) {
        const toRemove = remainingBackups
          .slice(0, remainingBackups.length - maxBackups);
        
        toRemove.forEach(backup => {
          localStorage.removeItem(backup.key);
        });
      }
      
      if (this.DEBUG && (oldBackups.length > 0 || remainingBackups.length > maxBackups)) {
        console.log('[DataManager] Cleaned up old backups:', oldBackups.length);
      }
      
      return true;
    } catch (error) {
      console.error('[DataManager] Cleanup failed:', error);
      return false;
    }
  }

  checkStorageHealth() {
    try {
      const usage = this.calculateStorageUsage();
      const health = this.assessStorageHealth(usage);
      
      if (health.status === 'critical') {
        console.warn('[DataManager] Storage critical, forcing cleanup');
        this.emergencyCleanup();
      } else if (health.status === 'warning') {
        console.warn('[DataManager] Storage warning, running cleanup');
        this.cleanupOldBackups();
      }
      
      if (this.DEBUG) {
        console.log('[DataManager] Storage health:', health);
      }
      
      return health;
    } catch (error) {
      console.error('[DataManager] Storage health check failed:', error);
      return { status: 'error', usage: 0, available: 0 };
    }
  }

  calculateStorageUsage() {
    let totalSize = 0;
    let experimentSize = 0;
    const userId = this.experimentManager.userId;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      const size = (key.length + value.length) * 2; // Rough estimate in bytes
      
      totalSize += size;
      
      if (key && userId && key.includes(userId)) {
        experimentSize += size;
      }
    }
    
    return {
      total: totalSize,
      experiment: experimentSize,
      available: this.maxStorageSize - totalSize
    };
  }

  assessStorageHealth(usage) {
    const utilizationPercent = (usage.total / this.maxStorageSize) * 100;
    
    let status;
    if (utilizationPercent > 90) {
      status = 'critical';
    } else if (utilizationPercent > 70) {
      status = 'warning';
    } else {
      status = 'healthy';
    }
    
    return {
      status,
      usage: usage.total,
      available: usage.available,
      utilizationPercent: Math.round(utilizationPercent),
      experimentUsage: usage.experiment
    };
  }

  emergencyCleanup() {
    try {
      // Remove all old backups first
      const backups = this.listBackups();
      const oldBackups = backups.filter(b => b.age > 24 * 60 * 60 * 1000); // 1 day
      
      oldBackups.forEach(backup => {
        localStorage.removeItem(backup.key);
      });
      
      // Remove periodic backups
      const periodicBackups = backups.filter(b => b.type === 'periodic');
      periodicBackups.forEach(backup => {
        localStorage.removeItem(backup.key);
      });
      
      console.log('[DataManager] Emergency cleanup completed');
      return true;
    } catch (error) {
      console.error('[DataManager] Emergency cleanup failed:', error);
      return false;
    }
  }

  logBackup(type, key, data) {
    if (this.DEBUG) {
      console.log(`[DataManager] ${type} backup created:`, {
        key,
        size: JSON.stringify(data).length,
        events: data.currentSession?.events?.length || 0
      });
    }
  }

  exportAllData() {
    const allData = {
      userData: this.gatherSessionData(),
      backups: this.listBackups().map(b => ({
        ...b,
        data: this.loadBackup(b.key)
      })),
      storageHealth: this.checkStorageHealth(),
      exportTimestamp: new Date().toISOString()
    };
    
    return allData;
  }

  getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      compressionEnabled: this.compressionEnabled,
      backupCount: this.listBackups().length,
      storageHealth: this.checkStorageHealth(),
      maxStorageSize: this.maxStorageSize
    };
  }

  destroy() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
    
    if (this.deferredBackupTimeout) {
      clearTimeout(this.deferredBackupTimeout);
      this.deferredBackupTimeout = null;
    }
    
    this.isInitialized = false;
  }
}


class ExperimentManager {
  constructor() {
    this.SPEED_CONFIGS = {
      pacman: {
        slow: 0.5,
        normal: 1.0,
        fast: 1.5
      },
      ghost: {
        slow: 0.5,
        normal: 1.0,
        fast: 1.5
      }
    };

    this.PERMUTATIONS = this.generatePermutations();
    this.currentSession = null;
    this.userId = null;
    this.sessionOrder = [];
    this.metrics = [];
    this.currentMetrics = null;
    this.gameStartTime = null;
    this.isExperimentActive = false;
  }

  generatePermutations() {
    const permutations = [];
    const pacmanSpeeds = ['slow', 'normal', 'fast'];
    const ghostSpeeds = ['slow', 'normal', 'fast'];
    
    let id = 0;
    for (const pacmanSpeed of pacmanSpeeds) {
      for (const ghostSpeed of ghostSpeeds) {
        permutations.push({
          id: id++,
          pacman: pacmanSpeed,
          ghost: ghostSpeed
        });
      }
    }
    return permutations;
  }

  initializeUser(userId) {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    this.userId = userId.trim();
    this.loadUserData();
    
    if (this.sessionOrder.length === 0) {
      this.sessionOrder = this.generateRandomizedOrder();
      this.saveUserData();
    }
  }

  generateRandomizedOrder() {
    if (this.sessionManager) {
      return this.sessionManager.generateAdvancedRandomization(this.userId);
    }
    
    // Fallback to simple randomization
    const order = [...Array(9).keys()];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  }

  startSession() {
    if (!this.userId) {
      throw new Error('User ID must be set before starting session');
    }

    // Check for existing session state
    const savedState = this.loadCurrentSession();
    if (savedState && this.canResumeSession(savedState)) {
      return this.resumeSession(savedState);
    }

    const completedSessions = this.getCompletedSessionsCount();
    if (completedSessions >= 9) {
      throw new Error('All sessions completed');
    }

    const permutationId = this.sessionOrder[completedSessions];
    const config = this.PERMUTATIONS[permutationId];
    
    this.currentSession = {
      userId: this.userId,
      sessionId: completedSessions + 1,
      permutationId: permutationId,
      speedConfig: config,
      timestamp: new Date(),
      events: [],
      summary: {
        totalGhostsEaten: 0,
        totalPelletsEaten: 0,
        totalDeaths: 0,
        successfulTurns: 0,
        totalTurns: 0,
        gameTime: 0
      },
      resumed: false,
      startTime: Date.now()
    };

    this.currentMetrics = this.currentSession;
    this.gameStartTime = Date.now();
    this.isExperimentActive = true;

    this.applySpeedConfiguration(config);
    this.saveCurrentSession();
    
    return this.currentSession;
  }

  canResumeSession(savedState) {
    const age = Date.now() - (savedState.lastSaved || savedState.startTime || 0);
    const maxAge = 60 * 60 * 1000; // 1 hour
    
    return age < maxAge && 
           savedState.userId === this.userId && 
           savedState.sessionId > 0 && 
           savedState.sessionId <= 9;
  }

  resumeSession(savedState) {
    console.log('[ExperimentManager] Resuming previous session:', savedState.sessionId);
    
    this.currentSession = {
      ...savedState,
      resumed: true,
      resumeTime: Date.now()
    };
    
    this.currentMetrics = this.currentSession;
    this.gameStartTime = savedState.startTime || Date.now();
    this.isExperimentActive = true;

    this.applySpeedConfiguration(savedState.speedConfig);
    this.saveCurrentSession();
    
    return this.currentSession;
  }

  applySpeedConfiguration(config) {
    const pacmanMultiplier = this.SPEED_CONFIGS.pacman[config.pacman];
    const ghostMultiplier = this.SPEED_CONFIGS.ghost[config.ghost];

    window.dispatchEvent(new CustomEvent('speedConfigChanged', {
      detail: {
        pacmanMultiplier,
        ghostMultiplier,
        config
      }
    }));
  }

  logEvent(type, data = {}) {
    if (!this.isExperimentActive || !this.currentMetrics) {
      console.warn('[ExperimentManager] Cannot log event - experiment not active');
      return false;
    }

    if (!this.validateEventData(type, data)) {
      console.error('[ExperimentManager] Invalid event data:', { type, data });
      return false;
    }

    try {
      const event = {
        type,
        time: Date.now() - this.gameStartTime,
        timestamp: new Date(),
        ...data
      };

      this.currentMetrics.events.push(event);
      this.updateSummary(type, data);
      this.saveCurrentSession();
      
      return true;
    } catch (error) {
      console.error('[ExperimentManager] Error logging event:', error);
      return false;
    }
  }

  validateEventData(type, data) {
    const validTypes = ['ghostEaten', 'pelletEaten', 'death', 'turnComplete'];
    
    if (!validTypes.includes(type)) {
      console.warn(`[ExperimentManager] Unknown event type: ${type}`);
      return false;
    }

    if (typeof data !== 'object' || data === null) {
      console.warn('[ExperimentManager] Event data must be an object');
      return false;
    }

    switch (type) {
      case 'ghostEaten':
        if (!data.ghostId || typeof data.ghostId !== 'string') {
          console.warn('[ExperimentManager] ghostEaten event requires valid ghostId');
          return false;
        }
        break;
        
      case 'pelletEaten':
        if (!data.type || !['pacdot', 'powerPellet', 'fruit'].includes(data.type)) {
          console.warn('[ExperimentManager] pelletEaten event requires valid type');
          return false;
        }
        break;
        
      case 'death':
        if (!data.cause || typeof data.cause !== 'string') {
          console.warn('[ExperimentManager] death event requires valid cause');
          return false;
        }
        break;
        
      case 'turnComplete':
        if (typeof data.success !== 'boolean') {
          console.warn('[ExperimentManager] turnComplete event requires boolean success');
          return false;
        }
        break;
    }

    return true;
  }

  updateSummary(type, data) {
    if (!this.currentMetrics) return;

    const summary = this.currentMetrics.summary;
    
    switch (type) {
      case 'ghostEaten':
        summary.totalGhostsEaten++;
        break;
      case 'pelletEaten':
        summary.totalPelletsEaten++;
        break;
      case 'death':
        summary.totalDeaths++;
        break;
      case 'turnComplete':
        summary.totalTurns++;
        if (data.success) {
          summary.successfulTurns++;
        }
        break;
    }
  }

  endSession() {
    if (!this.isExperimentActive || !this.currentMetrics) return;

    this.currentMetrics.summary.gameTime = Date.now() - this.gameStartTime;
    this.metrics.push(this.currentMetrics);
    
    this.saveUserData();
    this.clearCurrentSession();
    
    this.isExperimentActive = false;
    this.currentMetrics = null;
    this.gameStartTime = null;
  }

  getCompletedSessionsCount() {
    return this.metrics.length;
  }

  getRemainingSessionsCount() {
    return 9 - this.getCompletedSessionsCount();
  }

  getCurrentSessionInfo() {
    if (!this.currentSession) return null;
    
    return {
      sessionId: this.currentSession.sessionId,
      completedSessions: this.getCompletedSessionsCount(),
      totalSessions: 9,
      speedConfig: this.currentSession.speedConfig
    };
  }

  saveUserData() {
    if (!this.userId) {
      console.warn('[ExperimentManager] Cannot save user data - no userId');
      return false;
    }

    try {
      const userData = {
        userId: this.userId,
        sessionOrder: this.sessionOrder,
        metrics: this.metrics,
        lastUpdated: new Date(),
        version: '1.0'
      };

      const serialized = JSON.stringify(userData);
      if (serialized.length > 5000000) { // 5MB limit
        console.warn('[ExperimentManager] User data too large, truncating old sessions');
        userData.metrics = userData.metrics.slice(-5); // Keep only last 5 sessions
      }

      localStorage.setItem(`experiment_${this.userId}`, JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('[ExperimentManager] Error saving user data:', error);
      return false;
    }
  }

  loadUserData() {
    if (!this.userId) {
      console.warn('[ExperimentManager] Cannot load user data - no userId');
      return false;
    }

    try {
      const stored = localStorage.getItem(`experiment_${this.userId}`);
      if (stored) {
        const userData = JSON.parse(stored);
        
        if (this.validateUserData(userData)) {
          this.sessionOrder = userData.sessionOrder || [];
          this.metrics = userData.metrics || [];
          return true;
        } else {
          console.warn('[ExperimentManager] Invalid user data format, resetting');
          this.resetUserData();
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('[ExperimentManager] Error loading user data:', error);
      this.resetUserData();
      return false;
    }
  }

  validateUserData(userData) {
    if (!userData || typeof userData !== 'object') {
      return false;
    }

    if (userData.userId !== this.userId) {
      console.warn('[ExperimentManager] User ID mismatch in stored data');
      return false;
    }

    if (!Array.isArray(userData.sessionOrder) || userData.sessionOrder.length > 9) {
      console.warn('[ExperimentManager] Invalid session order in stored data');
      return false;
    }

    if (!Array.isArray(userData.metrics) || userData.metrics.length > 9) {
      console.warn('[ExperimentManager] Invalid metrics array in stored data');
      return false;
    }

    return true;
  }

  resetUserData() {
    this.sessionOrder = [];
    this.metrics = [];
    
    if (this.userId) {
      localStorage.removeItem(`experiment_${this.userId}`);
      localStorage.removeItem(`current_session_${this.userId}`);
    }
  }

  saveCurrentSession() {
    if (!this.currentSession) return;
    localStorage.setItem(`current_session_${this.userId}`, JSON.stringify(this.currentSession));
  }

  loadCurrentSession() {
    if (!this.userId) return null;
    
    const stored = localStorage.getItem(`current_session_${this.userId}`);
    if (stored) {
      this.currentSession = JSON.parse(stored);
      this.currentMetrics = this.currentSession;
      return this.currentSession;
    }
    return null;
  }

  clearCurrentSession() {
    if (!this.userId) return;
    localStorage.removeItem(`current_session_${this.userId}`);
    this.currentSession = null;
  }

  exportData(format = 'json') {
    const exportData = {
      userId: this.userId,
      sessionOrder: this.sessionOrder,
      metrics: this.metrics,
      exportTimestamp: new Date(),
      totalSessions: this.metrics.length
    };

    if (format === 'csv') {
      return this.convertToCSV(exportData);
    }
    
    return JSON.stringify(exportData, null, 2);
  }

  convertToCSV(data) {
    const headers = [
      'userId', 'sessionId', 'permutationId', 'pacmanSpeed', 'ghostSpeed',
      'totalGhostsEaten', 'totalPelletsEaten', 'totalDeaths', 
      'successfulTurns', 'totalTurns', 'gameTime', 'timestamp'
    ];

    const rows = data.metrics.map(session => [
      session.userId,
      session.sessionId,
      session.permutationId,
      session.speedConfig.pacman,
      session.speedConfig.ghost,
      session.summary.totalGhostsEaten,
      session.summary.totalPelletsEaten,
      session.summary.totalDeaths,
      session.summary.successfulTurns,
      session.summary.totalTurns,
      session.summary.gameTime,
      session.timestamp
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  getDebugInfo() {
    return {
      userId: this.userId,
      currentSession: this.currentSession?.sessionId || null,
      completedSessions: this.getCompletedSessionsCount(),
      remainingSessions: this.getRemainingSessionsCount(),
      sessionOrder: this.sessionOrder,
      isExperimentActive: this.isExperimentActive
    };
  }
}


class ExperimentUI {
  constructor(experimentManager) {
    this.experimentManager = experimentManager;
    this.metricsCollector = null;
    this.isInitialized = false;
    this.metricsUpdateInterval = null;
    this.DEBUG = true;
  }

  initialize() {
    if (this.isInitialized) return;
    
    this.createExperimentInterface();
    this.bindEvents();
    this.isInitialized = true;
  }

  createExperimentInterface() {
    const existingInterface = document.getElementById('experiment-interface');
    if (existingInterface) {
      existingInterface.remove();
    }

    const interfaceHTML = `
      <div id="experiment-interface" style="position: fixed; top: 10px; left: 10px; z-index: 1000; background: rgba(0,0,0,0.8); color: white; padding: 15px; border-radius: 8px; font-family: monospace; max-width: 350px;">
        <div id="experiment-login" style="display: block;">
          <h3 style="margin: 0 0 10px 0; color: #ffff00;">Pac-Man Speed Experiment</h3>
          <p style="margin: 0 0 10px 0; font-size: 12px;">Research study: Speed configuration effects on gameplay</p>
          <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px;">Enter User ID:</label>
            <input type="text" id="user-id-input" style="width: 100%; padding: 5px; border: none; border-radius: 3px; font-family: monospace;" placeholder="Enter unique identifier">
          </div>
          <button id="start-experiment-btn" style="width: 100%; padding: 8px; background: #00ff00; border: none; border-radius: 3px; cursor: pointer; font-weight: bold;">Start Experiment</button>
          <div id="login-error" style="color: #ff0000; margin-top: 10px; display: none;"></div>
        </div>
        
        <div id="experiment-session" style="display: none;">
          <h3 style="margin: 0 0 10px 0; color: #ffff00;">Experiment Active</h3>
          <div id="session-info" style="margin-bottom: 10px; font-size: 12px;"></div>
          <div id="speed-config" style="margin-bottom: 10px; font-size: 12px;"></div>
          <div id="progress-info" style="margin-bottom: 10px; font-size: 12px;"></div>
          <div id="metrics-display" style="margin-bottom: 10px; font-size: 11px; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 3px;"></div>
          <button id="end-session-btn" style="width: 100%; padding: 6px; background: #ff4444; border: none; border-radius: 3px; cursor: pointer; margin-top: 5px;">End Session</button>
          <button id="export-data-btn" style="width: 100%; padding: 6px; background: #4444ff; border: none; border-radius: 3px; cursor: pointer; margin-top: 5px;">Export Data</button>
        </div>
        
        <div id="experiment-complete" style="display: none;">
          <h3 style="margin: 0 0 10px 0; color: #00ff00;">Experiment Complete!</h3>
          <p style="margin: 0 0 10px 0; font-size: 12px;">All 9 sessions completed. Thank you for participating!</p>
          <button id="export-final-data-btn" style="width: 100%; padding: 8px; background: #00ff00; border: none; border-radius: 3px; cursor: pointer;">Export Final Data</button>
          <button id="reset-experiment-btn" style="width: 100%; padding: 6px; background: #ff4444; border: none; border-radius: 3px; cursor: pointer; margin-top: 5px;">Reset Experiment</button>
        </div>

        ${this.DEBUG ? this.createDebugPanel() : ''}
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', interfaceHTML);
  }

  createDebugPanel() {
    return `
      <div id="debug-panel" style="margin-top: 15px; border-top: 1px solid #333; padding-top: 10px;">
        <h4 style="margin: 0 0 5px 0; color: #ffaa00;">Debug Info</h4>
        <div id="debug-info" style="font-size: 10px; color: #ccc;"></div>
        <button id="toggle-debug" style="padding: 3px 6px; background: #333; border: none; border-radius: 2px; cursor: pointer; font-size: 10px; margin-top: 5px;">Toggle Details</button>
      </div>
    `;
  }

  bindEvents() {
    const startBtn = document.getElementById('start-experiment-btn');
    const endBtn = document.getElementById('end-session-btn');
    const exportBtn = document.getElementById('export-data-btn');
    const exportFinalBtn = document.getElementById('export-final-data-btn');
    const resetBtn = document.getElementById('reset-experiment-btn');
    const userIdInput = document.getElementById('user-id-input');

    if (startBtn) {
      startBtn.addEventListener('click', () => this.handleStartExperiment());
    }

    if (endBtn) {
      endBtn.addEventListener('click', () => this.handleEndSession());
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.handleExportData());
    }

    if (exportFinalBtn) {
      exportFinalBtn.addEventListener('click', () => this.handleExportData());
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.handleResetExperiment());
    }

    if (userIdInput) {
      userIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleStartExperiment();
        }
      });
    }

    if (this.DEBUG) {
      const toggleDebugBtn = document.getElementById('toggle-debug');
      if (toggleDebugBtn) {
        toggleDebugBtn.addEventListener('click', () => this.toggleDebugDetails());
      }
    }
  }

  handleStartExperiment() {
    const userIdInput = document.getElementById('user-id-input');
    const errorDiv = document.getElementById('login-error');
    
    try {
      const userId = userIdInput.value.trim();
      if (!userId) {
        throw new Error('Please enter a User ID');
      }

      this.experimentManager.initializeUser(userId);
      
      const completedSessions = this.experimentManager.getCompletedSessionsCount();
      if (completedSessions >= 9) {
        this.showCompleteInterface();
        return;
      }

      this.experimentManager.startSession();
      this.showSessionInterface();
      this.updateSessionDisplay();
      
      if (errorDiv) {
        errorDiv.style.display = 'none';
      }

      window.dispatchEvent(new CustomEvent('experimentSessionStarted', {
        detail: this.experimentManager.getCurrentSessionInfo()
      }));

      this.startMetricsDisplay();

    } catch (error) {
      if (errorDiv) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
      }
    }
  }

  handleEndSession() {
    try {
      this.experimentManager.endSession();
      
      const completedSessions = this.experimentManager.getCompletedSessionsCount();
      if (completedSessions >= 9) {
        this.showCompleteInterface();
      } else {
        this.showLoginInterface();
      }

      window.dispatchEvent(new CustomEvent('experimentSessionEnded'));
      
      this.stopMetricsDisplay();

    } catch (error) {
      console.error('Error ending session:', error);
    }
  }

  handleExportData() {
    try {
      const jsonData = this.experimentManager.exportData('json');
      const csvData = this.experimentManager.exportData('csv');
      
      this.downloadFile(`experiment_${this.experimentManager.userId}_data.json`, jsonData);
      this.downloadFile(`experiment_${this.experimentManager.userId}_data.csv`, csvData);
      
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  }

  handleResetExperiment() {
    if (confirm('Are you sure you want to reset the experiment? All data will be lost.')) {
      if (this.experimentManager.userId) {
        localStorage.removeItem(`experiment_${this.experimentManager.userId}`);
        localStorage.removeItem(`current_session_${this.experimentManager.userId}`);
      }
      location.reload();
    }
  }

  downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  showLoginInterface() {
    this.hideAllInterfaces();
    const loginDiv = document.getElementById('experiment-login');
    if (loginDiv) {
      loginDiv.style.display = 'block';
    }
  }

  showSessionInterface() {
    this.hideAllInterfaces();
    const sessionDiv = document.getElementById('experiment-session');
    if (sessionDiv) {
      sessionDiv.style.display = 'block';
    }
  }

  showCompleteInterface() {
    this.hideAllInterfaces();
    const completeDiv = document.getElementById('experiment-complete');
    if (completeDiv) {
      completeDiv.style.display = 'block';
    }
  }

  hideAllInterfaces() {
    const interfaces = ['experiment-login', 'experiment-session', 'experiment-complete'];
    interfaces.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.style.display = 'none';
      }
    });
  }

  updateSessionDisplay() {
    const sessionInfo = this.experimentManager.getCurrentSessionInfo();
    if (!sessionInfo) return;

    const sessionInfoDiv = document.getElementById('session-info');
    const speedConfigDiv = document.getElementById('speed-config');
    const progressInfoDiv = document.getElementById('progress-info');

    if (sessionInfoDiv) {
      sessionInfoDiv.innerHTML = `
        <strong>User:</strong> ${this.experimentManager.userId}<br>
        <strong>Session:</strong> ${sessionInfo.sessionId}/9
      `;
    }

    if (speedConfigDiv) {
      speedConfigDiv.innerHTML = `
        <strong>Current Configuration:</strong><br>
        Pac-Man Speed: ${sessionInfo.speedConfig.pacman}<br>
        Ghost Speed: ${sessionInfo.speedConfig.ghost}
      `;
    }

    if (progressInfoDiv) {
      progressInfoDiv.innerHTML = `
        <strong>Progress:</strong> ${sessionInfo.completedSessions}/${sessionInfo.totalSessions} completed
      `;
    }

    if (this.DEBUG) {
      this.updateDebugDisplay();
    }
  }

  startMetricsDisplay() {
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
    }

    this.metricsUpdateInterval = setInterval(() => {
      this.updateMetricsDisplay();
    }, 1000);
  }

  stopMetricsDisplay() {
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
      this.metricsUpdateInterval = null;
    }
  }

  updateMetricsDisplay() {
    const metricsDiv = document.getElementById('metrics-display');
    if (!metricsDiv) return;

    const metrics = this.getGameCoordinatorMetrics();
    if (!metrics) {
      metricsDiv.innerHTML = '<em>Waiting for game data...</em>';
      return;
    }

    metricsDiv.innerHTML = `
      <strong>Live Metrics:</strong><br>
      Ghosts Eaten: ${metrics.summary.totalGhostsEaten}<br>
      Pellets Eaten: ${metrics.summary.totalPelletsEaten}<br>
      Deaths: ${metrics.summary.totalDeaths}<br>
      Turns: ${metrics.summary.successfulTurns}/${metrics.summary.totalTurns}<br>
      Consecutive: ${metrics.consecutiveTurns || 0}<br>
      Events: ${metrics.events}
    `;
  }

  getGameCoordinatorMetrics() {
    try {
      if (window.gameCoordinator && window.gameCoordinator.metricsCollector) {
        return window.gameCoordinator.metricsCollector.getCurrentMetrics();
      }
      
      if (this.metricsCollector) {
        return this.metricsCollector.getCurrentMetrics();
      }
      
      return null;
    } catch (error) {
      if (this.DEBUG) {
        console.warn('[ExperimentUI] Error getting metrics:', error);
      }
      return null;
    }
  }

  setMetricsCollector(metricsCollector) {
    this.metricsCollector = metricsCollector;
  }

  updateDebugDisplay() {
    const debugInfoDiv = document.getElementById('debug-info');
    if (!debugInfoDiv) return;

    const debugInfo = this.experimentManager.getDebugInfo();
    debugInfoDiv.innerHTML = `
      User: ${debugInfo.userId || 'None'}<br>
      Current Session: ${debugInfo.currentSession || 'None'}<br>
      Completed: ${debugInfo.completedSessions}/9<br>
      Active: ${debugInfo.isExperimentActive ? 'Yes' : 'No'}
    `;
  }

  toggleDebugDetails() {
    const debugInfoDiv = document.getElementById('debug-info');
    if (!debugInfoDiv) return;

    const debugInfo = this.experimentManager.getDebugInfo();
    const isDetailed = debugInfoDiv.innerHTML.includes('Session Order');

    if (isDetailed) {
      this.updateDebugDisplay();
    } else {
      debugInfoDiv.innerHTML = `
        User: ${debugInfo.userId || 'None'}<br>
        Current Session: ${debugInfo.currentSession || 'None'}<br>
        Completed: ${debugInfo.completedSessions}/9<br>
        Active: ${debugInfo.isExperimentActive ? 'Yes' : 'No'}<br>
        Session Order: [${debugInfo.sessionOrder.join(', ')}]<br>
        Remaining: ${debugInfo.remainingSessions}
      `;
    }
  }

  logMetric(type, data = {}) {
    this.experimentManager.logEvent(type, data);
    
    if (this.DEBUG) {
      console.log('[METRICS]', type, data);
    }
  }

  destroy() {
    const experimentInterface = document.getElementById('experiment-interface');
    if (experimentInterface) {
      experimentInterface.remove();
    }
    this.isInitialized = false;
  }
}


class MetricsCollector {
  constructor(experimentManager) {
    this.experimentManager = experimentManager;
    this.turnTracker = null;
    this.lastPosition = null;
    this.lastDirection = null;
    this.turnStartTime = null;
    this.consecutiveSuccessfulTurns = 0;
    this.isInitialized = false;
    this.DEBUG = true;
  }

  initialize(gameCoordinator) {
    if (this.isInitialized) return;
    
    this.gameCoordinator = gameCoordinator;
    this.bindGameEvents();
    this.initializeTurnTracking();
    this.isInitialized = true;
    
    if (this.DEBUG) {
      console.log('[MetricsCollector] Initialized with game coordinator');
    }
  }

  bindGameEvents() {
    window.addEventListener('experimentSessionStarted', () => {
      this.resetMetrics();
    });

    window.addEventListener('experimentSessionEnded', () => {
      this.finalizeTurnTracking();
    });

    window.addEventListener('awardPoints', (e) => {
      this.handlePointsEvent(e.detail);
    });

    window.addEventListener('dotEaten', () => {
      this.logMetric('pelletEaten', {
        type: 'pacdot',
        position: this.getCurrentPacmanPosition(),
        consecutiveTurns: this.consecutiveSuccessfulTurns
      });
    });

    window.addEventListener('powerUp', () => {
      this.logMetric('pelletEaten', {
        type: 'powerPellet',
        position: this.getCurrentPacmanPosition(),
        consecutiveTurns: this.consecutiveSuccessfulTurns
      });
    });

    window.addEventListener('eatGhost', (e) => {
      this.logMetric('ghostEaten', {
        ghostId: e.detail.ghost.name,
        ghostMode: e.detail.ghost.mode,
        position: this.getCurrentPacmanPosition(),
        consecutiveTurns: this.consecutiveSuccessfulTurns
      });
    });

    window.addEventListener('deathSequence', () => {
      this.logMetric('death', {
        cause: 'ghost_collision',
        position: this.getCurrentPacmanPosition(),
        consecutiveTurns: this.consecutiveSuccessfulTurns,
        turnInProgress: this.turnTracker !== null
      });
      
      this.resetTurnTracking();
    });
  }

  handlePointsEvent(detail) {
    if (detail.type === 'fruit') {
      this.logMetric('pelletEaten', {
        type: 'fruit',
        points: detail.points,
        position: this.getCurrentPacmanPosition(),
        consecutiveTurns: this.consecutiveSuccessfulTurns
      });
    }
  }

  initializeTurnTracking() {
    if (!this.gameCoordinator || !this.gameCoordinator.pacman) {
      setTimeout(() => this.initializeTurnTracking(), 100);
      return;
    }

    setInterval(() => {
      this.updateTurnTracking();
    }, 50);
  }

  updateTurnTracking() {
    if (!this.isExperimentActive()) return;

    const pacman = this.gameCoordinator.pacman;
    if (!pacman || !pacman.moving) return;

    const currentPosition = this.getCurrentPacmanGridPosition();
    const currentDirection = pacman.direction;
    
    if (!currentPosition) return;

    if (this.hasDirectionChanged(currentDirection)) {
      this.handleDirectionChange(currentPosition, currentDirection);
    }

    this.lastPosition = currentPosition;
    this.lastDirection = currentDirection;
  }

  hasDirectionChanged(currentDirection) {
    return this.lastDirection && this.lastDirection !== currentDirection;
  }

  handleDirectionChange(position, newDirection) {
    if (this.turnTracker) {
      this.completeTurn(position, newDirection);
    }
    
    this.startNewTurn(position, newDirection);
  }

  startNewTurn(position, direction) {
    this.turnTracker = {
      startPosition: { ...position },
      startDirection: this.lastDirection,
      targetDirection: direction,
      startTime: Date.now(),
      successful: false
    };
    
    this.turnStartTime = Date.now();
    
    if (this.DEBUG) {
      console.log('[MetricsCollector] Turn started:', this.turnTracker);
    }
  }

  completeTurn(position, actualDirection) {
    if (!this.turnTracker) return;

    const turnDuration = Date.now() - this.turnStartTime;
    const successful = this.isTurnSuccessful(actualDirection);
    
    this.turnTracker.endPosition = { ...position };
    this.turnTracker.actualDirection = actualDirection;
    this.turnTracker.duration = turnDuration;
    this.turnTracker.successful = successful;
    
    this.logMetric('turnComplete', {
      success: successful,
      startPosition: this.turnTracker.startPosition,
      endPosition: this.turnTracker.endPosition,
      startDirection: this.turnTracker.startDirection,
      targetDirection: this.turnTracker.targetDirection,
      actualDirection: actualDirection,
      duration: turnDuration,
      consecutiveTurns: successful ? this.consecutiveSuccessfulTurns + 1 : 0
    });

    if (successful) {
      this.consecutiveSuccessfulTurns++;
    } else {
      this.consecutiveSuccessfulTurns = 0;
    }

    if (this.DEBUG) {
      console.log('[MetricsCollector] Turn completed:', this.turnTracker);
    }

    this.turnTracker = null;
  }

  isTurnSuccessful(actualDirection) {
    if (!this.turnTracker) return false;
    
    const intended = this.turnTracker.targetDirection;
    const actual = actualDirection;
    
    const success = intended === actual;
    
    if (this.DEBUG && !success) {
      console.log(`[MetricsCollector] Turn failed: intended ${intended}, actual ${actual}`);
    }
    
    return success;
  }

  finalizeTurnTracking() {
    if (this.turnTracker) {
      const currentPosition = this.getCurrentPacmanGridPosition();
      if (currentPosition) {
        this.completeTurn(currentPosition, this.lastDirection);
      }
    }
  }

  resetTurnTracking() {
    this.turnTracker = null;
    this.consecutiveSuccessfulTurns = 0;
    this.lastPosition = null;
    this.lastDirection = null;
    this.turnStartTime = null;
    
    if (this.DEBUG) {
      console.log('[MetricsCollector] Turn tracking reset');
    }
  }

  resetMetrics() {
    this.resetTurnTracking();
    
    if (this.DEBUG) {
      console.log('[MetricsCollector] Metrics reset for new session');
    }
  }

  getCurrentPacmanPosition() {
    if (!this.gameCoordinator || !this.gameCoordinator.pacman) {
      return null;
    }
    
    return {
      left: this.gameCoordinator.pacman.position.left,
      top: this.gameCoordinator.pacman.position.top
    };
  }

  getCurrentPacmanGridPosition() {
    if (!this.gameCoordinator || !this.gameCoordinator.pacman) {
      return null;
    }
    
    const pacman = this.gameCoordinator.pacman;
    if (!pacman.characterUtil) {
      return null;
    }
    
    return pacman.characterUtil.determineGridPosition(
      pacman.position, 
      this.gameCoordinator.scaledTileSize
    );
  }

  isExperimentActive() {
    return this.experimentManager && this.experimentManager.isExperimentActive;
  }

  logMetric(type, data = {}) {
    if (!this.experimentManager) {
      if (this.DEBUG) {
        console.warn('[MetricsCollector] No experiment manager available');
      }
      return;
    }

    const enrichedData = {
      ...data,
      timestamp: Date.now(),
      pacmanPosition: this.getCurrentPacmanPosition(),
      pacmanGridPosition: this.getCurrentPacmanGridPosition()
    };

    this.experimentManager.logEvent(type, enrichedData);
    
    if (this.DEBUG) {
      console.log(`[MetricsCollector] Logged metric: ${type}`, enrichedData);
    }
  }

  getCurrentMetrics() {
    if (!this.experimentManager || !this.experimentManager.currentMetrics) {
      return null;
    }
    
    return {
      session: this.experimentManager.currentMetrics.sessionId,
      summary: this.experimentManager.currentMetrics.summary,
      events: this.experimentManager.currentMetrics.events.length,
      consecutiveTurns: this.consecutiveSuccessfulTurns,
      turnInProgress: this.turnTracker !== null
    };
  }

  getDetailedMetrics() {
    const metrics = this.getCurrentMetrics();
    if (!metrics) return null;

    const events = this.experimentManager.currentMetrics.events;
    
    return {
      ...metrics,
      eventBreakdown: {
        ghostsEaten: events.filter(e => e.type === 'ghostEaten').length,
        pelletsEaten: events.filter(e => e.type === 'pelletEaten').length,
        deaths: events.filter(e => e.type === 'death').length,
        turnsCompleted: events.filter(e => e.type === 'turnComplete').length,
        successfulTurns: events.filter(e => e.type === 'turnComplete' && e.success).length
      },
      recentEvents: events.slice(-5),
      turnTracker: this.turnTracker
    };
  }

  getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      isExperimentActive: this.isExperimentActive(),
      consecutiveSuccessfulTurns: this.consecutiveSuccessfulTurns,
      turnInProgress: this.turnTracker !== null,
      lastPosition: this.lastPosition,
      lastDirection: this.lastDirection,
      currentMetrics: this.getCurrentMetrics()
    };
  }
}


class ProgressController {
  constructor(experimentManager, sessionManager) {
    this.experimentManager = experimentManager;
    this.sessionManager = sessionManager;
    this.progressState = {
      currentPhase: 'pre_session',
      allowedActions: ['start_session'],
      restrictions: [],
      warnings: []
    };
    this.validationRules = [];
    this.isInitialized = false;
    this.DEBUG = true;
  }

  initialize() {
    if (this.isInitialized) return;
    
    this.setupValidationRules();
    this.bindEvents();
    this.isInitialized = true;
    
    if (this.DEBUG) {
      console.log('[ProgressController] Initialized');
    }
  }

  setupValidationRules() {
    this.validationRules = [
      {
        name: 'session_order_integrity',
        check: () => this.validateSessionOrder(),
        severity: 'error'
      },
      {
        name: 'user_data_consistency',
        check: () => this.validateUserDataConsistency(),
        severity: 'error'
      },
      {
        name: 'session_completion_rate',
        check: () => this.validateSessionCompletionRate(),
        severity: 'warning'
      },
      {
        name: 'session_duration_bounds',
        check: () => this.validateSessionDuration(),
        severity: 'warning'
      },
      {
        name: 'metrics_data_quality',
        check: () => this.validateMetricsQuality(),
        severity: 'warning'
      }
    ];
  }

  bindEvents() {
    window.addEventListener('experimentSessionStarted', () => {
      this.handleSessionStart();
    });

    window.addEventListener('experimentSessionEnded', () => {
      this.handleSessionEnd();
    });

    window.addEventListener('sessionIdle', (e) => {
      this.handleSessionIdle(e.detail);
    });

    window.addEventListener('sessionTimeout', (e) => {
      this.handleSessionTimeout(e.detail);
    });
  }

  handleSessionStart() {
    this.progressState.currentPhase = 'in_session';
    this.progressState.allowedActions = ['end_session', 'pause_session'];
    this.progressState.restrictions = ['start_new_session', 'change_user'];
    
    const validation = this.runValidation();
    if (validation.hasErrors) {
      this.progressState.warnings.push('Session started with validation errors');
    }
    
    if (this.DEBUG) {
      console.log('[ProgressController] Session started, phase:', this.progressState.currentPhase);
    }
  }

  handleSessionEnd() {
    const completedSessions = this.experimentManager.getCompletedSessionsCount();
    
    if (completedSessions >= 9) {
      this.progressState.currentPhase = 'experiment_complete';
      this.progressState.allowedActions = ['export_data', 'reset_experiment'];
      this.progressState.restrictions = ['start_session'];
    } else {
      this.progressState.currentPhase = 'between_sessions';
      this.progressState.allowedActions = ['start_next_session', 'export_partial_data'];
      this.progressState.restrictions = [];
    }
    
    this.progressState.warnings = [];
    
    if (this.DEBUG) {
      console.log('[ProgressController] Session ended, phase:', this.progressState.currentPhase);
    }
  }

  handleSessionIdle(detail) {
    this.progressState.warnings.push({
      type: 'idle_session',
      message: `Session idle for ${Math.round(detail.idleTime / 1000)} seconds`,
      timestamp: Date.now()
    });
    
    if (this.DEBUG) {
      console.log('[ProgressController] Session idle detected');
    }
  }

  handleSessionTimeout(detail) {
    this.progressState.warnings.push({
      type: 'session_timeout',
      message: `Session exceeded maximum duration (${Math.round(detail.sessionTime / 1000)} seconds)`,
      timestamp: Date.now()
    });
    
    // Force end session
    this.forceEndSession('timeout');
    
    if (this.DEBUG) {
      console.log('[ProgressController] Session timeout, forcing end');
    }
  }

  forceEndSession(reason) {
    this.progressState.restrictions.push(`forced_end_${reason}`);
    
    // Trigger session end
    window.dispatchEvent(new CustomEvent('forceEndSession', {
      detail: { reason }
    }));
  }

  canPerformAction(action) {
    const allowed = this.progressState.allowedActions.includes(action);
    const restricted = this.progressState.restrictions.includes(action);
    
    return allowed && !restricted;
  }

  validateAction(action, context = {}) {
    const validation = {
      allowed: this.canPerformAction(action),
      errors: [],
      warnings: []
    };
    
    switch (action) {
      case 'start_session':
        this.validateStartSession(validation, context);
        break;
      case 'end_session':
        this.validateEndSession(validation, context);
        break;
      case 'export_data':
        this.validateExportData(validation, context);
        break;
      case 'reset_experiment':
        this.validateResetExperiment(validation, context);
        break;
    }
    
    return validation;
  }

  validateStartSession(validation, context) {
    const completedSessions = this.experimentManager.getCompletedSessionsCount();
    
    if (completedSessions >= 9) {
      validation.errors.push('All sessions already completed');
      validation.allowed = false;
    }
    
    if (this.progressState.currentPhase === 'in_session') {
      validation.errors.push('Session already in progress');
      validation.allowed = false;
    }
    
    if (!this.experimentManager.userId) {
      validation.errors.push('User ID not set');
      validation.allowed = false;
    }
    
    // Check for incomplete session state
    const savedState = this.sessionManager.loadSessionState();
    if (savedState) {
      validation.warnings.push('Previous session state found - will resume');
    }
  }

  validateEndSession(validation, context) {
    if (this.progressState.currentPhase !== 'in_session') {
      validation.errors.push('No active session to end');
      validation.allowed = false;
    }
    
    const currentMetrics = this.experimentManager.currentMetrics;
    if (currentMetrics && currentMetrics.events.length === 0) {
      validation.warnings.push('Ending session with no recorded events');
    }
  }

  validateExportData(validation, context) {
    const completedSessions = this.experimentManager.getCompletedSessionsCount();
    
    if (completedSessions === 0) {
      validation.errors.push('No completed sessions to export');
      validation.allowed = false;
    }
    
    if (!this.testLocalStorage()) {
      validation.warnings.push('Local storage not available - export may be incomplete');
    }
  }

  validateResetExperiment(validation, context) {
    if (this.progressState.currentPhase === 'in_session') {
      validation.errors.push('Cannot reset during active session');
      validation.allowed = false;
    }
    
    const completedSessions = this.experimentManager.getCompletedSessionsCount();
    if (completedSessions > 0) {
      validation.warnings.push(`Resetting will lose ${completedSessions} completed sessions`);
    }
  }

  runValidation() {
    const results = {
      passed: [],
      warnings: [],
      errors: [],
      hasErrors: false,
      hasWarnings: false
    };
    
    this.validationRules.forEach(rule => {
      try {
        const result = rule.check();
        
        if (result.valid) {
          results.passed.push(rule.name);
        } else {
          if (rule.severity === 'error') {
            results.errors.push({
              rule: rule.name,
              message: result.message,
              data: result.data
            });
            results.hasErrors = true;
          } else {
            results.warnings.push({
              rule: rule.name,
              message: result.message,
              data: result.data
            });
            results.hasWarnings = true;
          }
        }
      } catch (error) {
        results.errors.push({
          rule: rule.name,
          message: `Validation rule failed: ${error.message}`,
          data: { error: error.toString() }
        });
        results.hasErrors = true;
      }
    });
    
    return results;
  }

  validateSessionOrder() {
    const sessionOrder = this.experimentManager.sessionOrder;
    const completedSessions = this.experimentManager.getCompletedSessionsCount();
    
    if (sessionOrder.length !== 9) {
      return {
        valid: false,
        message: `Invalid session order length: ${sessionOrder.length}, expected 9`,
        data: { sessionOrder }
      };
    }
    
    const uniqueIds = new Set(sessionOrder);
    if (uniqueIds.size !== 9) {
      return {
        valid: false,
        message: 'Session order contains duplicate permutation IDs',
        data: { sessionOrder, duplicates: sessionOrder.length - uniqueIds.size }
      };
    }
    
    const validIds = sessionOrder.every(id => id >= 0 && id <= 8);
    if (!validIds) {
      return {
        valid: false,
        message: 'Session order contains invalid permutation IDs',
        data: { sessionOrder }
      };
    }
    
    return { valid: true };
  }

  validateUserDataConsistency() {
    const userId = this.experimentManager.userId;
    const metrics = this.experimentManager.metrics;
    
    if (!userId) {
      return {
        valid: false,
        message: 'No user ID set',
        data: {}
      };
    }
    
    const userIdMismatch = metrics.some(metric => metric.userId !== userId);
    if (userIdMismatch) {
      return {
        valid: false,
        message: 'User ID mismatch in metrics data',
        data: { userId, metricsCount: metrics.length }
      };
    }
    
    const sessionIdGaps = this.checkSessionIdSequence(metrics);
    if (sessionIdGaps.length > 0) {
      return {
        valid: false,
        message: 'Session ID sequence has gaps',
        data: { gaps: sessionIdGaps }
      };
    }
    
    return { valid: true };
  }

  checkSessionIdSequence(metrics) {
    const sessionIds = metrics.map(m => m.sessionId).sort((a, b) => a - b);
    const gaps = [];
    
    for (let i = 1; i <= sessionIds.length; i++) {
      if (!sessionIds.includes(i)) {
        gaps.push(i);
      }
    }
    
    return gaps;
  }

  validateSessionCompletionRate() {
    const analytics = this.sessionManager.getSessionAnalytics();
    const completionRate = analytics.totalSessions > 0 
      ? analytics.completedSessions / analytics.totalSessions 
      : 1;
    
    if (completionRate < 0.8) {
      return {
        valid: false,
        message: `Low session completion rate: ${Math.round(completionRate * 100)}%`,
        data: analytics
      };
    }
    
    return { valid: true };
  }

  validateSessionDuration() {
    const analytics = this.sessionManager.getSessionAnalytics();
    const avgDuration = analytics.averageDuration;
    
    // Expect sessions to be between 2-25 minutes
    const minDuration = 2 * 60 * 1000;
    const maxDuration = 25 * 60 * 1000;
    
    if (avgDuration < minDuration) {
      return {
        valid: false,
        message: `Average session duration too short: ${Math.round(avgDuration / 1000)}s`,
        data: { avgDuration, minExpected: minDuration }
      };
    }
    
    if (avgDuration > maxDuration) {
      return {
        valid: false,
        message: `Average session duration too long: ${Math.round(avgDuration / 1000)}s`,
        data: { avgDuration, maxExpected: maxDuration }
      };
    }
    
    return { valid: true };
  }

  validateMetricsQuality() {
    const currentMetrics = this.experimentManager.currentMetrics;
    if (!currentMetrics) {
      return { valid: true }; // No current session
    }
    
    const events = currentMetrics.events;
    const summary = currentMetrics.summary;
    
    // Check for reasonable event counts
    if (events.length === 0 && Date.now() - this.sessionManager.sessionStartTime > 60000) {
      return {
        valid: false,
        message: 'No events recorded after 1 minute of gameplay',
        data: { eventCount: events.length, sessionTime: Date.now() - this.sessionManager.sessionStartTime }
      };
    }
    
    // Check for data consistency between events and summary
    const eventCounts = this.countEventTypes(events);
    
    if (Math.abs(eventCounts.ghostEaten - summary.totalGhostsEaten) > 0) {
      return {
        valid: false,
        message: 'Ghost eaten count mismatch between events and summary',
        data: { events: eventCounts.ghostEaten, summary: summary.totalGhostsEaten }
      };
    }
    
    return { valid: true };
  }

  countEventTypes(events) {
    return events.reduce((counts, event) => {
      counts[event.type] = (counts[event.type] || 0) + 1;
      return counts;
    }, {});
  }

  testLocalStorage() {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  getProgressSummary() {
    const validation = this.runValidation();
    const completedSessions = this.experimentManager.getCompletedSessionsCount();
    const analytics = this.sessionManager.getSessionAnalytics();
    
    return {
      phase: this.progressState.currentPhase,
      progress: `${completedSessions}/9`,
      progressPercent: Math.round((completedSessions / 9) * 100),
      allowedActions: this.progressState.allowedActions,
      restrictions: this.progressState.restrictions,
      warnings: this.progressState.warnings,
      validation,
      analytics: {
        completionRate: analytics.totalSessions > 0 
          ? Math.round((analytics.completedSessions / analytics.totalSessions) * 100) 
          : 100,
        averageDuration: Math.round(analytics.averageDuration / 1000),
        totalEvents: analytics.totalEvents
      }
    };
  }

  getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      progressState: this.progressState,
      validationRules: this.validationRules.map(r => r.name),
      summary: this.getProgressSummary()
    };
  }
}


class SessionManager {
  constructor(experimentManager) {
    this.experimentManager = experimentManager;
    this.sessionHistory = [];
    this.currentSessionData = null;
    this.sessionStartTime = null;
    this.lastActivityTime = null;
    this.idleThreshold = 5 * 60 * 1000; // 5 minutes
    this.maxSessionDuration = 30 * 60 * 1000; // 30 minutes
    this.isInitialized = false;
    this.DEBUG = true;
  }

  initialize() {
    if (this.isInitialized) return;
    
    this.bindEvents();
    this.setupActivityTracking();
    this.loadSessionHistory();
    this.isInitialized = true;
    
    if (this.DEBUG) {
      console.log('[SessionManager] Initialized');
    }
  }

  bindEvents() {
    window.addEventListener('experimentSessionStarted', (e) => {
      this.handleSessionStart(e.detail);
    });

    window.addEventListener('experimentSessionEnded', () => {
      this.handleSessionEnd();
    });

    window.addEventListener('beforeunload', () => {
      this.handlePageUnload();
    });

    window.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });
  }

  setupActivityTracking() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.updateLastActivity();
      }, true);
    });

    setInterval(() => {
      this.checkIdleStatus();
    }, 30000); // Check every 30 seconds
  }

  generateAdvancedRandomization(userId) {
    const seed = this.createSeedFromUserId(userId);
    const rng = this.createSeededRandom(seed);
    
    // Fisher-Yates shuffle with seeded random
    const permutations = [...Array(9).keys()];
    for (let i = permutations.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [permutations[i], permutations[j]] = [permutations[j], permutations[i]];
    }
    
    // Ensure balanced distribution across speed types
    const speedDistribution = this.validateSpeedDistribution(permutations);
    
    if (this.DEBUG) {
      console.log('[SessionManager] Generated randomization for', userId, permutations);
      console.log('[SessionManager] Speed distribution:', speedDistribution);
    }
    
    return permutations;
  }

  createSeedFromUserId(userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  createSeededRandom(seed) {
    let currentSeed = seed;
    return function() {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };
  }

  validateSpeedDistribution(permutations) {
    const speeds = ['slow', 'normal', 'fast'];
    const pacmanCounts = { slow: 0, normal: 0, fast: 0 };
    const ghostCounts = { slow: 0, normal: 0, fast: 0 };
    
    permutations.forEach(permId => {
      const config = this.experimentManager.PERMUTATIONS[permId];
      pacmanCounts[config.pacman]++;
      ghostCounts[config.ghost]++;
    });
    
    return { pacman: pacmanCounts, ghost: ghostCounts };
  }

  handleSessionStart(sessionInfo) {
    this.currentSessionData = {
      ...sessionInfo,
      startTime: Date.now(),
      events: [],
      milestones: [],
      deviceInfo: this.captureDeviceInfo(),
      browserInfo: this.captureBrowserInfo()
    };
    
    this.sessionStartTime = Date.now();
    this.updateLastActivity();
    this.saveSessionState();
    
    this.logMilestone('session_started', {
      sessionId: sessionInfo.sessionId,
      speedConfig: sessionInfo.speedConfig
    });
    
    if (this.DEBUG) {
      console.log('[SessionManager] Session started:', this.currentSessionData);
    }
  }

  handleSessionEnd() {
    if (!this.currentSessionData) return;
    
    const sessionDuration = Date.now() - this.sessionStartTime;
    
    this.logMilestone('session_ended', {
      duration: sessionDuration,
      totalEvents: this.currentSessionData.events.length
    });
    
    this.sessionHistory.push({
      ...this.currentSessionData,
      endTime: Date.now(),
      duration: sessionDuration,
      completed: true
    });
    
    this.saveSessionHistory();
    this.clearSessionState();
    this.currentSessionData = null;
    this.sessionStartTime = null;
    
    if (this.DEBUG) {
      console.log('[SessionManager] Session ended, duration:', sessionDuration);
    }
  }

  handlePageUnload() {
    if (this.currentSessionData) {
      this.logMilestone('page_unload', {
        duration: Date.now() - this.sessionStartTime,
        completed: false
      });
      
      this.saveSessionState();
      
      if (this.DEBUG) {
        console.log('[SessionManager] Page unload detected, session saved');
      }
    }
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.logMilestone('tab_hidden', {
        timestamp: Date.now()
      });
    } else {
      this.logMilestone('tab_visible', {
        timestamp: Date.now()
      });
      this.updateLastActivity();
    }
  }

  updateLastActivity() {
    this.lastActivityTime = Date.now();
  }

  checkIdleStatus() {
    if (!this.currentSessionData || !this.lastActivityTime) return;
    
    const idleTime = Date.now() - this.lastActivityTime;
    const sessionTime = Date.now() - this.sessionStartTime;
    
    if (idleTime > this.idleThreshold) {
      this.logMilestone('idle_detected', {
        idleTime: idleTime,
        sessionTime: sessionTime
      });
      
      this.handleIdleSession();
    }
    
    if (sessionTime > this.maxSessionDuration) {
      this.logMilestone('session_timeout', {
        sessionTime: sessionTime
      });
      
      this.handleSessionTimeout();
    }
  }

  handleIdleSession() {
    if (this.DEBUG) {
      console.log('[SessionManager] Idle session detected');
    }
    
    // Could trigger a warning or pause the game
    window.dispatchEvent(new CustomEvent('sessionIdle', {
      detail: {
        idleTime: Date.now() - this.lastActivityTime
      }
    }));
  }

  handleSessionTimeout() {
    if (this.DEBUG) {
      console.log('[SessionManager] Session timeout detected');
    }
    
    // Force end the session
    window.dispatchEvent(new CustomEvent('sessionTimeout', {
      detail: {
        sessionTime: Date.now() - this.sessionStartTime
      }
    }));
  }

  logMilestone(type, data = {}) {
    if (!this.currentSessionData) return;
    
    const milestone = {
      type,
      timestamp: Date.now(),
      sessionTime: Date.now() - this.sessionStartTime,
      ...data
    };
    
    this.currentSessionData.milestones.push(milestone);
    this.saveSessionState();
    
    if (this.DEBUG) {
      console.log('[SessionManager] Milestone:', type, data);
    }
  }

  captureDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenResolution: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }

  captureBrowserInfo() {
    return {
      url: window.location.href,
      referrer: document.referrer,
      title: document.title,
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      localStorageAvailable: this.testLocalStorage()
    };
  }

  testLocalStorage() {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  saveSessionState() {
    if (!this.currentSessionData || !this.experimentManager.userId) return;
    
    try {
      const stateData = {
        ...this.currentSessionData,
        lastSaved: Date.now()
      };
      
      localStorage.setItem(
        `session_state_${this.experimentManager.userId}`, 
        JSON.stringify(stateData)
      );
      
      return true;
    } catch (error) {
      console.error('[SessionManager] Error saving session state:', error);
      return false;
    }
  }

  loadSessionState() {
    if (!this.experimentManager.userId) return null;
    
    try {
      const stored = localStorage.getItem(`session_state_${this.experimentManager.userId}`);
      if (stored) {
        const stateData = JSON.parse(stored);
        
        // Check if session is recent (within 1 hour)
        const age = Date.now() - stateData.lastSaved;
        if (age < 60 * 60 * 1000) {
          return stateData;
        }
      }
      
      return null;
    } catch (error) {
      console.error('[SessionManager] Error loading session state:', error);
      return null;
    }
  }

  clearSessionState() {
    if (!this.experimentManager.userId) return;
    
    localStorage.removeItem(`session_state_${this.experimentManager.userId}`);
  }

  saveSessionHistory() {
    if (!this.experimentManager.userId) return;
    
    try {
      const historyData = {
        userId: this.experimentManager.userId,
        sessions: this.sessionHistory,
        lastUpdated: Date.now()
      };
      
      localStorage.setItem(
        `session_history_${this.experimentManager.userId}`, 
        JSON.stringify(historyData)
      );
      
      return true;
    } catch (error) {
      console.error('[SessionManager] Error saving session history:', error);
      return false;
    }
  }

  loadSessionHistory() {
    if (!this.experimentManager.userId) return;
    
    try {
      const stored = localStorage.getItem(`session_history_${this.experimentManager.userId}`);
      if (stored) {
        const historyData = JSON.parse(stored);
        this.sessionHistory = historyData.sessions || [];
      }
    } catch (error) {
      console.error('[SessionManager] Error loading session history:', error);
      this.sessionHistory = [];
    }
  }

  getSessionAnalytics() {
    const completed = this.sessionHistory.filter(s => s.completed);
    const incomplete = this.sessionHistory.filter(s => !s.completed);
    
    const avgDuration = completed.length > 0 
      ? completed.reduce((sum, s) => sum + s.duration, 0) / completed.length 
      : 0;
    
    const totalEvents = completed.reduce((sum, s) => sum + (s.events?.length || 0), 0);
    
    return {
      totalSessions: this.sessionHistory.length,
      completedSessions: completed.length,
      incompleteSessions: incomplete.length,
      averageDuration: avgDuration,
      totalEvents: totalEvents,
      sessionHistory: this.sessionHistory.map(s => ({
        sessionId: s.sessionId,
        speedConfig: s.speedConfig,
        duration: s.duration,
        completed: s.completed,
        events: s.events?.length || 0,
        milestones: s.milestones?.length || 0
      }))
    };
  }

  exportSessionData() {
    const analytics = this.getSessionAnalytics();
    const deviceInfo = this.captureDeviceInfo();
    const browserInfo = this.captureBrowserInfo();
    
    return {
      userId: this.experimentManager.userId,
      exportTimestamp: new Date().toISOString(),
      analytics,
      deviceInfo,
      browserInfo,
      fullSessionHistory: this.sessionHistory,
      currentSession: this.currentSessionData
    };
  }

  getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      currentSessionActive: this.currentSessionData !== null,
      sessionStartTime: this.sessionStartTime,
      lastActivityTime: this.lastActivityTime,
      sessionHistory: this.sessionHistory.length,
      idleThreshold: this.idleThreshold,
      maxSessionDuration: this.maxSessionDuration,
      analytics: this.getSessionAnalytics()
    };
  }
}


class SpeedController {
  constructor() {
    this.originalSpeeds = {
      pacman: null,
      ghosts: {}
    };
    this.currentMultipliers = {
      pacman: 1.0,
      ghost: 1.0
    };
    this.isInitialized = false;
  }

  initialize(gameCoordinator) {
    if (this.isInitialized) return;
    
    this.gameCoordinator = gameCoordinator;
    this.storeOriginalSpeeds();
    this.bindEvents();
    this.isInitialized = true;
  }

  storeOriginalSpeeds() {
    if (!this.gameCoordinator || !this.gameCoordinator.pacman) {
      console.warn('[SpeedController] Game entities not ready, deferring speed storage');
      return;
    }

    this.originalSpeeds.pacman = this.gameCoordinator.pacman.velocityPerMs;
    
    if (this.gameCoordinator.ghosts) {
      this.gameCoordinator.ghosts.forEach(ghost => {
        this.originalSpeeds.ghosts[ghost.name] = {
          slowSpeed: ghost.slowSpeed,
          mediumSpeed: ghost.mediumSpeed,
          fastSpeed: ghost.fastSpeed,
          scaredSpeed: ghost.scaredSpeed,
          transitionSpeed: ghost.transitionSpeed,
          eyeSpeed: ghost.eyeSpeed,
          defaultSpeed: ghost.defaultSpeed
        };
      });
    }

    console.log('[SpeedController] Original speeds stored:', this.originalSpeeds);
  }

  bindEvents() {
    window.addEventListener('speedConfigChanged', (e) => {
      this.applySpeedConfiguration(e.detail);
    });

    window.addEventListener('experimentSessionEnded', () => {
      this.resetToOriginalSpeeds();
    });
  }

  applySpeedConfiguration(detail) {
    const { pacmanMultiplier, ghostMultiplier, config } = detail;
    
    console.log('[SpeedController] Applying speed config:', config);
    
    this.currentMultipliers.pacman = pacmanMultiplier;
    this.currentMultipliers.ghost = ghostMultiplier;

    if (!this.gameCoordinator || !this.gameCoordinator.pacman) {
      console.warn('[SpeedController] Game entities not ready for speed application');
      return;
    }

    if (this.originalSpeeds.pacman === null) {
      this.storeOriginalSpeeds();
    }

    this.applyPacmanSpeed(pacmanMultiplier);
    this.applyGhostSpeeds(ghostMultiplier);
    
    console.log('[SpeedController] Speed configuration applied successfully');
  }

  applyPacmanSpeed(multiplier) {
    if (!this.gameCoordinator.pacman || this.originalSpeeds.pacman === null) {
      return;
    }

    const newSpeed = this.originalSpeeds.pacman * multiplier;
    this.gameCoordinator.pacman.velocityPerMs = newSpeed;
    
    console.log(`[SpeedController] Pacman speed: ${this.originalSpeeds.pacman} * ${multiplier} = ${newSpeed}`);
  }

  applyGhostSpeeds(multiplier) {
    if (!this.gameCoordinator.ghosts) {
      return;
    }

    this.gameCoordinator.ghosts.forEach(ghost => {
      const originalSpeeds = this.originalSpeeds.ghosts[ghost.name];
      if (!originalSpeeds) {
        console.warn(`[SpeedController] No original speeds found for ghost: ${ghost.name}`);
        return;
      }

      ghost.slowSpeed = originalSpeeds.slowSpeed * multiplier;
      ghost.mediumSpeed = originalSpeeds.mediumSpeed * multiplier;
      ghost.fastSpeed = originalSpeeds.fastSpeed * multiplier;
      ghost.scaredSpeed = originalSpeeds.scaredSpeed * multiplier;
      ghost.transitionSpeed = originalSpeeds.transitionSpeed * multiplier;
      ghost.eyeSpeed = originalSpeeds.eyeSpeed * multiplier;
      
      const currentSpeedType = this.determineCurrentSpeedType(ghost, originalSpeeds);
      ghost.defaultSpeed = originalSpeeds[currentSpeedType] * multiplier;
      ghost.velocityPerMs = ghost.defaultSpeed;

      console.log(`[SpeedController] ${ghost.name} speeds multiplied by ${multiplier}`);
    });
  }

  determineCurrentSpeedType(ghost, originalSpeeds) {
    if (Math.abs(ghost.defaultSpeed - originalSpeeds.slowSpeed) < 0.001) {
      return 'slowSpeed';
    } else if (Math.abs(ghost.defaultSpeed - originalSpeeds.mediumSpeed) < 0.001) {
      return 'mediumSpeed';
    } else if (Math.abs(ghost.defaultSpeed - originalSpeeds.fastSpeed) < 0.001) {
      return 'fastSpeed';
    }
    return 'slowSpeed';
  }

  resetToOriginalSpeeds() {
    console.log('[SpeedController] Resetting to original speeds');
    
    this.currentMultipliers.pacman = 1.0;
    this.currentMultipliers.ghost = 1.0;

    if (this.gameCoordinator && this.gameCoordinator.pacman && this.originalSpeeds.pacman !== null) {
      this.gameCoordinator.pacman.velocityPerMs = this.originalSpeeds.pacman;
    }

    if (this.gameCoordinator && this.gameCoordinator.ghosts) {
      this.gameCoordinator.ghosts.forEach(ghost => {
        const originalSpeeds = this.originalSpeeds.ghosts[ghost.name];
        if (originalSpeeds) {
          ghost.slowSpeed = originalSpeeds.slowSpeed;
          ghost.mediumSpeed = originalSpeeds.mediumSpeed;
          ghost.fastSpeed = originalSpeeds.fastSpeed;
          ghost.scaredSpeed = originalSpeeds.scaredSpeed;
          ghost.transitionSpeed = originalSpeeds.transitionSpeed;
          ghost.eyeSpeed = originalSpeeds.eyeSpeed;
          ghost.defaultSpeed = originalSpeeds.defaultSpeed;
          ghost.velocityPerMs = ghost.defaultSpeed;
        }
      });
    }
  }

  getCurrentConfiguration() {
    return {
      pacmanMultiplier: this.currentMultipliers.pacman,
      ghostMultiplier: this.currentMultipliers.ghost,
      isModified: this.currentMultipliers.pacman !== 1.0 || this.currentMultipliers.ghost !== 1.0
    };
  }

  getDebugInfo() {
    return {
      originalSpeeds: this.originalSpeeds,
      currentMultipliers: this.currentMultipliers,
      isInitialized: this.isInitialized,
      currentConfig: this.getCurrentConfiguration()
    };
  }
}


class Pickup {
  constructor(type, scaledTileSize, column, row, pacman, mazeDiv, points) {
    this.type = type;
    this.pacman = pacman;
    this.mazeDiv = mazeDiv;
    this.points = points;
    this.nearPacman = false;

    this.fruitImages = {
      100: 'cherry',
      300: 'strawberry',
      500: 'orange',
      700: 'apple',
      1000: 'melon',
      2000: 'galaxian',
      3000: 'bell',
      5000: 'key',
    };

    this.setStyleMeasurements(type, scaledTileSize, column, row, points);
  }

  /**
   * Resets the pickup's visibility
   */
  reset() {
    this.animationTarget.style.visibility = (this.type === 'fruit')
      ? 'hidden' : 'visible';
  }

  /**
   * Sets various style measurements for the pickup depending on its type
   * @param {('pacdot'|'powerPellet'|'fruit')} type - The classification of pickup
   * @param {number} scaledTileSize
   * @param {number} column
   * @param {number} row
   * @param {number} points
   */
  setStyleMeasurements(type, scaledTileSize, column, row, points) {
    if (type === 'pacdot') {
      this.size = scaledTileSize * 0.25;
      this.x = (column * scaledTileSize) + ((scaledTileSize / 8) * 3);
      this.y = (row * scaledTileSize) + ((scaledTileSize / 8) * 3);
    } else if (type === 'powerPellet') {
      this.size = scaledTileSize;
      this.x = (column * scaledTileSize);
      this.y = (row * scaledTileSize);
    } else {
      this.size = scaledTileSize * 2;
      this.x = (column * scaledTileSize) - (scaledTileSize * 0.5);
      this.y = (row * scaledTileSize) - (scaledTileSize * 0.5);
    }

    this.center = {
      x: column * scaledTileSize,
      y: row * scaledTileSize,
    };

    this.animationTarget = document.createElement('div');
    this.animationTarget.style.position = 'absolute';
    this.animationTarget.style.backgroundSize = `${this.size}px`;
    this.animationTarget.style.backgroundImage = this.determineImage(
      type, points,
    );
    this.animationTarget.style.height = `${this.size}px`;
    this.animationTarget.style.width = `${this.size}px`;
    this.animationTarget.style.top = `${this.y}px`;
    this.animationTarget.style.left = `${this.x}px`;
    this.mazeDiv.appendChild(this.animationTarget);

    if (type === 'powerPellet') {
      this.animationTarget.classList.add('power-pellet');
    }

    this.reset();
  }

  /**
   * Determines the Pickup image based on type and point value
   * @param {('pacdot'|'powerPellet'|'fruit')} type - The classification of pickup
   * @param {Number} points
   * @returns {String}
   */
  determineImage(type, points) {
    let image = '';

    if (type === 'fruit') {
      image = this.fruitImages[points] || 'cherry';
    } else {
      image = type;
    }

    return `url(app/style/graphics/spriteSheets/pickups/${image}.svg)`;
  }

  /**
   * Shows a bonus fruit, resetting its point value and image
   * @param {number} points
   */
  showFruit(points) {
    this.points = points;
    this.animationTarget.style.backgroundImage = this.determineImage(
      this.type, points,
    );
    this.animationTarget.style.visibility = 'visible';
  }

  /**
   * Makes the fruit invisible (happens if Pacman was too slow)
   */
  hideFruit() {
    this.animationTarget.style.visibility = 'hidden';
  }

  /**
   * Returns true if the Pickup is touching a bounding box at Pacman's center
   * @param {({ x: number, y: number, size: number})} pickup
   * @param {({ x: number, y: number, size: number})} originalPacman
   */
  checkForCollision(pickup, originalPacman) {
    const pacman = Object.assign({}, originalPacman);

    pacman.x += (pacman.size * 0.25);
    pacman.y += (pacman.size * 0.25);
    pacman.size /= 2;

    return (pickup.x < pacman.x + pacman.size
      && pickup.x + pickup.size > pacman.x
      && pickup.y < pacman.y + pacman.size
      && pickup.y + pickup.size > pacman.y);
  }

  /**
   * Checks to see if the pickup is close enough to Pacman to be considered for collision detection
   * @param {number} maxDistance - The maximum distance Pacman can travel per cycle
   * @param {({ x:number, y:number })} pacmanCenter - The center of Pacman's hitbox
   * @param {Boolean} debugging - Flag to change the appearance of pickups for testing
   */
  checkPacmanProximity(maxDistance, pacmanCenter, debugging) {
    if (this.animationTarget.style.visibility !== 'hidden') {
      const distance = Math.sqrt(
        ((this.center.x - pacmanCenter.x) ** 2)
        + ((this.center.y - pacmanCenter.y) ** 2),
      );

      this.nearPacman = (distance <= maxDistance);

      if (debugging) {
        this.animationTarget.style.background = this.nearPacman
          ? 'lime' : 'red';
      }
    }
  }

  /**
   * Checks if the pickup is visible and close to Pacman
   * @returns {Boolean}
   */
  shouldCheckForCollision() {
    return this.animationTarget.style.visibility !== 'hidden'
      && this.nearPacman;
  }

  /**
   * If the Pickup is still visible, it checks to see if it is colliding with Pacman.
   * It will turn itself invisible and cease collision-detection after the first
   * collision with Pacman.
   */
  update() {
    if (this.shouldCheckForCollision()) {
      if (this.checkForCollision(
        {
          x: this.x,
          y: this.y,
          size: this.size,
        }, {
          x: this.pacman.position.left,
          y: this.pacman.position.top,
          size: this.pacman.measurement,
        },
      )) {
        this.animationTarget.style.visibility = 'hidden';
        window.dispatchEvent(new CustomEvent('awardPoints', {
          detail: {
            points: this.points,
            type: this.type,
          },
        }));

        if (this.type === 'pacdot') {
          window.dispatchEvent(new Event('dotEaten'));
        } else if (this.type === 'powerPellet') {
          window.dispatchEvent(new Event('dotEaten'));
          window.dispatchEvent(new Event('powerUp'));
        }
      }
    }
  }
}


class CharacterUtil {
  constructor(scaledTileSize) {
    this.scaledTileSize = scaledTileSize;
    this.threshold = 5 * this.scaledTileSize;
    this.directions = {
      up: 'up',
      down: 'down',
      left: 'left',
      right: 'right',
    };
  }

  /**
   * Check if a given character has moved more than five in-game tiles during a frame.
   * If so, we want to temporarily hide the object to avoid 'animation stutter'.
   * @param {({top: number, left: number})} position - Position during the current frame
   * @param {({top: number, left: number})} oldPosition - Position during the previous frame
   * @returns {('hidden'|'visible')} - The new 'visibility' css property value for the character.
   */
  checkForStutter(position, oldPosition) {
    let stutter = false;

    if (position && oldPosition) {
      if (Math.abs(position.top - oldPosition.top) > this.threshold
        || Math.abs(position.left - oldPosition.left) > this.threshold) {
        stutter = true;
      }
    }

    return stutter ? 'hidden' : 'visible';
  }

  /**
   * Check which CSS property needs to be changed given the character's current direction
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @returns {('top'|'left')}
   */
  getPropertyToChange(direction) {
    switch (direction) {
      case this.directions.up:
      case this.directions.down:
        return 'top';
      default:
        return 'left';
    }
  }

  /**
   * Calculate the velocity for the character's next frame.
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {number} velocityPerMs - The distance to travel in a single millisecond
   * @returns {number} - Moving down or right is positive, while up or left is negative.
   */
  getVelocity(direction, velocityPerMs) {
    switch (direction) {
      case this.directions.up:
      case this.directions.left:
        return velocityPerMs * -1;
      default:
        return velocityPerMs;
    }
  }

  /**
   * Determine the next value which will be used to draw the character's position on screen
   * @param {number} interp - The percentage of the desired timestamp between frames
   * @param {('top'|'left')} prop - The css property to be changed
   * @param {({top: number, left: number})} oldPosition - Position during the previous frame
   * @param {({top: number, left: number})} position - Position during the current frame
   * @returns {number} - New value for css positioning
   */
  calculateNewDrawValue(interp, prop, oldPosition, position) {
    return oldPosition[prop] + (position[prop] - oldPosition[prop]) * interp;
  }

  /**
   * Convert the character's css position to a row-column on the maze array
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @returns {({x: number, y: number})}
   */
  determineGridPosition(position, scaledTileSize) {
    return {
      x: (position.left / scaledTileSize) + 0.5,
      y: (position.top / scaledTileSize) + 0.5,
    };
  }

  /**
   * Check to see if a character's desired direction results in turning around
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {('up'|'down'|'left'|'right')} desiredDirection - Character's desired orientation
   * @returns {boolean}
   */
  turningAround(direction, desiredDirection) {
    return desiredDirection === this.getOppositeDirection(direction);
  }

  /**
   * Calculate the opposite of a given direction
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @returns {('up'|'down'|'left'|'right')}
   */
  getOppositeDirection(direction) {
    switch (direction) {
      case this.directions.up:
        return this.directions.down;
      case this.directions.down:
        return this.directions.up;
      case this.directions.left:
        return this.directions.right;
      default:
        return this.directions.left;
    }
  }

  /**
   * Calculate the proper rounding function to assist with collision detection
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @returns {Function}
   */
  determineRoundingFunction(direction) {
    switch (direction) {
      case this.directions.up:
      case this.directions.left:
        return Math.floor;
      default:
        return Math.ceil;
    }
  }

  /**
   * Check to see if the character's next frame results in moving to a new tile on the maze array
   * @param {({x: number, y: number})} oldPosition - Position during the previous frame
   * @param {({x: number, y: number})} position - Position during the current frame
   * @returns {boolean}
   */
  changingGridPosition(oldPosition, position) {
    return (
      Math.floor(oldPosition.x) !== Math.floor(position.x)
            || Math.floor(oldPosition.y) !== Math.floor(position.y)
    );
  }

  /**
   * Check to see if the character is attempting to run into a wall of the maze
   * @param {({x: number, y: number})} desiredNewGridPosition - Character's target tile
   * @param {Array} mazeArray - The 2D array representing the game's maze
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @returns {boolean}
   */
  checkForWallCollision(desiredNewGridPosition, mazeArray, direction) {
    const roundingFunction = this.determineRoundingFunction(
      direction, this.directions,
    );

    const desiredX = roundingFunction(desiredNewGridPosition.x);
    const desiredY = roundingFunction(desiredNewGridPosition.y);
    let newGridValue;

    if (Array.isArray(mazeArray[desiredY])) {
      newGridValue = mazeArray[desiredY][desiredX];
    }

    return (newGridValue === 'X');
  }

  /**
   * Returns an object containing the new position and grid position based upon a direction
   * @param {({top: number, left: number})} position - css position during the current frame
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {number} velocityPerMs - The distance to travel in a single millisecond
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @returns {object}
   */
  determineNewPositions(
    position, direction, velocityPerMs, elapsedMs, scaledTileSize,
  ) {
    const newPosition = Object.assign({}, position);
    newPosition[this.getPropertyToChange(direction)]
      += this.getVelocity(direction, velocityPerMs) * elapsedMs;
    const newGridPosition = this.determineGridPosition(
      newPosition, scaledTileSize,
    );

    return {
      newPosition,
      newGridPosition,
    };
  }

  /**
   * Calculates the css position when snapping the character to the x-y grid
   * @param {({x: number, y: number})} position - The character's position during the current frame
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @returns {({top: number, left: number})}
   */
  snapToGrid(position, direction, scaledTileSize) {
    const newPosition = Object.assign({}, position);
    const roundingFunction = this.determineRoundingFunction(
      direction, this.directions,
    );

    switch (direction) {
      case this.directions.up:
      case this.directions.down:
        newPosition.y = roundingFunction(newPosition.y);
        break;
      default:
        newPosition.x = roundingFunction(newPosition.x);
        break;
    }

    return {
      top: (newPosition.y - 0.5) * scaledTileSize,
      left: (newPosition.x - 0.5) * scaledTileSize,
    };
  }

  /**
   * Returns a modified position if the character needs to warp
   * @param {({top: number, left: number})} position - css position during the current frame
   * @param {({x: number, y: number})} gridPosition - x-y position during the current frame
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @returns {({top: number, left: number})}
   */
  handleWarp(position, scaledTileSize, mazeArray) {
    const newPosition = Object.assign({}, position);
    const gridPosition = this.determineGridPosition(position, scaledTileSize);

    if (gridPosition.x < -0.75) {
      newPosition.left = (scaledTileSize * (mazeArray[0].length - 0.75));
    } else if (gridPosition.x > (mazeArray[0].length - 0.25)) {
      newPosition.left = (scaledTileSize * -1.25);
    }

    return newPosition;
  }

  /**
   * Advances spritesheet by one frame if needed
   * @param {Object} character - The character which needs to be animated
   */
  advanceSpriteSheet(character) {
    const {
      msSinceLastSprite,
      animationTarget,
      backgroundOffsetPixels,
    } = character;
    const updatedProperties = {
      msSinceLastSprite,
      animationTarget,
      backgroundOffsetPixels,
    };

    const ready = (character.msSinceLastSprite > character.msBetweenSprites)
      && character.animate;
    if (ready) {
      updatedProperties.msSinceLastSprite = 0;

      if (character.backgroundOffsetPixels
        < (character.measurement * (character.spriteFrames - 1))
      ) {
        updatedProperties.backgroundOffsetPixels += character.measurement;
      } else if (character.loopAnimation) {
        updatedProperties.backgroundOffsetPixels = 0;
      }

      const style = `-${updatedProperties.backgroundOffsetPixels}px 0px`;
      updatedProperties.animationTarget.style.backgroundPosition = style;
    }

    return updatedProperties;
  }
}


class SoundManager {
  constructor() {
    this.baseUrl = 'app/style/audio/';
    this.fileFormat = 'mp3';
    this.masterVolume = 1;
    this.paused = false;
    this.cutscene = true;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ambience = new AudioContext();
  }

  /**
   * Sets the cutscene flag to determine if players should be able to resume ambience
   * @param {Boolean} newValue
   */
  setCutscene(newValue) {
    this.cutscene = newValue;
  }

  /**
   * Sets the master volume for all sounds and stops/resumes ambience
   * @param {(0|1)} newVolume
   */
  setMasterVolume(newVolume) {
    this.masterVolume = newVolume;

    if (this.soundEffect) {
      this.soundEffect.volume = this.masterVolume;
    }

    if (this.dotPlayer) {
      this.dotPlayer.volume = this.masterVolume;
    }

    if (this.masterVolume === 0) {
      this.stopAmbience();
    } else {
      this.resumeAmbience(this.paused);
    }
  }

  /**
   * Plays a single sound effect
   * @param {String} sound
   */
  play(sound) {
    this.soundEffect = new Audio(`${this.baseUrl}${sound}.${this.fileFormat}`);
    this.soundEffect.volume = this.masterVolume;
    this.soundEffect.play();
  }

  /**
   * Special method for eating dots. The dots should alternate between two
   * sound effects, but not too quickly.
   */
  playDotSound() {
    this.queuedDotSound = true;

    if (!this.dotPlayer) {
      this.queuedDotSound = false;
      this.dotSound = (this.dotSound === 1) ? 2 : 1;

      this.dotPlayer = new Audio(
        `${this.baseUrl}dot_${this.dotSound}.${this.fileFormat}`,
      );
      this.dotPlayer.onended = this.dotSoundEnded.bind(this);
      this.dotPlayer.volume = this.masterVolume;
      this.dotPlayer.play();
    }
  }

  /**
   * Deletes the dotSound player and plays another dot sound if needed
   */
  dotSoundEnded() {
    this.dotPlayer = undefined;

    if (this.queuedDotSound) {
      this.playDotSound();
    }
  }

  /**
   * Loops an ambient sound
   * @param {String} sound
   */
  async setAmbience(sound, keepCurrentAmbience) {
    if (!this.fetchingAmbience && !this.cutscene) {
      if (!keepCurrentAmbience) {
        this.currentAmbience = sound;
        this.paused = false;
      } else {
        this.paused = true;
      }

      if (this.ambienceSource) {
        this.ambienceSource.stop();
      }

      if (this.masterVolume !== 0) {
        this.fetchingAmbience = true;
        const response = await fetch(
          `${this.baseUrl}${sound}.${this.fileFormat}`,
        );
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.ambience.decodeAudioData(arrayBuffer);

        this.ambienceSource = this.ambience.createBufferSource();
        this.ambienceSource.buffer = audioBuffer;
        this.ambienceSource.connect(this.ambience.destination);
        this.ambienceSource.loop = true;
        this.ambienceSource.start();

        this.fetchingAmbience = false;
      }
    }
  }

  /**
   * Resumes the ambience
   */
  resumeAmbience(paused) {
    if (this.ambienceSource) {
      // Resetting the ambience since an AudioBufferSourceNode can only
      // have 'start()' called once
      if (paused) {
        this.setAmbience('pause_beat', true);
      } else {
        this.setAmbience(this.currentAmbience);
      }
    }
  }

  /**
   * Stops the ambience
   */
  stopAmbience() {
    if (this.ambienceSource) {
      this.ambienceSource.stop();
    }
  }
}


class Timer {
  constructor(callback, delay) {
    this.callback = callback;
    this.remaining = delay;
    this.resume();
  }

  /**
   * Pauses the timer marks whether the pause came from the player
   * or the system
   * @param {Boolean} systemPause
   */
  pause(systemPause) {
    window.clearTimeout(this.timerId);
    this.remaining -= new Date() - this.start;
    this.oldTimerId = this.timerId;

    if (systemPause) {
      this.pausedBySystem = true;
    }
  }

  /**
   * Creates a new setTimeout based upon the remaining time, giving the
   * illusion of 'resuming' the old setTimeout
   * @param {Boolean} systemResume
   */
  resume(systemResume) {
    if (systemResume || !this.pausedBySystem) {
      this.pausedBySystem = false;

      this.start = new Date();
      this.timerId = window.setTimeout(() => {
        this.callback();
        window.dispatchEvent(new CustomEvent('removeTimer', {
          detail: {
            timer: this,
          },
        }));
      }, this.remaining);

      if (!this.oldTimerId) {
        window.dispatchEvent(new CustomEvent('addTimer', {
          detail: {
            timer: this,
          },
        }));
      }
    }
  }
}

