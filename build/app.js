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
    if (name === 'blinky' && this.defaultSpeed !== this.slowSpeed) {
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

    // Main user ID flow event listeners
    this.setupUserIdFlow();
    
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
    
    // Initialize experiment system
    this.initializeExperiment();
  }

  setupUserIdFlow() {
    const confirmUserIdBtn = document.getElementById('confirm-user-id');
    const userIdInput = document.getElementById('main-user-id-input');
    const userIdError = document.getElementById('user-id-error');

    if (confirmUserIdBtn && userIdInput) {
      confirmUserIdBtn.addEventListener('click', () => this.handleUserIdConfirmation());
      
      userIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleUserIdConfirmation();
        }
      });

      userIdInput.addEventListener('input', () => {
        // Clear error when user starts typing
        if (userIdError) {
          userIdError.textContent = '';
        }
      });

      // Check for auto-resume after End Session
      const autoResumeUserId = localStorage.getItem('autoResumeUserId');
      if (autoResumeUserId) {
        console.log('[GameCoordinator] Auto-resuming with user ID:', autoResumeUserId);
        
        // Remove the flag so it doesn't auto-resume again
        localStorage.removeItem('autoResumeUserId');
        
        // Fill in the user ID and trigger confirmation automatically
        userIdInput.value = autoResumeUserId;
        
        // Trigger confirmation after a brief delay to ensure UI is ready
        setTimeout(() => {
          this.handleUserIdConfirmation();
        }, 100);
      }
    }

    // Setup session management button event listeners
    this.setupSessionManagementButtons();
  }

  setupSessionManagementButtons() {
    const resetBtn = document.getElementById('main-reset-experiment-btn');
    const deleteLastBtn = document.getElementById('main-delete-last-session-btn');
    const exportBtn = document.getElementById('main-export-data-btn');

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (this.experimentUI) {
          this.experimentUI.handleResetExperiment();
        }
      });
    }

    if (deleteLastBtn) {
      deleteLastBtn.addEventListener('click', () => {
        if (this.experimentUI) {
          this.experimentUI.handleDeleteLastSession();
        }
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        if (this.experimentUI) {
          this.experimentUI.handleExportData();
        }
      });
    }
  }

  async handleUserIdConfirmation() {
    const userIdInput = document.getElementById('main-user-id-input');
    const userIdError = document.getElementById('user-id-error');
    const userIdSection = document.getElementById('user-id-section');
    const sessionInfoSection = document.getElementById('session-info-section');

    if (!userIdInput || !userIdError || !userIdSection || !sessionInfoSection) {
      console.error('[GameCoordinator] Required UI elements not found');
      return;
    }

    try {
      const userId = userIdInput.value.trim();
      if (!userId) {
        throw new Error('Please enter a User ID');
      }

      // Initialize experiment with the user ID
      if (!this.experimentManager) {
        console.error('[GameCoordinator] Experiment manager not initialized');
        throw new Error('System not ready. Please refresh the page.');
      }

      await this.experimentManager.initializeUser(userId);
      
      // Check if user has completed all sessions
      const completedSessions = this.experimentManager.getCompletedSessionsCount();
      if (completedSessions >= 9) {
        // Show experiment complete message
        this.showExperimentCompleteMessage();
        return;
      }

      // Get next session info WITHOUT creating the session yet
      const sessionInfo = this.experimentManager.getNextSessionInfo();
      
      // Update display elements
      this.updateSessionDisplay(sessionInfo);
      
      // Hide user ID section and show session info
      userIdSection.style.display = 'none';
      sessionInfoSection.style.display = 'block';
      
      // Show the PLAY button
      const gameStartButton = document.getElementById('game-start');
      if (gameStartButton) {
        gameStartButton.style.display = 'block';
      }

      // Show session management buttons
      const sessionManagement = document.getElementById('session-management');
      if (sessionManagement) {
        sessionManagement.style.display = 'block';
      }

      // Clear any errors
      userIdError.textContent = '';

      // Don't dispatch experimentSessionStarted yet - wait until PLAY is clicked

      console.log('[GameCoordinator] User ID confirmed, ready for session:', sessionInfo.sessionId);

    } catch (error) {
      console.error('[GameCoordinator] Error confirming user ID:', error);
      userIdError.textContent = error.message;
    }
  }

  updateSessionDisplay(session) {
    const displayUserId = document.getElementById('display-user-id');
    const displaySessionInfo = document.getElementById('display-session-info');
    const displaySpeedConfig = document.getElementById('display-speed-config');

    if (displayUserId) {
      displayUserId.textContent = session.userId;
    }

    if (displaySessionInfo) {
      displaySessionInfo.textContent = `${session.sessionId}/9`;
    }

    if (displaySpeedConfig) {
      displaySpeedConfig.textContent = `Pac-Man: ${session.speedConfig.pacman.toUpperCase()}, Ghosts: ${session.speedConfig.ghost.toUpperCase()}`;
    }
  }

  showExperimentCompleteMessage() {
    const userIdSection = document.getElementById('user-id-section');
    const sessionInfoSection = document.getElementById('session-info-section');
    
    if (userIdSection) {
      userIdSection.innerHTML = `
        <h3 class='experiment-title'>🎉 Experiment Complete! 🎉</h3>
        <p class='experiment-description'>User "${this.experimentManager.userId}" has completed all 9 sessions.</p>
        <p class='experiment-description'>Thank you for participating in our research!</p>
        <div style="margin-top: 20px;">
          <button id="export-final-data" class="confirm-user-id-btn">Export Data</button>
          <button id="start-new-experiment" class="confirm-user-id-btn" style="margin-left: 10px;">New Experiment</button>
        </div>
      `;

      // Bind new button events
      const exportBtn = document.getElementById('export-final-data');
      const newExpBtn = document.getElementById('start-new-experiment');
      
      if (exportBtn) {
        exportBtn.addEventListener('click', () => {
          if (this.exportManager) {
            this.exportManager.exportData('json');
          }
        });
      }

      if (newExpBtn) {
        newExpBtn.addEventListener('click', () => {
          this.resetForNewExperiment();
          location.reload(); // Refresh page for clean state
        });
      }
    }

    if (sessionInfoSection) {
      sessionInfoSection.style.display = 'none';
    }
  }

  async handleResetExperiment() {
    try {
      // Show confirmation dialog
      const confirmed = confirm(
        '⚠️ Are you sure you want to reset the experiment?\n\n' +
        'This will:\n' +
        '• Delete ALL session data\n' +
        '• Clear the user ID\n' +
        '• Remove data from both local storage and cloud database\n' +
        '• Start completely over\n\n' +
        'This action cannot be undone!'
      );

      if (!confirmed) {
        console.log('[GameCoordinator] Reset cancelled by user');
        return;
      }

      console.log('[GameCoordinator] 🔄 Starting experiment reset...');

      // Reset experiment data
      if (this.experimentManager) {
        const resetSuccess = await this.experimentManager.resetExperiment();
        if (!resetSuccess) {
          throw new Error('Failed to reset experiment data');
        }
      }

      // Reset UI state to initial user ID input
      this.resetUIToInitialState();

      console.log('[GameCoordinator] ✅ Experiment reset completed successfully');

    } catch (error) {
      console.error('[GameCoordinator] ❌ Error during experiment reset:', error);
      alert('Error resetting experiment: ' + error.message);
    }
  }

  resetUIToInitialState() {
    try {
      console.log('[GameCoordinator] 🔄 Starting UI reset to initial state...');

      // First, completely remove any experiment UI interfaces
      const experimentInterface = document.getElementById('experiment-interface');
      if (experimentInterface) {
        console.log('[GameCoordinator] 🗑️ Removing experiment interface');
        experimentInterface.remove();
      }

      // Stop any running game components
      if (this.gameEngine && this.gameEngine.running) {
        console.log('[GameCoordinator] ⏹️ Stopping game engine');
        this.gameEngine.stop();
      }

      // Hide the game UI and show main menu
      const gameUI = document.getElementById('game-ui');
      const mainMenu = document.getElementById('main-menu-container');
      
      if (gameUI) {
        gameUI.style.display = 'none';
        console.log('[GameCoordinator] 🫥 Hidden game UI');
      }
      
      if (mainMenu) {
        mainMenu.style.display = 'flex';
        console.log('[GameCoordinator] 👁️ Shown main menu');
      }

      // Get UI elements
      const userIdSection = document.getElementById('user-id-section');
      const sessionInfoSection = document.getElementById('session-info-section');
      const gameStartButton = document.getElementById('game-start');

      // Reset user ID section to initial state
      if (userIdSection) {
        userIdSection.innerHTML = `
          <h3 class='experiment-title'>Pac-Man Speed Research Study</h3>
          <p class='experiment-description'>Help us understand how speed affects gameplay</p>
          <div class='user-id-input-container'>
            <label for='main-user-id-input' class='user-id-label'>Enter your User ID:</label>
            <input type='text' id='main-user-id-input' class='user-id-input' placeholder='Enter unique identifier' />
            <button id='confirm-user-id' class='confirm-user-id-btn'>Continue</button>
          </div>
          <div id='user-id-error' class='user-id-error'></div>
        `;
        userIdSection.style.display = 'block';
        console.log('[GameCoordinator] ✅ Reset user ID section');
      }

      // Hide session info section
      if (sessionInfoSection) {
        sessionInfoSection.style.display = 'none';
        console.log('[GameCoordinator] 🫥 Hidden session info section');
      }

      // Hide game start button
      if (gameStartButton) {
        gameStartButton.style.display = 'none';
        console.log('[GameCoordinator] 🫥 Hidden game start button');
      }

      // Re-setup user ID flow event listeners
      this.setupUserIdFlow();

      // Reset game state flags for fresh initialization
      this.firstGame = true;
      console.log('[GameCoordinator] 🔄 Reset firstGame flag to true');

      // Reinitialize experiment system to ensure clean state
      if (this.experimentManager) {
        // Clear references to old experiment manager
        this.experimentManager = null;
        this.sessionManager = null;
        this.progressController = null;
        this.dataManager = null;
        this.exportManager = null;
        this.visualizationDashboard = null;
        this.experimentUI = null;
        this.speedController = null;
        this.metricsCollector = null;
        console.log('[GameCoordinator] 🧹 Cleared experiment references');
      }

      // Reinitialize experiment system after short delay
      setTimeout(() => {
        this.initializeExperiment();
        console.log('[GameCoordinator] 🔄 Reinitialized experiment system');
      }, 100);

      console.log('[GameCoordinator] ✅ UI reset to initial state completed');
    } catch (error) {
      console.error('[GameCoordinator] ❌ Error during UI reset:', error);
      // Fallback: reload page
      console.log('[GameCoordinator] 🔄 UI reset failed, reloading page...');
      window.location.reload();
    }
  }

  initializeExperiment() {
    this.experimentManager = new ExperimentManager();
    this.sessionManager = new SessionManager(this.experimentManager);
    this.progressController = new ProgressController(this.experimentManager, this.sessionManager);
    this.dataManager = new DataManager(this.experimentManager, this.sessionManager);
    this.exportManager = new ExportManager(this.experimentManager, this.sessionManager, this.dataManager);
    this.visualizationDashboard = new VisualizationDashboard(this.experimentManager, this.sessionManager, this.exportManager);
    this.experimentUI = new ExperimentUI(this.experimentManager);
    this.speedController = new SpeedController();
    this.metricsCollector = new MetricsCollector(this.experimentManager);
    
    // Initialize SpeedController immediately if entities already exist
    if (this.pacman && this.ghosts) {
      console.log('[GameCoordinator] 🚀 Entities already exist, initializing SpeedController immediately');
      this.speedController.initialize(this);
    }
    
    // Set cross-references
    this.experimentManager.sessionManager = this.sessionManager;
    this.experimentManager.progressController = this.progressController;
    this.experimentManager.dataManager = this.dataManager;
    this.experimentManager.exportManager = this.exportManager;
    this.experimentManager.visualizationDashboard = this.visualizationDashboard;
    
    this.sessionManager.initialize();
    this.progressController.initialize();
    this.dataManager.initialize();
    this.exportManager.initialize();
    this.visualizationDashboard.initialize();
    this.experimentUI.initialize();
    this.bindExperimentEvents();
  }

  bindExperimentEvents() {
    window.addEventListener('experimentSessionStarted', () => {
      if (this.metricsCollector && !this.metricsCollector.isInitialized) {
        this.metricsCollector.initialize(this);
      }
      if (this.experimentUI && this.metricsCollector) {
        this.experimentUI.setMetricsCollector(this.metricsCollector);
      }
      
      window.gameCoordinator = this;
      
      // Expose debug functions globally
      window.debugSpeeds = () => this.speedController.debugCurrentSpeeds();
      window.testSpeeds = () => {
        console.log('🧪 MANUAL SPEED TEST - Applying slow pacman, fast ghosts');
        this.speedController.applySpeedConfiguration({
          pacmanMultiplier: 0.3,
          ghostMultiplier: 3.0,
          config: { pacman: 'slow', ghost: 'fast' }
        });
      };
      
      console.log('[GameCoordinator] 📡 Experiment session started, SpeedController will initialize when game entities are ready');
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
  async startButtonClick() {
    // Check if experiment is properly initialized
    if (!this.experimentManager.userId) {
      console.warn('[GameCoordinator] Cannot start game - no user ID set');
      alert('Please enter a User ID and start an experiment session first.');
      return;
    }

    // Start the session if not already active (this creates the Supabase entry)
    if (!this.experimentManager.isExperimentActive) {
      try {
        console.log('[GameCoordinator] Starting experiment session...');
        const session = await this.experimentManager.startSession();
        console.log('[GameCoordinator] Session started:', session.sessionId);
      } catch (error) {
        console.error('[GameCoordinator] Failed to start session:', error);
        alert('Failed to start session: ' + error.message);
        return;
      }
    }

    // Always dispatch experiment session started event when game starts
    window.dispatchEvent(new CustomEvent('experimentSessionStarted', {
      detail: {
        sessionId: this.experimentManager.currentSession?.sessionId,
        speedConfig: this.experimentManager.currentSession?.speedConfig,
        completedSessions: this.experimentManager.getCompletedSessionsCount() - 1
      }
    }));

    // Hide session management buttons during gameplay
    const sessionManagement = document.getElementById('session-management');
    if (sessionManagement) {
      sessionManagement.style.display = 'none';
    }

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
    
    // Dispatch game started event for experiment tracking
    window.dispatchEvent(new CustomEvent('gameStarted', {
      detail: {
        sessionId: this.experimentManager.currentSession?.sessionId,
        speedConfig: this.experimentManager.currentSession?.speedConfig,
        timestamp: Date.now()
      }
    }));
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

    // Notify that game entities are ready
    console.log('[GameCoordinator] 🎮 Game entities created! Notifying SpeedController...');
    if (this.speedController && !this.speedController.isInitialized) {
      console.log('[GameCoordinator] 🚀 Initializing SpeedController NOW with ready entities');
      this.speedController.initialize(this);
    } else if (this.speedController && this.speedController.isInitialized) {
      console.log('[GameCoordinator] 🔄 Entities recreated, storing original speeds');
      this.speedController.storeOriginalSpeeds();
    }

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

      // Start the gameplay timer when player can actually move
      if (this.experimentManager && this.experimentManager.isExperimentActive) {
        this.experimentManager.startGameplayTimer();
      }

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
        
        // Resume experiment timer
        if (this.experimentManager && this.experimentManager.isExperimentActive) {
          this.experimentManager.resumeGameplayTimer();
        }
      } else {
        this.soundManager.stopAmbience();
        this.soundManager.setAmbience('pause_beat', true);
        this.gameUi.style.filter = 'blur(5px)';
        this.pausedText.style.visibility = 'visible';
        this.pauseButton.innerHTML = 'play_arrow';
        this.activeTimers.forEach((timer) => {
          timer.pause();
        });
        
        // Pause experiment timer
        if (this.experimentManager && this.experimentManager.isExperimentActive) {
          this.experimentManager.pauseGameplayTimer();
        }
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

    // End current experiment session
    this.endExperimentSession();

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
          this.showSessionTransition();
        }, 1000);
      }, 2500);
    }, 2250);
  }

  /**
   * Ends the current experiment session and handles session completion
   */
  endExperimentSession() {
    this.endExperimentSessionWithReason('game_over');
  }

  /**
   * Shows session transition UI - either next session prompt or experiment completion
   */
  showSessionTransition() {
    const completedSessions = this.experimentManager.getCompletedSessionsCount();
    const remainingSessions = this.experimentManager.getRemainingSessionsCount();

    if (remainingSessions > 0) {
      // Show next session prompt
      this.showNextSessionPrompt(completedSessions, remainingSessions);
    } else {
      // All sessions completed - show experiment completion
      this.showExperimentCompletion();
    }
  }

  /**
   * Shows prompt for starting next session
   */
  showNextSessionPrompt(completed, remaining) {
    const nextSessionId = completed + 1;
    const nextPermutation = this.experimentManager.sessionOrder[completed];
    const nextConfig = this.experimentManager.PERMUTATIONS[nextPermutation];

    // Create session transition overlay
    const transitionOverlay = document.createElement('div');
    transitionOverlay.id = 'session-transition';
    transitionOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 3000;
      font-family: monospace;
      color: white;
    `;

    transitionOverlay.innerHTML = `
      <div style="text-align: center; padding: 40px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; border: 2px solid #4CAF50;">
        <h2 style="color: #4CAF50; margin-bottom: 20px;">Session ${completed} Complete!</h2>
        <p style="margin: 15px 0;">Sessions completed: ${completed}/9</p>
        <p style="margin: 15px 0;">Sessions remaining: ${remaining}</p>
        <hr style="margin: 30px 0; border-color: #333;">
        <h3 style="color: #FFC107; margin-bottom: 15px;">Next Session Configuration:</h3>
        <p style="margin: 10px 0;">Session ${nextSessionId}</p>
        <p style="margin: 10px 0;">Pac-Man Speed: <strong>${nextConfig.pacman.toUpperCase()}</strong></p>
        <p style="margin: 10px 0;">Ghost Speed: <strong>${nextConfig.ghost.toUpperCase()}</strong></p>
        <div style="margin-top: 30px;">
          <button id="start-next-session" style="
            padding: 15px 30px;
            margin: 10px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            font-family: monospace;
          ">Start Session ${nextSessionId}</button>
          <button id="pause-experiment" style="
            padding: 15px 30px;
            margin: 10px;
            background: #FF9800;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            font-family: monospace;
          ">Pause Experiment</button>
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">
          Press Ctrl+D to view analytics dashboard
        </p>
      </div>
    `;

    document.body.appendChild(transitionOverlay);

    // Bind button events
    document.getElementById('start-next-session').addEventListener('click', () => {
      this.continueToNextSession();
      document.body.removeChild(transitionOverlay);
    });

    document.getElementById('pause-experiment').addEventListener('click', () => {
      document.body.removeChild(transitionOverlay);
      this.returnToMainMenuWithNewSession();
    });
  }

  /**
   * Shows experiment completion screen
   */
  showExperimentCompletion() {
    // Dispatch experiment complete event
    window.dispatchEvent(new CustomEvent('experimentComplete', {
      detail: {
        userId: this.experimentManager.userId,
        completedSessions: 9,
        totalSessions: 9,
        timestamp: Date.now()
      }
    }));

    const completionOverlay = document.createElement('div');
    completionOverlay.id = 'experiment-completion';
    completionOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 3000;
      font-family: monospace;
      color: white;
    `;

    completionOverlay.innerHTML = `
      <div style="text-align: center; padding: 40px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; border: 2px solid #4CAF50;">
        <h2 style="color: #4CAF50; margin-bottom: 20px;">🎉 Experiment Complete! 🎉</h2>
        <p style="margin: 15px 0; font-size: 18px;">All 9 sessions completed successfully!</p>
        <p style="margin: 15px 0;">User ID: <strong>${this.experimentManager.userId}</strong></p>
        <hr style="margin: 30px 0; border-color: #333;">
        <h3 style="color: #FFC107; margin-bottom: 15px;">Thank you for participating!</h3>
        <p style="margin: 10px 0;">Your data has been saved and is ready for export.</p>
        <div style="margin-top: 30px;">
          <button id="view-results" style="
            padding: 15px 30px;
            margin: 10px;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            font-family: monospace;
          ">View Results Dashboard</button>
          <button id="export-data" style="
            padding: 15px 30px;
            margin: 10px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            font-family: monospace;
          ">Export Data</button>
          <button id="new-experiment" style="
            padding: 15px 30px;
            margin: 10px;
            background: #FF9800;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            font-family: monospace;
          ">Start New Experiment</button>
        </div>
      </div>
    `;

    document.body.appendChild(completionOverlay);

    // Bind button events
    document.getElementById('view-results').addEventListener('click', () => {
      this.visualizationDashboard.generateCompleteDashboard();
      document.body.removeChild(completionOverlay);
      this.returnToMainMenu();
    });

    document.getElementById('export-data').addEventListener('click', () => {
      this.exportManager.exportData('json');
      document.body.removeChild(completionOverlay);
      this.returnToMainMenu();
    });

    document.getElementById('new-experiment').addEventListener('click', () => {
      document.body.removeChild(completionOverlay);
      this.resetForNewExperiment();
    });
  }

  /**
   * Continues to next session directly (used by session transition overlay)
   */
  async continueToNextSession() {
    try {
      const session = await this.experimentManager.startSession();
      
      // Update the session display
      this.updateSessionDisplay(session);
      
      // Show the main menu with session info already populated
      // Don't call reset() here - it should only be called when game starts
      this.mainMenu.style.opacity = 1;
      this.gameStartButton.disabled = false;
      this.mainMenu.style.visibility = 'visible';
      
      // Make sure session info is showing and PLAY button is visible
      const userIdSection = document.getElementById('user-id-section');
      const sessionInfoSection = document.getElementById('session-info-section');
      const gameStartButton = document.getElementById('game-start');
      
      if (userIdSection) userIdSection.style.display = 'none';
      if (sessionInfoSection) sessionInfoSection.style.display = 'block';
      if (gameStartButton) gameStartButton.style.display = 'block';
      
      // Dispatch session started event
      window.dispatchEvent(new CustomEvent('experimentSessionStarted', {
        detail: {
          sessionId: session.sessionId,
          speedConfig: session.speedConfig,
          completedSessions: this.experimentManager.getCompletedSessionsCount() - 1
        }
      }));
      
    } catch (error) {
      console.error('[GameCoordinator] Failed to continue to next session:', error);
      alert('Error starting next session: ' + error.message);
      this.returnToMainMenuWithNewSession();
    }
  }

  /**
   * Returns to main menu but prepares for new session selection
   */
  returnToMainMenuWithNewSession() {
    this.mainMenu.style.opacity = 1;
    this.gameStartButton.disabled = false;
    this.mainMenu.style.visibility = 'visible';
    
    // Reset to user ID input for potential different user
    const userIdSection = document.getElementById('user-id-section');
    const sessionInfoSection = document.getElementById('session-info-section');
    const userIdInput = document.getElementById('main-user-id-input');
    
    if (userIdSection) userIdSection.style.display = 'block';
    if (sessionInfoSection) sessionInfoSection.style.display = 'none';
    if (userIdInput) {
      userIdInput.value = this.experimentManager.userId || '';
      userIdInput.focus();
    }
  }

  /**
   * Starts the next experiment session (legacy method for compatibility)
   */
  startNextExperimentSession() {
    this.continueToNextSession();
  }

  /**
   * Returns to main menu
   */
  returnToMainMenu() {
    this.mainMenu.style.opacity = 1;
    this.gameStartButton.disabled = false;
    this.mainMenu.style.visibility = 'visible';
  }

  /**
   * Resets everything for a new experiment with different user
   */
  resetForNewExperiment() {
    // Reset experiment manager
    this.experimentManager.userId = null;
    this.experimentManager.sessionOrder = [];
    this.experimentManager.metrics = [];
    this.experimentManager.currentSession = null;
    this.experimentManager.currentMetrics = null;
    this.experimentManager.isExperimentActive = false;

    // Clear all storage for current experiment
    localStorage.clear();

    // Return to main menu
    this.returnToMainMenu();

    // Show experiment UI for new user setup
    if (this.experimentUI) {
      this.experimentUI.showUserIdPrompt();
    }
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
   * Handles level completion - for research purposes, ends session instead of advancing level
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
                  // Display level complete message
                  this.displayText(
                    {
                      left: this.scaledTileSize * 8,
                      top: this.scaledTileSize * 16.5,
                    },
                    'ready',  // Reusing "ready" text as "level complete"
                    3000,
                    this.scaledTileSize * 12,
                    this.scaledTileSize * 2,
                  );
                  
                  new Timer(() => {
                    // For research purposes, end session when level is completed
                    this.levelCompleteEndSession();
                  }, 3000);
                }, 250);
              }, 250);
            }, 250);
          }, 250);
        }, 250);
      }, 250);
    }, 2000);
  }

  /**
   * Ends session when level is completed (all dots collected)
   */
  levelCompleteEndSession() {
    localStorage.setItem('highScore', this.highScore);

    // End current experiment session with level complete reason
    this.endExperimentSessionWithReason('level_complete');

    this.leftCover.style.left = '0';
    this.rightCover.style.right = '0';

    setTimeout(() => {
      this.showSessionTransition();
    }, 1000);
  }

  /**
   * Ends the current experiment session with a specific reason
   */
  endExperimentSessionWithReason(reason) {
    if (this.experimentManager.isExperimentActive) {
      // Dispatch game ended event with reason
      window.dispatchEvent(new CustomEvent('gameEnded', {
        detail: {
          sessionId: this.experimentManager.currentSession?.sessionId,
          finalScore: this.points,
          gameTime: Date.now() - this.gameStartTime,
          reason: reason, // 'level_complete' or 'game_over'
          timestamp: Date.now()
        }
      }));

      // End the session in experiment manager with final score
      this.experimentManager.endSession(this.points);
      
      // Dispatch session ended event for other components
      window.dispatchEvent(new CustomEvent('experimentSessionEnded', {
        detail: {
          sessionId: this.experimentManager.currentSession?.sessionId || 'unknown',
          completedSessions: this.experimentManager.getCompletedSessionsCount(),
          reason: reason
        }
      }));
    }
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
    
    // Pause experiment timer during ghost eating pause
    if (this.experimentManager && this.experimentManager.isExperimentActive) {
      this.experimentManager.pauseGameplayTimer();
    }
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
      
      // Resume experiment timer after ghost eating pause
      if (this.experimentManager && this.experimentManager.isExperimentActive) {
        this.experimentManager.resumeGameplayTimer();
      }
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
        slow: 0.3, // Very slow - 30% of normal speed
        normal: 1.0, // Normal baseline
        fast: 2.5, // Very fast - 250% of normal speed
      },
      ghost: {
        slow: 0.2, // Very slow - 20% of normal speed
        normal: 1.0, // Normal baseline
        fast: 3.0, // Very fast - 300% of normal speed
      },
    };

    this.PERMUTATIONS = this.generatePermutations();
    this.currentSession = null;
    this.userId = null;
    this.sessionOrder = [];
    this.metrics = [];
    this.currentMetrics = null;
    this.gameStartTime = null;
    this.isExperimentActive = false;

    // Supabase integration
    this.supabaseManager = null;
    this.useSupabase = true; // Enable Supabase by default
    this.supabaseInitializing = false;
    this.supabaseInitialized = false;
    this.dataLoadedFromSupabase = false; // Track if we successfully loaded from Supabase
    
    // Database migration detection - clear localStorage if database changed
    this.checkDatabaseMigration();
    this.initializeSupabase();
  }

  checkDatabaseMigration() {
    // Expected database identifier for current deployment
    const currentDatabaseId = 'kozbxghtgtnoldywzdmg';
    const storageKey = 'experiment_database_id';
    
    try {
      const storedDatabaseId = localStorage.getItem(storageKey);
      
      if (storedDatabaseId && storedDatabaseId !== currentDatabaseId) {
        console.log('[ExperimentManager] 🔄 Database migration detected!');
        console.log('[ExperimentManager] Old database:', storedDatabaseId);
        console.log('[ExperimentManager] New database:', currentDatabaseId);
        console.log('[ExperimentManager] 🧹 Clearing localStorage for fresh start...');
        
        // Clear all experiment-related data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('experiment_')) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('[ExperimentManager] ✅ Cleared', keysToRemove.length, 'localStorage items');
      }
      
      // Update stored database ID
      localStorage.setItem(storageKey, currentDatabaseId);
    } catch (error) {
      console.warn('[ExperimentManager] Database migration check failed:', error);
    }
  }

  async initializeSupabase() {
    if (this.supabaseInitializing) {
      console.log('[ExperimentManager] ⏳ Supabase already initializing, waiting...');
      return;
    }

    this.supabaseInitializing = true;

    try {
      console.log('[ExperimentManager] 🔍 Checking SupabaseDataManager availability...');
      console.log('[ExperimentManager] typeof SupabaseDataManager:', typeof SupabaseDataManager);

      if (typeof SupabaseDataManager !== 'undefined') {
        console.log('[ExperimentManager] ✨ Creating SupabaseDataManager instance...');
        this.supabaseManager = new SupabaseDataManager();

        console.log('[ExperimentManager] 🚀 Initializing Supabase connection...');
        const initialized = await this.supabaseManager.initialize();

        if (initialized) {
          console.log('[ExperimentManager] 🚀 Supabase integration enabled');
          console.log('[ExperimentManager] Supabase URL:', this.supabaseManager.supabaseUrl);
          this.supabaseInitialized = true;
        } else {
          console.warn('[ExperimentManager] Supabase init failed, using localStorage');
          this.useSupabase = false;
        }
      } else {
        console.warn('[ExperimentManager] SupabaseDataManager not found, using localStorage');
        this.useSupabase = false;
      }
    } catch (error) {
      console.error('[ExperimentManager] Supabase initialization error:', error);
      console.error('[ExperimentManager] Error stack:', error.stack);
      this.useSupabase = false;
    } finally {
      this.supabaseInitializing = false;
    }
  }

  async waitForSupabaseInitialization() {
    if (this.supabaseInitialized) return true;
    if (!this.useSupabase) return false;

    // Wait up to 10 seconds for initialization
    const timeout = 10000;
    const startTime = Date.now();

    while (this.supabaseInitializing && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return this.supabaseInitialized;
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
          ghost: ghostSpeed,
        });
      }
    }
    return permutations;
  }

  getNextSessionInfo() {
    if (!this.userId) {
      throw new Error('User ID must be set before getting session info');
    }

    const completedSessions = this.getCompletedSessionsCount();
    if (completedSessions >= 9) {
      return null; // All sessions completed
    }

    const permutationId = this.sessionOrder[completedSessions];
    if (permutationId === undefined) {
      throw new Error('Session order not properly initialized');
    }

    const config = this.PERMUTATIONS[permutationId];
    if (!config) {
      throw new Error(`Invalid permutation ID: ${permutationId}`);
    }

    return {
      userId: this.userId,
      sessionId: completedSessions + 1,
      permutationId,
      speedConfig: config,
      completedSessions
    };
  }

  async initializeUser(userId) {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    this.userId = userId.trim();

    // Wait for Supabase initialization if it's enabled
    console.log('[ExperimentManager] 🔄 Waiting for Supabase initialization...');
    await this.waitForSupabaseInitialization();

    if (this.useSupabase && this.supabaseManager && this.supabaseInitialized) {
      try {
        console.log('[ExperimentManager] 🗃️ Loading user data from Supabase...');
        const supabaseSuccess = await this.loadUserDataFromSupabase();
        if (!supabaseSuccess) {
          console.log('[ExperimentManager] 📂 Supabase returned no data, checking localStorage...');
          this.loadUserData();
        }
      } catch (error) {
        console.error('[ExperimentManager] Supabase user init failed:', error);
        // Fallback to localStorage only if Supabase completely failed
        console.log('[ExperimentManager] 📂 Falling back to localStorage...');
        this.loadUserData();
      }
    } else {
      console.log('[ExperimentManager] 📂 Using localStorage for user data...');
      this.loadUserData();
    }

    if (this.sessionOrder.length === 0) {
      this.sessionOrder = this.generateRandomizedOrder();
      await this.saveUserData();
    }
  }

  async loadUserDataFromSupabase() {
    if (!this.supabaseManager) return false;

    try {
      const userData = await this.supabaseManager.getUserData(this.userId);
      if (userData) {
        this.sessionOrder = userData.sessionOrder || [];
        // Create metrics array based on completed sessions count
        // Each completed session adds one entry to maintain compatibility
        this.metrics = new Array(userData.completedSessionsCount).fill(null).map(() => ({}));
        console.log('[ExperimentManager] 📖 User data loaded from Supabase');
        console.log('[ExperimentManager] 📊 Completed sessions:', userData.completedSessionsCount);
        console.log('[ExperimentManager] 📋 Session order:', this.sessionOrder);
        console.log('[ExperimentManager] 📋 Created metrics array:', this.metrics);
        console.log('[ExperimentManager] 📋 Metrics array length:', this.metrics.length);
        this.dataLoadedFromSupabase = true; // Mark that we successfully loaded from Supabase
        return true;
      }
      // Initialize new user in Supabase
      await this.supabaseManager.initializeUser(this.userId, []);
      this.sessionOrder = [];
      this.metrics = [];
      return true;
    } catch (error) {
      console.error('[ExperimentManager] Error loading from Supabase:', error);
      return false;
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

  async startSession() {
    console.log('[ExperimentManager] 🟢 START SESSION CALLED');
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

    // Debug logging to help identify the issue
    console.log('[ExperimentManager] Debug - sessionOrder:', this.sessionOrder);
    console.log('[ExperimentManager] Debug - completedSessions:', completedSessions);
    console.log('[ExperimentManager] Debug - metrics array:', this.metrics);
    console.log('[ExperimentManager] Debug - metrics.length:', this.metrics.length);

    const permutationId = this.sessionOrder[completedSessions];
    console.log('[ExperimentManager] Debug - permutationId:', permutationId);

    if (permutationId === undefined) {
      throw new Error('Session order not properly initialized. Please refresh and try again.');
    }

    const config = this.PERMUTATIONS[permutationId];
    console.log('[ExperimentManager] Debug - config:', config);

    if (!config) {
      throw new Error(`Invalid permutation ID: ${permutationId}`);
    }

    this.currentSession = {
      userId: this.userId,
      sessionId: completedSessions + 1,
      permutationId,
      speedConfig: config,
      timestamp: new Date(),
      events: [],
      summary: {
        totalGhostsEaten: 0,
        totalPelletsEaten: 0,
        totalDeaths: 0,
        successfulTurns: 0,
        totalTurns: 0,
        gameTime: 0,
      },
      resumed: false,
      startTime: Date.now(),
    };

    this.currentMetrics = this.currentSession;
    this.gameStartTime = null; // Will be set when gameplay actually starts
    this.gameplayStarted = false;
    this.gameplayPausedTime = 0; // Total time paused
    this.lastPauseStart = null;
    this.isExperimentActive = true;

    // Create session in Supabase
    if (this.useSupabase && this.supabaseManager) {
      try {
        await this.supabaseManager.createSession(this.currentSession);
        console.log('[ExperimentManager] 📊 Session created in Supabase');
      } catch (error) {
        console.error('[ExperimentManager] Failed to create Supabase session:', error);
      }
    }

    console.log('[ExperimentManager] 🎯 About to apply speed configuration:', config);
    this.applySpeedConfiguration(config);
    this.saveCurrentSession();

    return this.currentSession;
  }

  canResumeSession(savedState) {
    const age = Date.now() - (savedState.lastSaved || savedState.startTime || 0);
    const maxAge = 60 * 60 * 1000; // 1 hour

    // Check if this saved session matches the expected next session
    const expectedSessionId = this.getCompletedSessionsCount() + 1;
    const sessionMatches = savedState.sessionId === expectedSessionId;

    console.log('[ExperimentManager] Resume session check:');
    console.log('- Saved session ID:', savedState.sessionId);
    console.log('- Expected session ID:', expectedSessionId);
    console.log('- Session matches:', sessionMatches);
    console.log('- Age check passed:', age < maxAge);

    return age < maxAge
           && savedState.userId === this.userId
           && savedState.sessionId > 0
           && savedState.sessionId <= 9
           && sessionMatches; // Only resume if it's the correct session
  }

  resumeSession(savedState) {
    console.log('[ExperimentManager] Resuming previous session:', savedState.sessionId);

    this.currentSession = {
      ...savedState,
      resumed: true,
      resumeTime: Date.now(),
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

    console.log('[ExperimentManager] 🚀 DISPATCHING SPEED CONFIG EVENT');
    console.log('[ExperimentManager] Config:', config);
    console.log('[ExperimentManager] Pac-Man multiplier:', pacmanMultiplier);
    console.log('[ExperimentManager] Ghost multiplier:', ghostMultiplier);

    // Store the config for retry if needed
    this.pendingSpeedConfig = { pacmanMultiplier, ghostMultiplier, config };

    const event = new CustomEvent('speedConfigChanged', {
      detail: {
        pacmanMultiplier,
        ghostMultiplier,
        config,
      },
    });

    window.dispatchEvent(event);
    console.log('[ExperimentManager] ✅ Speed config event dispatched');

    // Also try direct application via gameCoordinator if available
    if (window.gameCoordinator && window.gameCoordinator.speedController && window.gameCoordinator.speedController.isInitialized) {
      console.log('[ExperimentManager] 🔄 Applying speeds directly as backup');
      window.gameCoordinator.speedController.applySpeedConfiguration({
        pacmanMultiplier,
        ghostMultiplier,
        config,
      });
    }
  }

  async logEvent(type, data = {}) {
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
        userId: this.userId,
        data,
      };

      this.currentMetrics.events.push(event);
      this.updateSummary(type, data);
      this.saveCurrentSession();

      // Log to Supabase
      if (this.useSupabase && this.supabaseManager) {
        try {
          console.log('[ExperimentManager] 📝 Logging event to Supabase:', type, data);
          const success = await this.supabaseManager.logEvent(event);
          if (success) {
            console.log('[ExperimentManager] ✅ Event logged to Supabase successfully');
          } else {
            console.warn('[ExperimentManager] ⚠️ Event logging to Supabase returned false');
          }
        } catch (error) {
          console.error('[ExperimentManager] ❌ Failed to log event to Supabase:', error);
        }
      } else {
        console.log('[ExperimentManager] 📋 Skipping Supabase event log - useSupabase:', this.useSupabase, 'supabaseManager:', !!this.supabaseManager);
      }

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

    const { summary } = this.currentMetrics;

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

  startGameplayTimer() {
    if (!this.isExperimentActive || this.gameplayStarted) return;

    this.gameStartTime = Date.now();
    this.gameplayStarted = true;
    this.gameplayPausedTime = 0;
    this.lastPauseStart = null;

    console.log('[ExperimentManager] ⏱️ Gameplay timer started');
  }

  pauseGameplayTimer() {
    if (!this.gameplayStarted || this.lastPauseStart) return;

    this.lastPauseStart = Date.now();
    console.log('[ExperimentManager] ⏸️ Gameplay timer paused');
  }

  resumeGameplayTimer() {
    if (!this.gameplayStarted || !this.lastPauseStart) return;

    const pauseDuration = Date.now() - this.lastPauseStart;
    this.gameplayPausedTime += pauseDuration;
    this.lastPauseStart = null;

    console.log(`[ExperimentManager] ▶️ Gameplay timer resumed (paused for ${pauseDuration}ms)`);
  }

  getGameplayTime() {
    if (!this.gameStartTime) return 0;

    const currentTime = Date.now();
    let totalTime = currentTime - this.gameStartTime;

    // Subtract total paused time
    totalTime -= this.gameplayPausedTime;

    // If currently paused, subtract current pause duration
    if (this.lastPauseStart) {
      totalTime -= (currentTime - this.lastPauseStart);
    }

    return Math.max(0, totalTime);
  }

  async endSession(finalScore = 0) {
    if (!this.isExperimentActive || !this.currentMetrics) return;

    // Ensure timer is properly stopped and calculate final time
    if (this.lastPauseStart) {
      this.resumeGameplayTimer(); // Close any open pause
    }

    this.currentMetrics.summary.gameTime = this.getGameplayTime();
    this.currentMetrics.summary.finalScore = finalScore;
    this.metrics.push(this.currentMetrics);

    // Complete session in Supabase
    if (this.useSupabase && this.supabaseManager) {
      try {
        // Update session summary with final metrics
        await this.supabaseManager.updateSessionSummary({
          totalGhostsEaten: this.currentMetrics.summary.totalGhostsEaten,
          totalPelletsEaten: this.currentMetrics.summary.totalPelletsEaten,
          totalPacdotsEaten: this.getDetailedCount('pacdot'),
          totalPowerPelletsEaten: this.getDetailedCount('powerPellet'),
          totalFruitsEaten: this.getDetailedCount('fruit'),
          totalDeaths: this.currentMetrics.summary.totalDeaths,
          successfulTurns: this.currentMetrics.summary.successfulTurns,
          totalTurns: this.currentMetrics.summary.totalTurns,
          finalScore: finalScore,
        });

        // Mark session as completed with final score
        await this.supabaseManager.completeSession(this.currentMetrics.summary.gameTime, finalScore);
        
        // Update score statistics for all user sessions
        await this.supabaseManager.updateScoreStatistics(this.userId);
        
        console.log('[ExperimentManager] ✅ Session completed in Supabase');
      } catch (error) {
        console.error('[ExperimentManager] Failed to complete Supabase session:', error);
      }
    }

    // Save to CSV after session completion
    // this.saveSessionToCSV(this.currentMetrics); // Disabled - CSV export not needed after each session

    await this.saveUserData();
    this.clearCurrentSession();

    this.isExperimentActive = false;
    this.currentMetrics = null;
    this.gameStartTime = null;
    this.gameplayStarted = false;
    this.gameplayPausedTime = 0;
    this.lastPauseStart = null;
  }

  getDetailedCount(eventType) {
    if (!this.currentMetrics || !this.currentMetrics.events) return 0;
    return this.currentMetrics.events.filter(event => event.type === 'pelletEaten' && event.data && event.data.type === eventType).length;
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
      speedConfig: this.currentSession.speedConfig,
    };
  }

  async saveUserData() {
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
        version: '1.0',
      };

      const serialized = JSON.stringify(userData);
      if (serialized.length > 5000000) { // 5MB limit
        console.warn('[ExperimentManager] User data too large, truncating old sessions');
        userData.metrics = userData.metrics.slice(-5); // Keep only last 5 sessions
      }

      // Save to localStorage for backward compatibility
      localStorage.setItem(`experiment_${this.userId}`, JSON.stringify(userData));

      // Update session order in Supabase
      if (this.useSupabase && this.supabaseManager) {
        try {
          await this.supabaseManager.updateUserSessionOrder(this.userId, this.sessionOrder);
        } catch (error) {
          console.error('[ExperimentManager] Failed to update Supabase session order:', error);
        }
      }

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

    // Don't override Supabase data if we successfully loaded from there
    if (this.dataLoadedFromSupabase) {
      console.log('[ExperimentManager] Skipping localStorage - already loaded from Supabase');
      return true;
    }

    try {
      const stored = localStorage.getItem(`experiment_${this.userId}`);
      if (stored) {
        const userData = JSON.parse(stored);

        if (this.validateUserData(userData)) {
          this.sessionOrder = userData.sessionOrder || [];
          this.metrics = userData.metrics || [];
          return true;
        }
        console.warn('[ExperimentManager] Invalid user data format, resetting');
        this.resetUserData();
        return false;
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
      totalSessions: this.metrics.length,
    };

    if (format === 'csv') {
      return this.convertToCSV(exportData);
    }

    return JSON.stringify(exportData, null, 2);
  }

  convertToCSV(data) {
    const headers = [
      'userId', 'sessionId', 'sessionType', 'permutationId', 'pacmanSpeed', 'ghostSpeed',
      'totalGhostsEaten', 'totalPelletsEaten', 'totalDeaths',
      'successfulTurns', 'totalTurns', 'gameTime', 'timestamp',
    ];

    const rows = data.metrics.map(session => [
      session.userId,
      session.sessionId,
      session.permutationId + 1, // Session type (1-9)
      session.permutationId,
      session.speedConfig.pacman,
      session.speedConfig.ghost,
      session.summary.totalGhostsEaten,
      session.summary.totalPelletsEaten,
      session.summary.totalDeaths,
      session.summary.successfulTurns,
      session.summary.totalTurns,
      session.summary.gameTime,
      session.timestamp,
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  saveSessionToCSV(sessionData) {
    if (!sessionData || !this.userId) {
      console.warn('[ExperimentManager] Cannot save session to CSV - missing data');
      return false;
    }

    try {
      const csvData = this.convertSessionToCSVRow(sessionData);
      const filename = `pacman_experiment_${this.userId}.csv`;

      // Check if this is the first session for this user
      const existingCSV = localStorage.getItem(`csv_${this.userId}`);
      let fullCSV;

      if (!existingCSV) {
        // First session - include headers
        const headers = [
          'userId', 'sessionId', 'sessionType', 'permutationId', 'pacmanSpeed', 'ghostSpeed',
          'totalGhostsEaten', 'totalPelletsEaten', 'totalDeaths',
          'successfulTurns', 'totalTurns', 'gameTime', 'timestamp',
        ];
        fullCSV = `${headers.join(',')}\n${csvData}`;
      } else {
        // Append to existing CSV
        fullCSV = `${existingCSV}\n${csvData}`;
      }

      // Save to localStorage for persistence
      localStorage.setItem(`csv_${this.userId}`, fullCSV);

      // Also trigger download
      this.downloadCSV(fullCSV, filename);

      console.log('[ExperimentManager] Session saved to CSV:', filename);
      return true;
    } catch (error) {
      console.error('[ExperimentManager] Error saving session to CSV:', error);
      return false;
    }
  }

  convertSessionToCSVRow(session) {
    return [
      session.userId,
      session.sessionId,
      session.permutationId + 1, // Session type (1-9)
      session.permutationId,
      session.speedConfig.pacman,
      session.speedConfig.ghost,
      session.summary.totalGhostsEaten,
      session.summary.totalPelletsEaten,
      session.summary.totalDeaths,
      session.summary.successfulTurns,
      session.summary.totalTurns,
      session.summary.gameTime,
      session.timestamp,
    ].join(',');
  }

  downloadCSV(csvContent, filename) {
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log('[ExperimentManager] CSV file downloaded:', filename);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[ExperimentManager] Error downloading CSV:', error);
      return false;
    }
  }

  exportUserCSV() {
    if (!this.userId) {
      console.warn('[ExperimentManager] Cannot export CSV - no user ID');
      return false;
    }

    const csvData = localStorage.getItem(`csv_${this.userId}`);
    if (!csvData) {
      console.warn('[ExperimentManager] No CSV data found for user:', this.userId);
      return false;
    }

    const filename = `pacman_experiment_${this.userId}_complete.csv`;
    return this.downloadCSV(csvData, filename);
  }

  /**
   * Export user data from Supabase for research analysis
   */
  async exportSupabaseData() {
    if (!this.useSupabase || !this.supabaseManager) {
      console.warn('[ExperimentManager] Supabase not available');
      return null;
    }

    try {
      const data = await this.supabaseManager.exportUserData(this.userId);
      if (data) {
        const filename = `pacman_supabase_${this.userId}_${new Date().toISOString().split('T')[0]}.json`;
        this.downloadJSON(JSON.stringify(data, null, 2), filename);
        console.log('[ExperimentManager] ✅ Supabase data exported:', filename);
        return data;
      }
      return null;
    } catch (error) {
      console.error('[ExperimentManager] Error exporting Supabase data:', error);
      return null;
    }
  }

  /**
   * Get aggregated research data (for researchers)
   */
  async getResearchData(filters = {}) {
    if (!this.useSupabase || !this.supabaseManager) {
      console.warn('[ExperimentManager] Supabase not available');
      return null;
    }

    try {
      return await this.supabaseManager.getResearchData(filters);
    } catch (error) {
      console.error('[ExperimentManager] Error getting research data:', error);
      return null;
    }
  }

  /**
   * Download JSON data
   */
  downloadJSON(jsonContent, filename) {
    try {
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[ExperimentManager] Error downloading JSON:', error);
      return false;
    }
  }

  /**
   * Test Supabase connection
   */
  async testSupabaseConnection() {
    if (!this.useSupabase || !this.supabaseManager) {
      return false;
    }

    try {
      return await this.supabaseManager.testConnection();
    } catch (error) {
      console.error('[ExperimentManager] Supabase connection test failed:', error);
      return false;
    }
  }

  /**
   * Get database health statistics
   */
  async getSupabaseHealthStats() {
    if (!this.useSupabase || !this.supabaseManager) {
      return null;
    }

    try {
      return await this.supabaseManager.getHealthStats();
    } catch (error) {
      console.error('[ExperimentManager] Error getting health stats:', error);
      return null;
    }
  }

  /**
   * Reset all experiment data (localStorage and Supabase)
   */
  async resetExperiment() {
    try {
      console.log('[ExperimentManager] 🔄 Starting experiment reset...');

      // Get current user ID before reset
      const userIdToDelete = this.userId;

      // Stop any current session
      if (this.isExperimentActive) {
        this.isExperimentActive = false;
        this.currentSession = null;
        this.currentMetrics = null;
        this.gameStartTime = null;
        console.log('[ExperimentManager] ⏹️ Stopped current session');
      }

      // Clear localStorage data
      try {
        localStorage.removeItem('pacman-experiment-user-id');
        localStorage.removeItem(`pacman-experiment-${userIdToDelete}`);
        console.log('[ExperimentManager] ✅ Cleared localStorage data');
      } catch (error) {
        console.warn('[ExperimentManager] ⚠️ Error clearing localStorage:', error);
      }

      // Clear Supabase data if available and user exists
      if (userIdToDelete && this.useSupabase && this.supabaseManager) {
        try {
          console.log('[ExperimentManager] 🗑️ Deleting Supabase data for user:', userIdToDelete);
          const supabaseResult = await this.supabaseManager.deleteUserData(userIdToDelete);
          if (supabaseResult && supabaseResult.success) {
            console.log('[ExperimentManager] ✅ Supabase data deleted successfully:', supabaseResult.message);
          } else {
            console.warn('[ExperimentManager] ⚠️ Supabase deletion failed:', supabaseResult?.message || 'Unknown error');
            // Don't throw error here - continue with reset even if Supabase fails
          }
        } catch (error) {
          console.warn('[ExperimentManager] ⚠️ Error deleting Supabase data:', error);
          // Don't throw error here - continue with reset even if Supabase fails
        }
      }

      // Reset instance variables
      this.userId = null;
      this.sessionOrder = [];
      this.metrics = [];
      this.currentSession = null;
      this.currentMetrics = null;
      this.gameStartTime = null;
      this.isExperimentActive = false;
      this.dataLoadedFromSupabase = false;

      console.log('[ExperimentManager] 🎉 Experiment reset completed successfully');
      return true;
    } catch (error) {
      console.error('[ExperimentManager] ❌ Error during experiment reset:', error);
      return false;
    }
  }

  /**
   * Delete the last session's data from Supabase and localStorage
   */
  async deleteLastSession() {
    try {
      console.log('[ExperimentManager] 🗑️ Starting deletion of last session...');

      if (!this.userId) {
        throw new Error('No user ID available');
      }

      // Delete from Supabase if available
      let supabaseResult = null;
      if (this.useSupabase && this.supabaseManager) {
        try {
          console.log('[ExperimentManager] 🗑️ Deleting last session from Supabase for user:', this.userId);
          supabaseResult = await this.supabaseManager.deleteLastSession(this.userId);
          if (supabaseResult.success) {
            console.log('[ExperimentManager] ✅ Supabase last session deleted:', supabaseResult.message);
          } else {
            console.warn('[ExperimentManager] ⚠️ Supabase deletion failed:', supabaseResult.message);
          }
        } catch (error) {
          console.warn('[ExperimentManager] ⚠️ Error deleting from Supabase:', error);
        }
      }

      // Remove last session from localStorage metrics
      if (this.metrics && this.metrics.length > 0) {
        const removedSession = this.metrics.pop();
        console.log('[ExperimentManager] ✅ Removed last session from localStorage metrics');
        
        // Update localStorage
        try {
          const storageKey = `pacman-experiment-${this.userId}`;
          const userData = {
            userId: this.userId,
            sessionOrder: this.sessionOrder,
            metrics: this.metrics,
            lastUpdated: new Date().toISOString()
          };
          localStorage.setItem(storageKey, JSON.stringify(userData));
          console.log('[ExperimentManager] ✅ Updated localStorage after session deletion');
        } catch (error) {
          console.warn('[ExperimentManager] ⚠️ Error updating localStorage:', error);
        }
      }

      const message = supabaseResult ? supabaseResult.message : 'Last session removed from local data';
      console.log('[ExperimentManager] 🎉 Last session deletion completed:', message);
      
      return { 
        success: true, 
        message,
        supabaseResult
      };
    } catch (error) {
      console.error('[ExperimentManager] ❌ Error during last session deletion:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  }

  getDebugInfo() {
    return {
      userId: this.userId,
      currentSession: (this.currentSession && this.currentSession.sessionId) || null,
      completedSessions: this.getCompletedSessionsCount(),
      remainingSessions: this.getRemainingSessionsCount(),
      sessionOrder: this.sessionOrder,
      isExperimentActive: this.isExperimentActive,
      supabaseEnabled: this.useSupabase,
      supabaseInitialized: this.supabaseManager ? this.supabaseManager.isInitialized : false,
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
    this.isTestEnvironment = typeof document === 'undefined';
  }

  initialize() {
    if (this.isInitialized) return;

    this.createExperimentInterface();
    this.bindEvents();
    this.isInitialized = true;
  }

  createExperimentInterface() {
    // Skip DOM operations in test environment
    if (typeof document === 'undefined') return;

    const existingInterface = document.getElementById('experiment-interface');
    if (existingInterface) {
      existingInterface.remove();
    }

    // Create a minimal debug-only interface since main menu handles user input
    const baseStyle = 'position: fixed; top: 10px; left: 10px; z-index: 1000;';
    const containerStyle = 'background: rgba(0,0,0,0.8); color: white; '
      + 'padding: 12px;';
    const sizeStyle = 'border-radius: 8px; font-family: monospace; '
      + 'max-width: 350px; min-width: 280px;';
    const fontStyle = 'font-size: 12px; line-height: 1.4;';
    const showStyle = this.DEBUG ? '' : 'display: none;';

    const interfaceHTML = `
      <div id="experiment-interface" style="${baseStyle} ${containerStyle} 
        ${sizeStyle} ${fontStyle} ${showStyle}">
        <div id="experiment-session" style="display: none;">
          <div style="display: flex; justify-content: space-between; 
            align-items: center; margin-bottom: 5px;">
            <h4 style="margin: 0; color: #ffff00; font-size: 12px;">
              Live Metrics
            </h4>
            <button id="minimize-metrics-btn" style="background: none; 
              border: none; color: #ffff00; cursor: pointer; font-size: 14px; 
              padding: 0; line-height: 1;" title="Minimize">
              ▼
            </button>
          </div>
          <div id="metrics-content" style="display: block;">
          <div id="session-info" style="margin-bottom: 8px; font-size: 11px; 
            background: rgba(0,0,0,0.4); padding: 8px; border-radius: 4px;">
          </div>
          <div id="speed-config" style="margin-bottom: 8px; font-size: 11px; 
            background: rgba(0,0,0,0.4); padding: 8px; border-radius: 4px;">
          </div>
          <div id="metrics-display" style="margin-bottom: 8px; font-size: 11px; 
            background: rgba(0,0,0,0.4); padding: 8px; border-radius: 4px;">
          </div>
          <div id="progress-info" style="margin-bottom: 8px; font-size: 11px; 
            background: rgba(0,0,0,0.4); padding: 8px; border-radius: 4px;">
          </div>
          <button id="end-session-btn" style="width: 100%; padding: 8px; 
            background: #ff4444; border: none; border-radius: 4px; 
            cursor: pointer; font-size: 11px; font-weight: bold; color: white;">
            End Session
          </button>
          </div>
        </div>
        
        <div id="experiment-complete" style="display: none;">
          <h4 style="margin: 0 0 5px 0; color: #00ff00; font-size: 12px;">
            Experiment Complete!
          </h4>
          <p style="margin: 0 0 8px 0; font-size: 10px;">
            All 9 sessions completed.
          </p>
          <button id="export-final-data-btn" style="width: 100%; padding: 4px; 
            background: #00ff00; border: none; border-radius: 2px; 
            cursor: pointer; font-size: 10px;">
            Export Data
          </button>
          <button id="reset-experiment-btn" style="width: 100%; padding: 4px; 
            background: #ff4444; border: none; border-radius: 2px; 
            cursor: pointer; margin-top: 3px; font-size: 10px;">
            Reset
          </button>
        </div>

        ${this.DEBUG ? this.createDebugPanel() : ''}
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', interfaceHTML);
  }

  showUserIdPrompt() {
    // User ID input is now handled by the main menu
    // This method kept for compatibility but does nothing
  }

  createDebugPanel() {
    return `
      <div id="debug-panel" style="margin-top: 15px; border-top: 1px solid #333;
        padding-top: 10px;">
        <h4 style="margin: 0 0 5px 0; color: #ffaa00;">Debug Info</h4>
        <div id="debug-info" style="font-size: 10px; color: #ccc;"></div>
        <button id="toggle-debug" style="padding: 3px 6px; background: #333; 
          border: none; border-radius: 2px; cursor: pointer; font-size: 10px; 
          margin-top: 5px;">Toggle Details</button>
      </div>
    `;
  }

  bindEvents() {
    if (this.isTestEnvironment) return;

    const endBtn = document.getElementById('end-session-btn');
    const minimizeBtn = document.getElementById('minimize-metrics-btn');

    if (endBtn) {
      endBtn.addEventListener('click', () => this.handleEndSession());
    }

    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', () => {
        this.toggleMetricsMinimized();
      });
    }

    if (this.DEBUG) {
      const toggleDebugBtn = document.getElementById('toggle-debug');
      if (toggleDebugBtn) {
        toggleDebugBtn.addEventListener('click', () => {
          this.toggleDebugDetails();
        });
      }
    }

    // Listen for experiment events to show/hide the interface
    window.addEventListener('experimentSessionStarted', () => {
      // eslint-disable-next-line no-console
      console.log('[ExperimentUI] Session started event received');
      this.showSessionInterface();
    });

    window.addEventListener('experimentSessionEnded', () => {
      this.hideAllInterfaces();
    });

    window.addEventListener('experimentComplete', () => {
      this.showCompleteInterface();
    });
  }


  async handleEndSession() {
    try {
      // eslint-disable-next-line no-console
      console.log('[ExperimentUI] End session button clicked - saving session and reloading');
      
      // Store the current user ID so we can auto-continue after reload
      const currentUserId = window.gameCoordinator?.experimentManager?.userId;
      if (currentUserId) {
        localStorage.setItem('autoResumeUserId', currentUserId);
        // eslint-disable-next-line no-console
        console.log('[ExperimentUI] Stored user ID for auto-resume:', currentUserId);
      }
      
      // End the current session properly and wait for it to complete
      if (window.gameCoordinator && window.gameCoordinator.experimentManager) {
        // eslint-disable-next-line no-console
        console.log('[ExperimentUI] Ending experiment session and waiting for save...');
        
        // Dispatch game ended event first
        window.dispatchEvent(new CustomEvent('gameEnded', {
          detail: {
            sessionId: window.gameCoordinator.experimentManager.currentSession?.sessionId,
            finalScore: window.gameCoordinator.points || 0,
            gameTime: Date.now() - (window.gameCoordinator.gameStartTime || Date.now()),
            reason: 'user_terminated',
            timestamp: Date.now()
          }
        }));

        // Actually end the session and wait for all async operations
        await window.gameCoordinator.experimentManager.endSession();
        // eslint-disable-next-line no-console
        console.log('[ExperimentUI] ✅ Session saved successfully');
        
        // Dispatch session ended event
        window.dispatchEvent(new CustomEvent('experimentSessionEnded', {
          detail: {
            sessionId: window.gameCoordinator.experimentManager.currentSession?.sessionId || 'unknown',
            completedSessions: window.gameCoordinator.experimentManager.getCompletedSessionsCount(),
            reason: 'user_terminated'
          }
        }));
      }
      
      // Now reload after session is properly saved
      // eslint-disable-next-line no-console
      console.log('[ExperimentUI] Reloading page for clean state');
      window.location.reload();
      
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error ending session:', error);
      
      // Fallback: just reload (data may not be saved but better than broken state)
      window.location.reload();
    }
  }

  handleExportData() {
    try {
      // Use the new CSV export functionality from experimentManager
      const success = this.experimentManager.exportUserCSV();

      if (success) {
        // eslint-disable-next-line no-console
        console.log('[ExperimentUI] CSV export completed');
      } else {
        // eslint-disable-next-line no-console
        console.warn('[ExperimentUI] CSV export failed, trying fallback');
        // Fallback to old method
        const jsonData = this.experimentManager.exportData('json');
        const csvData = this.experimentManager.exportData('csv');
        this.downloadFile(
          `experiment_${this.experimentManager.userId}_data.json`,
          jsonData,
        );
        this.downloadFile(
          `experiment_${this.experimentManager.userId}_data.csv`,
          csvData,
        );
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error exporting data:', error);
    }
  }

  async handleResetExperiment() {
    try {
      // Show comprehensive confirmation dialog
      const confirmed = confirm(
        '⚠️ Are you sure you want to reset the experiment?\n\n' +
        'This will:\n' +
        '• Delete ALL session data\n' +
        '• Clear the user ID\n' +
        '• Remove data from both local storage and cloud database\n' +
        '• Reload the page for a fresh start\n\n' +
        'This action cannot be undone!'
      );

      if (!confirmed) {
        console.log('[ExperimentUI] Reset cancelled by user');
        return;
      }

      console.log('[ExperimentUI] 🔄 Resetting experiment and reloading page...');

      // Delete all experiment data
      if (this.experimentManager) {
        await this.experimentManager.resetExperiment();
        console.log('[ExperimentUI] ✅ Experiment data deleted');
      }

      // Simple and reliable: reload the page for a completely fresh start
      window.location.reload();

    } catch (error) {
      console.error('[ExperimentUI] ❌ Error during experiment reset:', error);
      
      // Even if data deletion fails, reload the page for a fresh start
      window.location.reload();
    }
  }

  async handleDeleteLastSession() {
    try {
      // Show confirmation dialog
      const confirmed = confirm(
        '⚠️ Delete the last completed session?\n\n' +
        'This will:\n' +
        '• Remove the most recent session from Supabase database\n' +
        '• Remove session data from local storage\n' +
        '• Reload the page for a fresh start\n' +
        '• Allow you to replay that session configuration\n\n' +
        'This action cannot be undone!'
      );

      if (!confirmed) {
        console.log('[ExperimentUI] Delete last session cancelled by user');
        return;
      }

      console.log('[ExperimentUI] 🗑️ Deleting last session and reloading page...');

      // Delete the last session data
      if (this.experimentManager) {
        await this.experimentManager.deleteLastSession();
        console.log('[ExperimentUI] ✅ Last session deleted');
      }

      // Simple and reliable: reload the page for a completely fresh start
      window.location.reload();

    } catch (error) {
      console.error('[ExperimentUI] ❌ Error during last session deletion:', error);
      
      // Even if data deletion fails, reload the page for a fresh start
      window.location.reload();
    }
  }

  toggleMetricsMinimized() {
    if (this.isTestEnvironment) return;

    const metricsContent = document.getElementById('metrics-content');
    const minimizeBtn = document.getElementById('minimize-metrics-btn');

    if (!metricsContent || !minimizeBtn) return;

    const isMinimized = metricsContent.style.display === 'none';

    if (isMinimized) {
      // Expand
      metricsContent.style.display = 'block';
      minimizeBtn.innerHTML = '▼';
      minimizeBtn.title = 'Minimize';
    } else {
      // Minimize
      metricsContent.style.display = 'none';
      minimizeBtn.innerHTML = '▲';
      minimizeBtn.title = 'Maximize';
    }
  }

  downloadFile(filename, content) {
    if (this.isTestEnvironment) {
      // In test environment, just log the action
      // eslint-disable-next-line no-console
      console.log(`[TEST] Would download file: ${filename}`);
      return;
    }

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
    if (this.isTestEnvironment) return;

    // Login is now handled by main menu, so hide all experiment UI sections
    this.hideAllInterfaces();
  }

  showSessionInterface() {
    if (this.isTestEnvironment) return;

    // Ensure the main experiment interface is visible
    const experimentInterface = document.getElementById('experiment-interface');
    if (experimentInterface) {
      experimentInterface.style.display = 'block';
    }

    this.hideAllInterfaces();
    const sessionDiv = document.getElementById('experiment-session');
    if (sessionDiv) {
      sessionDiv.style.display = 'block';
    }

    // Reset metrics for new session
    this.resetMetricsDisplay();

    // Update all the session information and start metrics display
    this.updateSessionDisplay();
    this.startMetricsDisplay();
  }

  showCompleteInterface() {
    if (this.isTestEnvironment) return;

    this.hideAllInterfaces();
    const completeDiv = document.getElementById('experiment-complete');
    if (completeDiv) {
      completeDiv.style.display = 'block';
    }
  }

  hideAllInterfaces() {
    if (this.isTestEnvironment) return;

    const interfaces = ['experiment-session', 'experiment-complete'];
    interfaces.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.style.display = 'none';
      }
    });
  }

  updateSessionDisplay() {
    if (this.isTestEnvironment) return;

    const sessionInfo = this.experimentManager.getCurrentSessionInfo();
    if (!sessionInfo) {
      // eslint-disable-next-line no-console
      console.warn('[ExperimentUI] No session info available');
      return;
    }

    const sessionInfoDiv = document.getElementById('session-info');
    const speedConfigDiv = document.getElementById('speed-config');
    const progressInfoDiv = document.getElementById('progress-info');

    if (sessionInfoDiv) {
      // Debug logging for session display
      console.log('[ExperimentUI] Session display debug:');
      console.log('- sessionInfo:', sessionInfo);
      console.log('- sessionInfo.sessionId:', sessionInfo.sessionId);
      console.log('- completedSessions from info:', sessionInfo.completedSessions);
      console.log('- Direct completedSessions call:', this.experimentManager.getCompletedSessionsCount());
      
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
        <strong>Progress:</strong> ${sessionInfo.completedSessions}/`
        + `${sessionInfo.totalSessions} completed
      `;
    }

    if (this.DEBUG) {
      this.updateDebugDisplay();
    }
  }

  startMetricsDisplay() {
    if (this.isTestEnvironment) return;

    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
    }

    this.metricsUpdateInterval = setInterval(() => {
      this.updateMetricsDisplay();
    }, 1000);
  }

  stopMetricsDisplay() {
    // eslint-disable-next-line no-console
    console.log('[ExperimentUI] stopMetricsDisplay called, interval ID:',
      this.metricsUpdateInterval);
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
      this.metricsUpdateInterval = null;
      // eslint-disable-next-line no-console
      console.log('[ExperimentUI] Metrics interval cleared');
    } else {
      // eslint-disable-next-line no-console
      console.log('[ExperimentUI] No metrics interval to clear');
    }
  }

  resetMetricsDisplay() {
    if (this.isTestEnvironment) return;

    // eslint-disable-next-line no-console
    console.log('[ExperimentUI] Resetting metrics display for new session');

    const metricsDiv = document.getElementById('metrics-display');
    if (metricsDiv) {
      // Reset to initial state showing zeros
      metricsDiv.innerHTML = `
        <strong>📊 New Session Starting...</strong><br>
        <strong>🍴 Eaten Items:</strong><br>
        &nbsp;&nbsp;🔸 Pacdots: 0<br>
        &nbsp;&nbsp;⚡ Power Pellets: 0<br>
        &nbsp;&nbsp;🍎 Fruits: 0<br>
        &nbsp;&nbsp;👻 Ghosts: 0<br>
        <strong>📈 Game Stats:</strong><br>
        &nbsp;&nbsp;💀 Deaths: 0<br>
        &nbsp;&nbsp;🔄 Turns: 0/0<br>
        &nbsp;&nbsp;⏱️ Time: 0s<br>
        &nbsp;&nbsp;📋 Events: 0
      `;
    }
  }

  updateMetricsDisplay() {
    if (this.isTestEnvironment) return;

    // eslint-disable-next-line no-console
    console.log('[ExperimentUI] updateMetricsDisplay called');

    const metricsDiv = document.getElementById('metrics-display');
    if (!metricsDiv) {
      // eslint-disable-next-line no-console
      console.log('[ExperimentUI] No metrics div found');
      return;
    }

    const metrics = this.getGameCoordinatorMetrics();
    if (!metrics) {
      // eslint-disable-next-line no-console
      console.log('[ExperimentUI] No metrics available, '
        + 'showing waiting message');
      metricsDiv.innerHTML = '<em>Waiting for game data...</em>';
      return;
    }

    const gameTime = this.experimentManager.gameStartTime
      ? Math.floor(this.experimentManager.getGameplayTime() / 1000) : 0;

    // Get detailed breakdown of eaten items
    const detailedStats = this.getDetailedEatenStats();

    const sessionInfo = this.experimentManager.getCurrentSessionInfo();
    const sessionId = sessionInfo ? sessionInfo.sessionId : '?';
    
    // Debug logging for live metrics display
    console.log('[ExperimentUI] Live metrics debug:');
    console.log('- sessionInfo from getCurrentSessionInfo:', sessionInfo);
    console.log('- sessionId being displayed:', sessionId);

    metricsDiv.innerHTML = `
      <strong>📊 Session ${sessionId} Metrics</strong><br>
      <strong>🍴 Eaten Items:</strong><br>
      &nbsp;&nbsp;🔸 Pacdots: ${detailedStats.pacdots}<br>
      &nbsp;&nbsp;⚡ Power Pellets: ${detailedStats.powerPellets}<br>
      &nbsp;&nbsp;🍎 Fruits: ${detailedStats.fruits}<br>
      &nbsp;&nbsp;👻 Ghosts: ${detailedStats.ghosts}<br>
      <strong>📈 Game Stats:</strong><br>
      &nbsp;&nbsp;💀 Deaths: ${metrics.summary.totalDeaths}<br>
      &nbsp;&nbsp;🔄 Turns: ${metrics.summary.successfulTurns}/`
        + `${metrics.summary.totalTurns}<br>
      &nbsp;&nbsp;⏱️ Time: ${gameTime}s<br>
      &nbsp;&nbsp;📋 Events: ${metrics.events ? metrics.events.length : 0}
    `;
  }

  getDetailedEatenStats() {
    try {
      if (!this.experimentManager || !this.experimentManager.currentMetrics) {
        return {
          pacdots: 0,
          powerPellets: 0,
          fruits: 0,
          ghosts: 0,
        };
      }

      const { events } = this.experimentManager.currentMetrics;
      if (!events) {
        return {
          pacdots: 0,
          powerPellets: 0,
          fruits: 0,
          ghosts: 0,
        };
      }

      // Debug: Log session info to verify reset behavior
      if (this.DEBUG) {
        if (events.length === 0) {
          // eslint-disable-next-line no-console
          console.log('[ExperimentUI] New session detected - events reset');
        } else {
          // eslint-disable-next-line no-console
          console.log(`[ExperimentUI] Processing ${events.length} events for detailed stats`);
        }
      }

      const stats = {
        pacdots: 0,
        powerPellets: 0,
        fruits: 0,
        ghosts: 0,
      };

      events.forEach((event) => {
        // Check event type for pellets and ghosts
        switch (event.type) {
          case 'pelletEaten':
            // Check the specific pellet type in data.type
            if (event.data && event.data.type === 'pacdot') {
              stats.pacdots += 1;
            } else if (event.data && event.data.type === 'powerPellet') {
              stats.powerPellets += 1;
            } else if (event.data && event.data.type === 'fruit') {
              stats.fruits += 1;
            }
            break;
          case 'ghostEaten':
            stats.ghosts += 1;
            break;
          default:
            // Other event types not tracked in detailed stats
            break;
        }
      });

      return stats;
    } catch (error) {
      if (this.DEBUG) {
        // eslint-disable-next-line no-console
        console.warn('[ExperimentUI] Error getting detailed stats:', error);
      }
      return {
        pacdots: 0,
        powerPellets: 0,
        fruits: 0,
        ghosts: 0,
      };
    }
  }

  getGameCoordinatorMetrics() {
    try {
      if (!this.isTestEnvironment && window.gameCoordinator
        && window.gameCoordinator.metricsCollector) {
        return window.gameCoordinator.metricsCollector.getCurrentMetrics();
      }

      if (this.metricsCollector) {
        return this.metricsCollector.getCurrentMetrics();
      }

      return null;
    } catch (error) {
      if (this.DEBUG) {
        // eslint-disable-next-line no-console
        console.warn('[ExperimentUI] Error getting metrics:', error);
      }
      return null;
    }
  }

  setMetricsCollector(metricsCollector) {
    this.metricsCollector = metricsCollector;
  }

  updateDebugDisplay() {
    if (this.isTestEnvironment) return;

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
    if (this.isTestEnvironment) return;

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
      // eslint-disable-next-line no-console
      console.log('[METRICS]', type, data);
    }
  }

  destroy() {
    if (!this.isTestEnvironment) {
      const experimentInterface = document
        .getElementById('experiment-interface');
      if (experimentInterface) {
        experimentInterface.remove();
      }
    }
    this.isInitialized = false;
  }
}


class ExportManager {
  constructor(experimentManager, sessionManager, dataManager) {
    this.experimentManager = experimentManager;
    this.sessionManager = sessionManager;
    this.dataManager = dataManager;
    this.exportFormats = ['json', 'csv', 'xlsx', 'spss', 'r', 'python'];
    this.anonymization = {
      enabled: false,
      hashSalt: null,
      fieldMasking: {}
    };
    this.isInitialized = false;
    this.DEBUG = true;
  }

  initialize() {
    if (this.isInitialized) return;
    
    this.setupAnonymization();
    this.bindEvents();
    this.isInitialized = true;
    
    if (this.DEBUG) {
      console.log('[ExportManager] Initialized with formats:', this.exportFormats);
    }
  }

  bindEvents() {
    window.addEventListener('experimentComplete', () => {
      this.generateCompletionReport();
    });

    window.addEventListener('exportRequested', (e) => {
      this.handleExportRequest(e.detail);
    });
  }

  setupAnonymization() {
    this.anonymization.hashSalt = this.generateSalt();
    this.anonymization.fieldMasking = {
      userId: { enabled: false, method: 'hash' },
      deviceInfo: { enabled: false, method: 'remove' },
      browserInfo: { enabled: false, method: 'generalize' },
      timestamps: { enabled: false, method: 'relative' }
    };
  }

  generateSalt() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  exportData(format = 'json', options = {}) {
    try {
      const exportOptions = {
        includeRawEvents: true,
        includeSummary: true,
        includeAnalytics: true,
        includeDeviceInfo: true,
        anonymize: false,
        compression: false,
        ...options
      };

      const rawData = this.gatherExportData(exportOptions);
      const processedData = this.processDataForExport(rawData, exportOptions);
      
      let exportContent;
      let filename;
      let mimeType;

      switch (format.toLowerCase()) {
        case 'json':
          { const result = this.exportAsJSON(processedData, exportOptions);
          exportContent = result.content;
          filename = result.filename;
          mimeType = result.mimeType; }
          break;
        case 'csv':
          { const result = this.exportAsCSV(processedData, exportOptions);
          exportContent = result.content;
          filename = result.filename;
          mimeType = result.mimeType; }
          break;
        case 'xlsx':
          { const result = this.exportAsExcel(processedData, exportOptions);
          exportContent = result.content;
          filename = result.filename;
          mimeType = result.mimeType; }
          break;
        case 'spss':
          { const result = this.exportAsSPSS(processedData, exportOptions);
          exportContent = result.content;
          filename = result.filename;
          mimeType = result.mimeType; }
          break;
        case 'r':
          { const result = this.exportAsR(processedData, exportOptions);
          exportContent = result.content;
          filename = result.filename;
          mimeType = result.mimeType; }
          break;
        case 'python':
          { const result = this.exportAsPython(processedData, exportOptions);
          exportContent = result.content;
          filename = result.filename;
          mimeType = result.mimeType; }
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      this.downloadFile(filename, exportContent, mimeType);
      this.logExport(format, exportOptions, exportContent.length);
      
      return {
        success: true,
        format,
        filename,
        size: exportContent.length
      };

    } catch (error) {
      console.error('[ExportManager] Export failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  gatherExportData(options) {
    const data = {
      metadata: this.generateMetadata(),
      experiment: {
        userId: this.experimentManager.userId,
        sessionOrder: this.experimentManager.sessionOrder,
        speedConfigurations: this.experimentManager.PERMUTATIONS,
        completedSessions: this.experimentManager.getCompletedSessionsCount(),
        totalSessions: 9
      },
      sessions: this.experimentManager.metrics,
      analytics: this.sessionManager.getSessionAnalytics(),
      systemInfo: {
        deviceInfo: options.includeDeviceInfo ? this.getDeviceInfo() : null,
        browserInfo: options.includeDeviceInfo ? this.getBrowserInfo() : null,
        exportTimestamp: new Date().toISOString()
      }
    };

    if (options.includeRawEvents) {
      data.rawEvents = this.extractAllEvents();
    }

    if (options.includeAnalytics) {
      data.statisticalSummary = this.generateStatisticalSummary();
      data.performanceMetrics = this.generatePerformanceMetrics();
    }

    return data;
  }

  processDataForExport(data, options) {
    let processedData = JSON.parse(JSON.stringify(data)); // Deep clone

    if (options.anonymize) {
      processedData = this.anonymizeData(processedData);
    }

    if (options.compression) {
      processedData = this.compressData(processedData);
    }

    return processedData;
  }

  generateMetadata() {
    return {
      experimentName: 'Pac-Man Speed Configuration Research',
      version: '1.0.0',
      description: 'Research study investigating effects of speed configurations on gameplay',
      exportDate: new Date().toISOString(),
      dataStructure: {
        sessions: 'Array of session objects with metrics and events',
        events: 'Individual game events with timestamps and context',
        analytics: 'Aggregated statistics and performance metrics',
        configurations: 'Speed permutations used in the experiment'
      },
      variables: {
        independent: ['pacman_speed', 'ghost_speed'],
        dependent: ['ghosts_eaten', 'pellets_eaten', 'deaths', 'successful_turns', 'turn_accuracy']
      }
    };
  }

  extractAllEvents() {
    const allEvents = [];
    
    this.experimentManager.metrics.forEach(session => {
      if (session.events) {
        session.events.forEach(event => {
          allEvents.push({
            ...event,
            sessionId: session.sessionId,
            speedConfig: session.speedConfig,
            permutationId: session.permutationId
          });
        });
      }
    });

    return allEvents.sort((a, b) => a.timestamp - b.timestamp);
  }

  generateStatisticalSummary() {
    const sessions = this.experimentManager.metrics;
    if (sessions.length === 0) return null;

    const summary = {
      sessions: {
        total: sessions.length,
        completed: sessions.filter(s => s.summary).length
      },
      performance: this.calculatePerformanceStats(sessions),
      speedAnalysis: this.analyzeSpeedEffects(sessions),
      turnAnalysis: this.analyzeTurnPerformance(sessions),
      timeAnalysis: this.analyzeTimeMetrics(sessions)
    };

    return summary;
  }

  calculatePerformanceStats(sessions) {
    const metrics = ['totalGhostsEaten', 'totalPelletsEaten', 'totalDeaths', 'successfulTurns', 'totalTurns'];
    const stats = {};

    metrics.forEach(metric => {
      const values = sessions
        .filter(s => s.summary && s.summary[metric] !== undefined)
        .map(s => s.summary[metric]);

      if (values.length > 0) {
        stats[metric] = {
          mean: this.calculateMean(values),
          median: this.calculateMedian(values),
          std: this.calculateStandardDeviation(values),
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length
        };
      }
    });

    // Calculate turn accuracy
    const accuracyValues = sessions
      .filter(s => s.summary && s.summary.totalTurns > 0)
      .map(s => s.summary.successfulTurns / s.summary.totalTurns);

    if (accuracyValues.length > 0) {
      stats.turnAccuracy = {
        mean: this.calculateMean(accuracyValues),
        median: this.calculateMedian(accuracyValues),
        std: this.calculateStandardDeviation(accuracyValues),
        min: Math.min(...accuracyValues),
        max: Math.max(...accuracyValues),
        count: accuracyValues.length
      };
    }

    return stats;
  }

  analyzeSpeedEffects(sessions) {
    const speedGroups = {
      pacman: { slow: [], normal: [], fast: [] },
      ghost: { slow: [], normal: [], fast: [] }
    };

    sessions.forEach(session => {
      if (session.speedConfig && session.summary) {
        speedGroups.pacman[session.speedConfig.pacman].push(session.summary);
        speedGroups.ghost[session.speedConfig.ghost].push(session.summary);
      }
    });

    const analysis = {};

    ['pacman', 'ghost'].forEach(entityType => {
      analysis[entityType] = {};
      
      ['slow', 'normal', 'fast'].forEach(speed => {
        const group = speedGroups[entityType][speed];
        if (group.length > 0) {
          analysis[entityType][speed] = {
            sessionCount: group.length,
            avgGhostsEaten: this.calculateMean(group.map(s => s.totalGhostsEaten || 0)),
            avgPelletsEaten: this.calculateMean(group.map(s => s.totalPelletsEaten || 0)),
            avgDeaths: this.calculateMean(group.map(s => s.totalDeaths || 0)),
            avgTurnAccuracy: this.calculateMean(group.map(s => 
              s.totalTurns > 0 ? s.successfulTurns / s.totalTurns : 0
            ))
          };
        }
      });
    });

    return analysis;
  }

  analyzeTurnPerformance(sessions) {
    const allEvents = this.extractAllEvents();
    const turnEvents = allEvents.filter(e => e.type === 'turnComplete');
    
    if (turnEvents.length === 0) return null;

    const successfulTurns = turnEvents.filter(e => e.success);
    const failedTurns = turnEvents.filter(e => !e.success);

    return {
      totalTurns: turnEvents.length,
      successfulTurns: successfulTurns.length,
      failedTurns: failedTurns.length,
      successRate: successfulTurns.length / turnEvents.length,
      avgDuration: {
        successful: this.calculateMean(successfulTurns.map(e => e.duration || 0)),
        failed: this.calculateMean(failedTurns.map(e => e.duration || 0))
      }
    };
  }

  analyzeTimeMetrics(sessions) {
    const gameTimes = sessions
      .filter(s => s.summary && s.summary.gameTime)
      .map(s => s.summary.gameTime);

    if (gameTimes.length === 0) return null;

    return {
      totalPlayTime: gameTimes.reduce((sum, time) => sum + time, 0),
      avgSessionDuration: this.calculateMean(gameTimes),
      medianSessionDuration: this.calculateMedian(gameTimes),
      shortestSession: Math.min(...gameTimes),
      longestSession: Math.max(...gameTimes)
    };
  }

  exportAsJSON(data, options) {
    const content = JSON.stringify(data, null, options.minify ? 0 : 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const suffix = options.anonymize ? '_anonymized' : '';
    
    return {
      content,
      filename: `pacman_experiment_${this.experimentManager.userId}${suffix}_${timestamp}.json`,
      mimeType: 'application/json'
    };
  }

  exportAsCSV(data, options) {
    const csvSections = [];
    
    // Session summary CSV
    if (data.sessions && data.sessions.length > 0) {
      const sessionHeaders = [
        'sessionId', 'userId', 'permutationId', 'pacmanSpeed', 'ghostSpeed',
        'totalGhostsEaten', 'totalPelletsEaten', 'totalDeaths', 
        'successfulTurns', 'totalTurns', 'turnAccuracy', 'gameTime'
      ];
      
      const sessionRows = data.sessions.map(session => [
        session.sessionId,
        session.userId,
        session.permutationId,
        session.speedConfig?.pacman || '',
        session.speedConfig?.ghost || '',
        session.summary?.totalGhostsEaten || 0,
        session.summary?.totalPelletsEaten || 0,
        session.summary?.totalDeaths || 0,
        session.summary?.successfulTurns || 0,
        session.summary?.totalTurns || 0,
        session.summary?.totalTurns > 0 ? session.summary.successfulTurns / session.summary.totalTurns : 0,
        session.summary?.gameTime || 0
      ]);

      csvSections.push('# Session Summary');
      csvSections.push(sessionHeaders.join(','));
      csvSections.push(...sessionRows.map(row => row.join(',')));
      csvSections.push('');
    }

    // Events CSV
    if (data.rawEvents && data.rawEvents.length > 0) {
      const eventHeaders = [
        'sessionId', 'eventType', 'timestamp', 'time', 'pacmanSpeed', 'ghostSpeed'
      ];
      
      const eventRows = data.rawEvents.map(event => [
        event.sessionId,
        event.type,
        event.timestamp,
        event.time,
        event.speedConfig?.pacman || '',
        event.speedConfig?.ghost || ''
      ]);

      csvSections.push('# Raw Events');
      csvSections.push(eventHeaders.join(','));
      csvSections.push(...eventRows.map(row => row.join(',')));
    }

    const content = csvSections.join('\n');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const suffix = options.anonymize ? '_anonymized' : '';
    
    return {
      content,
      filename: `pacman_experiment_${this.experimentManager.userId}${suffix}_${timestamp}.csv`,
      mimeType: 'text/csv'
    };
  }

  exportAsExcel(data, options) {
    // Generate XLSX-compatible CSV with multiple sheets info
    const content = this.generateExcelCompatibleFormat(data);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const suffix = options.anonymize ? '_anonymized' : '';
    
    return {
      content,
      filename: `pacman_experiment_${this.experimentManager.userId}${suffix}_${timestamp}.xlsx.csv`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }

  exportAsSPSS(data, options) {
    const spssScript = this.generateSPSSScript(data);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const suffix = options.anonymize ? '_anonymized' : '';
    
    return {
      content: spssScript,
      filename: `pacman_experiment_${this.experimentManager.userId}${suffix}_${timestamp}.sps`,
      mimeType: 'text/plain'
    };
  }

  exportAsR(data, options) {
    const rScript = this.generateRScript(data);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const suffix = options.anonymize ? '_anonymized' : '';
    
    return {
      content: rScript,
      filename: `pacman_experiment_${this.experimentManager.userId}${suffix}_${timestamp}.R`,
      mimeType: 'text/plain'
    };
  }

  exportAsPython(data, options) {
    const pythonScript = this.generatePythonScript(data);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const suffix = options.anonymize ? '_anonymized' : '';
    
    return {
      content: pythonScript,
      filename: `pacman_experiment_${this.experimentManager.userId}${suffix}_${timestamp}.py`,
      mimeType: 'text/plain'
    };
  }

  generateSPSSScript(data) {
    return `* SPSS Syntax for Pac-Man Speed Configuration Research
* Generated: ${new Date().toISOString()}
* User: ${this.experimentManager.userId}

* Import data
GET DATA
  /TYPE=TXT
  /FILE='pacman_experiment_data.csv'
  /DELCASE=LINE
  /DELIMITERS=","
  /QUALIFIER='"'
  /ARRANGEMENT=DELIMITED
  /FIRSTCASE=2
  /VARIABLES=
    sessionId F3.0
    userId A20
    permutationId F2.0
    pacmanSpeed A10
    ghostSpeed A10
    totalGhostsEaten F5.0
    totalPelletsEaten F6.0
    totalDeaths F4.0
    successfulTurns F5.0
    totalTurns F5.0
    turnAccuracy F8.4
    gameTime F10.0.

* Define value labels
VALUE LABELS pacmanSpeed
  'slow' 'Slow Speed'
  'normal' 'Normal Speed'
  'fast' 'Fast Speed'.

VALUE LABELS ghostSpeed
  'slow' 'Slow Speed'
  'normal' 'Normal Speed'
  'fast' 'Fast Speed'.

* Basic descriptive statistics
DESCRIPTIVES VARIABLES=totalGhostsEaten totalPelletsEaten totalDeaths turnAccuracy gameTime
  /STATISTICS=MEAN STDDEV MIN MAX.

* ANOVA for speed effects
UNIANOVA totalGhostsEaten BY pacmanSpeed ghostSpeed
  /METHOD=SSTYPE(3)
  /INTERCEPT=INCLUDE
  /PRINT=ETASQ DESCRIPTIVE
  /CRITERIA=ALPHA(.05)
  /DESIGN=pacmanSpeed ghostSpeed pacmanSpeed*ghostSpeed.

UNIANOVA turnAccuracy BY pacmanSpeed ghostSpeed
  /METHOD=SSTYPE(3)
  /INTERCEPT=INCLUDE
  /PRINT=ETASQ DESCRIPTIVE
  /CRITERIA=ALPHA(.05)
  /DESIGN=pacmanSpeed ghostSpeed pacmanSpeed*ghostSpeed.

* Correlation analysis
CORRELATIONS
  /VARIABLES=totalGhostsEaten totalPelletsEaten totalDeaths turnAccuracy gameTime
  /PRINT=TWOTAIL NOSIG
  /MISSING=PAIRWISE.

EXECUTE.`;
  }

  generateRScript(data) {
    return `# R Analysis Script for Pac-Man Speed Configuration Research
# Generated: ${new Date().toISOString()}
# User: ${this.experimentManager.userId}

# Load required libraries
library(tidyverse)
library(ggplot2)
library(dplyr)
library(car)
library(psych)

# Import data
data <- read.csv("pacman_experiment_data.csv", stringsAsFactors = TRUE)

# Basic data exploration
cat("Data Structure:\\n")
str(data)

cat("\\nDescriptive Statistics:\\n")
describe(data[c("totalGhostsEaten", "totalPelletsEaten", "totalDeaths", "turnAccuracy", "gameTime")])

# Speed configuration analysis
cat("\\nSpeed Configuration Summary:\\n")
data %>% 
  group_by(pacmanSpeed, ghostSpeed) %>%
  summarise(
    n = n(),
    mean_ghosts = mean(totalGhostsEaten, na.rm = TRUE),
    mean_pellets = mean(totalPelletsEaten, na.rm = TRUE),
    mean_accuracy = mean(turnAccuracy, na.rm = TRUE),
    .groups = 'drop'
  )

# ANOVA for ghosts eaten
ghosts_anova <- aov(totalGhostsEaten ~ pacmanSpeed * ghostSpeed, data = data)
cat("\\nGhosts Eaten ANOVA:\\n")
summary(ghosts_anova)

# ANOVA for turn accuracy
accuracy_anova <- aov(turnAccuracy ~ pacmanSpeed * ghostSpeed, data = data)
cat("\\nTurn Accuracy ANOVA:\\n")
summary(accuracy_anova)

# Visualization
# Performance by Pac-Man speed
p1 <- ggplot(data, aes(x = pacmanSpeed, y = totalGhostsEaten, fill = pacmanSpeed)) +
  geom_boxplot() +
  labs(title = "Ghosts Eaten by Pac-Man Speed",
       x = "Pac-Man Speed", y = "Total Ghosts Eaten") +
  theme_minimal()

# Performance by Ghost speed  
p2 <- ggplot(data, aes(x = ghostSpeed, y = turnAccuracy, fill = ghostSpeed)) +
  geom_boxplot() +
  labs(title = "Turn Accuracy by Ghost Speed",
       x = "Ghost Speed", y = "Turn Accuracy") +
  theme_minimal()

# Interaction plot
p3 <- ggplot(data, aes(x = pacmanSpeed, y = totalGhostsEaten, color = ghostSpeed)) +
  geom_point(position = position_jitter(width = 0.2)) +
  stat_summary(fun = mean, geom = "line", aes(group = ghostSpeed)) +
  labs(title = "Speed Configuration Interaction Effect",
       x = "Pac-Man Speed", y = "Total Ghosts Eaten",
       color = "Ghost Speed") +
  theme_minimal()

# Display plots
print(p1)
print(p2)
print(p3)

# Correlation matrix
cat("\\nCorrelation Matrix:\\n")
cor_matrix <- cor(data[c("totalGhostsEaten", "totalPelletsEaten", "totalDeaths", "turnAccuracy", "gameTime")], 
                  use = "complete.obs")
print(cor_matrix)

# Save results
write.csv(data, "processed_pacman_data.csv", row.names = FALSE)
cat("\\nAnalysis complete. Results saved to processed_pacman_data.csv\\n")`;
  }

  generatePythonScript(data) {
    return `# Python Analysis Script for Pac-Man Speed Configuration Research
# Generated: ${new Date().toISOString()}
# User: ${this.experimentManager.userId}

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
from scipy.stats import f_oneway
import warnings
warnings.filterwarnings('ignore')

# Load data
data = pd.read_csv('pacman_experiment_data.csv')

print("Data Structure:")
print(data.info())
print("\\nFirst few rows:")
print(data.head())

# Descriptive statistics
print("\\nDescriptive Statistics:")
numeric_cols = ['totalGhostsEaten', 'totalPelletsEaten', 'totalDeaths', 'turnAccuracy', 'gameTime']
print(data[numeric_cols].describe())

# Group analysis by speed configurations
print("\\nSpeed Configuration Analysis:")
speed_analysis = data.groupby(['pacmanSpeed', 'ghostSpeed'])[numeric_cols].agg(['mean', 'std', 'count'])
print(speed_analysis)

# Statistical tests
print("\\nStatistical Analysis:")

# ANOVA for ghosts eaten by Pac-Man speed
pacman_groups = [group['totalGhostsEaten'].values for name, group in data.groupby('pacmanSpeed')]
f_stat, p_value = f_oneway(*pacman_groups)
print(f"Pac-Man Speed Effect on Ghosts Eaten: F={f_stat:.3f}, p={p_value:.3f}")

# ANOVA for turn accuracy by ghost speed
ghost_groups = [group['turnAccuracy'].values for name, group in data.groupby('ghostSpeed')]
f_stat, p_value = f_oneway(*ghost_groups)
print(f"Ghost Speed Effect on Turn Accuracy: F={f_stat:.3f}, p={p_value:.3f}")

# Correlation analysis
print("\\nCorrelation Matrix:")
correlation_matrix = data[numeric_cols].corr()
print(correlation_matrix)

# Visualizations
plt.style.use('seaborn')
fig, axes = plt.subplots(2, 2, figsize=(15, 12))

# Ghosts eaten by Pac-Man speed
sns.boxplot(data=data, x='pacmanSpeed', y='totalGhostsEaten', ax=axes[0,0])
axes[0,0].set_title('Ghosts Eaten by Pac-Man Speed')

# Turn accuracy by ghost speed
sns.boxplot(data=data, x='ghostSpeed', y='turnAccuracy', ax=axes[0,1])
axes[0,1].set_title('Turn Accuracy by Ghost Speed')

# Heatmap of speed combinations
pivot_data = data.pivot_table(values='totalGhostsEaten', index='pacmanSpeed', columns='ghostSpeed', aggfunc='mean')
sns.heatmap(pivot_data, annot=True, fmt='.1f', ax=axes[1,0])
axes[1,0].set_title('Mean Ghosts Eaten by Speed Configuration')

# Correlation heatmap
sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', center=0, ax=axes[1,1])
axes[1,1].set_title('Correlation Matrix')

plt.tight_layout()
plt.savefig('pacman_analysis_plots.png', dpi=300, bbox_inches='tight')
plt.show()

# Advanced analysis
print("\\nAdvanced Analysis:")

# Two-way ANOVA using statsmodels
try:
    import statsmodels.api as sm
    from statsmodels.formula.api import ols
    
    model = ols('totalGhostsEaten ~ C(pacmanSpeed) + C(ghostSpeed) + C(pacmanSpeed):C(ghostSpeed)', data=data).fit()
    anova_table = sm.stats.anova_lm(model, typ=2)
    print("Two-way ANOVA Results:")
    print(anova_table)
except ImportError:
    print("statsmodels not available for advanced ANOVA")

# Export processed data
data.to_csv('processed_pacman_data.csv', index=False)
print("\\nAnalysis complete. Results saved to processed_pacman_data.csv")
print("Plots saved to pacman_analysis_plots.png")`;
  }

  // Utility functions for statistical calculations
  calculateMean(values) {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  calculateMedian(values) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  calculateStandardDeviation(values) {
    if (values.length <= 1) return 0;
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = this.calculateMean(squaredDiffs);
    return Math.sqrt(variance);
  }

  generateExcelCompatibleFormat(data) {
    // Simple Excel-compatible format
    const { content } = this.exportAsCSV(data, {});
    return content;
  }

  anonymizeData(data) {
    const anonymized = JSON.parse(JSON.stringify(data));
    
    if (this.anonymization.fieldMasking.userId.enabled) {
      anonymized.experiment.userId = this.hashValue(anonymized.experiment.userId);
      if (anonymized.sessions) {
        anonymized.sessions.forEach(session => {
          session.userId = this.hashValue(session.userId);
        });
      }
    }

    if (this.anonymization.fieldMasking.deviceInfo.enabled) {
      delete anonymized.systemInfo.deviceInfo;
    }

    if (this.anonymization.fieldMasking.timestamps.enabled) {
      // Convert to relative timestamps
      this.convertToRelativeTimestamps(anonymized);
    }

    return anonymized;
  }

  hashValue(value) {
    // Simple hash function for anonymization
    let hash = 0;
    const str = value + this.anonymization.hashSalt;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `user_${Math.abs(hash).toString(36)}`;
  }

  convertToRelativeTimestamps(data) {
    // Convert absolute timestamps to relative (first event = 0)
    if (data.rawEvents && data.rawEvents.length > 0) {
      const baseTime = data.rawEvents[0].timestamp;
      data.rawEvents.forEach(event => {
        event.relativeTimestamp = event.timestamp - baseTime;
        delete event.timestamp;
      });
    }
  }

  compressData(data) {
    // Simple data compression by removing unnecessary fields
    const compressed = JSON.parse(JSON.stringify(data));
    
    // Remove verbose debug information
    if (compressed.sessions) {
      compressed.sessions.forEach(session => {
        if (session.events) {
          session.events.forEach(event => {
            delete event.pacmanPosition;
            delete event.pacmanGridPosition;
          });
        }
      });
    }

    return compressed;
  }

  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    };
  }

  getBrowserInfo() {
    return {
      url: window.location.href,
      referrer: document.referrer,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  downloadFile(filename, content, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  logExport(format, options, size) {
    if (this.DEBUG) {
      console.log(`[ExportManager] Export completed:`, {
        format,
        size: `${Math.round(size / 1024)}KB`,
        options,
        timestamp: new Date().toISOString()
      });
    }
  }

  generatePerformanceMetrics() {
    return {
      exportCapabilities: this.exportFormats,
      anonymizationEnabled: this.anonymization.enabled,
      dataIntegrity: this.validateDataIntegrity(),
      completeness: this.assessDataCompleteness()
    };
  }

  validateDataIntegrity() {
    const sessions = this.experimentManager.metrics;
    const issues = [];

    sessions.forEach(session => {
      if (!session.userId) issues.push(`Session ${session.sessionId} missing userId`);
      if (!session.speedConfig) issues.push(`Session ${session.sessionId} missing speedConfig`);
      if (!session.summary) issues.push(`Session ${session.sessionId} missing summary`);
    });

    return {
      valid: issues.length === 0,
      issues
    };
  }

  assessDataCompleteness() {
    const totalSessions = 9;
    const completedSessions = this.experimentManager.getCompletedSessionsCount();
    
    return {
      sessionCompleteness: completedSessions / totalSessions,
      hasAllSpeedConfigurations: this.checkAllSpeedConfigurations(),
      dataQualityScore: this.calculateDataQualityScore()
    };
  }

  checkAllSpeedConfigurations() {
    const sessions = this.experimentManager.metrics;
    const configCombinations = new Set();
    
    sessions.forEach(session => {
      if (session.speedConfig) {
        configCombinations.add(`${session.speedConfig.pacman}-${session.speedConfig.ghost}`);
      }
    });

    return configCombinations.size === 9;
  }

  calculateDataQualityScore() {
    const sessions = this.experimentManager.metrics;
    let score = 0;
    let maxScore = 0;

    sessions.forEach(session => {
      maxScore += 5; // Max points per session
      
      if (session.summary) score += 1;
      if (session.events && session.events.length > 0) score += 1;
      if (session.speedConfig) score += 1;
      if (session.summary && session.summary.gameTime > 0) score += 1;
      if (session.events && session.events.length > 10) score += 1; // Meaningful activity
    });

    return maxScore > 0 ? score / maxScore : 0;
  }

  enableAnonymization(fieldConfig = {}) {
    this.anonymization.enabled = true;
    this.anonymization.fieldMasking = {
      ...this.anonymization.fieldMasking,
      ...fieldConfig
    };
    
    if (this.DEBUG) {
      console.log('[ExportManager] Anonymization enabled:', this.anonymization.fieldMasking);
    }
  }

  disableAnonymization() {
    this.anonymization.enabled = false;
    
    if (this.DEBUG) {
      console.log('[ExportManager] Anonymization disabled');
    }
  }

  handleExportRequest(detail) {
    const { format, options } = detail;
    return this.exportData(format, options);
  }

  generateCompletionReport() {
    const report = {
      experimentCompleted: true,
      completionTime: new Date().toISOString(),
      totalSessions: this.experimentManager.getCompletedSessionsCount(),
      dataQuality: this.assessDataCompleteness(),
      analytics: this.generateStatisticalSummary(),
      exportRecommendations: this.getExportRecommendations()
    };

    if (this.DEBUG) {
      console.log('[ExportManager] Experiment completion report:', report);
    }

    return report;
  }

  getExportRecommendations() {
    return {
      recommendedFormats: ['json', 'csv', 'r'],
      statisticalAnalysis: 'Use R or Python scripts for comprehensive analysis',
      dataSharing: 'Enable anonymization for public data sharing',
      archival: 'Export to JSON for long-term data preservation'
    };
  }

  getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      supportedFormats: this.exportFormats,
      anonymizationConfig: this.anonymization,
      dataIntegrity: this.validateDataIntegrity(),
      completeness: this.assessDataCompleteness()
    };
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
        consecutiveTurns: this.consecutiveSuccessfulTurns,
      });
    });

    window.addEventListener('powerUp', () => {
      this.logMetric('pelletEaten', {
        type: 'powerPellet',
        position: this.getCurrentPacmanPosition(),
        consecutiveTurns: this.consecutiveSuccessfulTurns,
      });
    });

    window.addEventListener('eatGhost', (e) => {
      this.logMetric('ghostEaten', {
        ghostId: e.detail.ghost.name,
        ghostMode: e.detail.ghost.mode,
        position: this.getCurrentPacmanPosition(),
        consecutiveTurns: this.consecutiveSuccessfulTurns,
      });
    });

    window.addEventListener('deathSequence', () => {
      this.logMetric('death', {
        cause: 'ghost_collision',
        position: this.getCurrentPacmanPosition(),
        consecutiveTurns: this.consecutiveSuccessfulTurns,
        turnInProgress: this.turnTracker !== null,
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
        consecutiveTurns: this.consecutiveSuccessfulTurns,
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

    const { pacman } = this.gameCoordinator;
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
      successful: false,
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
      actualDirection,
      duration: turnDuration,
      consecutiveTurns: successful ? this.consecutiveSuccessfulTurns + 1 : 0,
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
      top: this.gameCoordinator.pacman.position.top,
    };
  }

  getCurrentPacmanGridPosition() {
    if (!this.gameCoordinator || !this.gameCoordinator.pacman) {
      return null;
    }

    const { pacman } = this.gameCoordinator;
    if (!pacman.characterUtil) {
      return null;
    }

    return pacman.characterUtil.determineGridPosition(
      pacman.position,
      this.gameCoordinator.scaledTileSize,
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
      pacmanGridPosition: this.getCurrentPacmanGridPosition(),
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
      turnInProgress: this.turnTracker !== null,
    };
  }

  getDetailedMetrics() {
    const metrics = this.getCurrentMetrics();
    if (!metrics) return null;

    const { events } = this.experimentManager.currentMetrics;

    return {
      ...metrics,
      eventBreakdown: {
        ghostsEaten: events.filter(e => e.type === 'ghostEaten').length,
        pelletsEaten: events.filter(e => e.type === 'pelletEaten').length,
        deaths: events.filter(e => e.type === 'death').length,
        turnsCompleted: events.filter(e => e.type === 'turnComplete').length,
        successfulTurns: events.filter(e => e.type === 'turnComplete' && e.success).length,
      },
      recentEvents: events.slice(-5),
      turnTracker: this.turnTracker,
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
      currentMetrics: this.getCurrentMetrics(),
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
      warnings: [],
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
        severity: 'error',
      },
      {
        name: 'user_data_consistency',
        check: () => this.validateUserDataConsistency(),
        severity: 'error',
      },
      {
        name: 'session_completion_rate',
        check: () => this.validateSessionCompletionRate(),
        severity: 'warning',
      },
      {
        name: 'session_duration_bounds',
        check: () => this.validateSessionDuration(),
        severity: 'warning',
      },
      {
        name: 'metrics_data_quality',
        check: () => this.validateMetricsQuality(),
        severity: 'warning',
      },
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
      timestamp: Date.now(),
    });

    if (this.DEBUG) {
      console.log('[ProgressController] Session idle detected');
    }
  }

  handleSessionTimeout(detail) {
    this.progressState.warnings.push({
      type: 'session_timeout',
      message: `Session exceeded maximum duration (${Math.round(detail.sessionTime / 1000)} seconds)`,
      timestamp: Date.now(),
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
      detail: { reason },
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
      warnings: [],
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

    const { currentMetrics } = this.experimentManager;
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
      hasWarnings: false,
    };

    this.validationRules.forEach((rule) => {
      try {
        const result = rule.check();

        if (result.valid) {
          results.passed.push(rule.name);
        } else if (rule.severity === 'error') {
          results.errors.push({
            rule: rule.name,
            message: result.message,
            data: result.data,
          });
          results.hasErrors = true;
        } else {
          results.warnings.push({
            rule: rule.name,
            message: result.message,
            data: result.data,
          });
          results.hasWarnings = true;
        }
      } catch (error) {
        results.errors.push({
          rule: rule.name,
          message: `Validation rule failed: ${error.message}`,
          data: { error: error.toString() },
        });
        results.hasErrors = true;
      }
    });

    return results;
  }

  validateSessionOrder() {
    const { sessionOrder } = this.experimentManager;
    const completedSessions = this.experimentManager.getCompletedSessionsCount();

    if (sessionOrder.length !== 9) {
      return {
        valid: false,
        message: `Invalid session order length: ${sessionOrder.length}, expected 9`,
        data: { sessionOrder },
      };
    }

    const uniqueIds = new Set(sessionOrder);
    if (uniqueIds.size !== 9) {
      return {
        valid: false,
        message: 'Session order contains duplicate permutation IDs',
        data: { sessionOrder, duplicates: sessionOrder.length - uniqueIds.size },
      };
    }

    const validIds = sessionOrder.every(id => id >= 0 && id <= 8);
    if (!validIds) {
      return {
        valid: false,
        message: 'Session order contains invalid permutation IDs',
        data: { sessionOrder },
      };
    }

    return { valid: true };
  }

  validateUserDataConsistency() {
    const { userId } = this.experimentManager;
    const { metrics } = this.experimentManager;

    if (!userId) {
      return {
        valid: false,
        message: 'No user ID set',
        data: {},
      };
    }

    const userIdMismatch = metrics.some(metric => metric.userId !== userId);
    if (userIdMismatch) {
      return {
        valid: false,
        message: 'User ID mismatch in metrics data',
        data: { userId, metricsCount: metrics.length },
      };
    }

    const sessionIdGaps = this.checkSessionIdSequence(metrics);
    if (sessionIdGaps.length > 0) {
      return {
        valid: false,
        message: 'Session ID sequence has gaps',
        data: { gaps: sessionIdGaps },
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
        data: analytics,
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
        data: { avgDuration, minExpected: minDuration },
      };
    }

    if (avgDuration > maxDuration) {
      return {
        valid: false,
        message: `Average session duration too long: ${Math.round(avgDuration / 1000)}s`,
        data: { avgDuration, maxExpected: maxDuration },
      };
    }

    return { valid: true };
  }

  validateMetricsQuality() {
    const { currentMetrics } = this.experimentManager;
    if (!currentMetrics) {
      return { valid: true }; // No current session
    }

    const { events } = currentMetrics;
    const { summary } = currentMetrics;

    // Check for reasonable event counts
    if (events.length === 0 && Date.now() - this.sessionManager.sessionStartTime > 60000) {
      return {
        valid: false,
        message: 'No events recorded after 1 minute of gameplay',
        data: { eventCount: events.length, sessionTime: Date.now() - this.sessionManager.sessionStartTime },
      };
    }

    // Check for data consistency between events and summary
    const eventCounts = this.countEventTypes(events);

    if (Math.abs(eventCounts.ghostEaten - summary.totalGhostsEaten) > 0) {
      return {
        valid: false,
        message: 'Ghost eaten count mismatch between events and summary',
        data: { events: eventCounts.ghostEaten, summary: summary.totalGhostsEaten },
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
        totalEvents: analytics.totalEvents,
      },
    };
  }

  getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      progressState: this.progressState,
      validationRules: this.validationRules.map(r => r.name),
      summary: this.getProgressSummary(),
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
      ghosts: {},
    };
    this.currentMultipliers = {
      pacman: 1.0,
      ghost: 1.0,
    };
    this.isInitialized = false;
  }

  initialize(gameCoordinator) {
    if (this.isInitialized) return;

    this.gameCoordinator = gameCoordinator;
    this.storeOriginalSpeeds();
    this.bindEvents();
    this.isInitialized = true;

    // Check if there's a pending speed configuration from ExperimentManager
    if (window.gameCoordinator && window.gameCoordinator.experimentManager && window.gameCoordinator.experimentManager.pendingSpeedConfig) {
      console.log('[SpeedController] 🔄 Found pending speed config, applying now...');
      const pending = window.gameCoordinator.experimentManager.pendingSpeedConfig;
      this.applySpeedConfiguration(pending);
    }
  }

  storeOriginalSpeeds() {
    if (!this.gameCoordinator || !this.gameCoordinator.pacman) {
      console.warn('[SpeedController] ❌ Game entities not ready, will retry in 500ms');
      setTimeout(() => this.storeOriginalSpeeds(), 500);
      return;
    }

    this.originalSpeeds.pacman = this.gameCoordinator.pacman.velocityPerMs;
    console.log('[SpeedController] 📦 Stored Pac-Man original speed:', this.originalSpeeds.pacman);

    if (this.gameCoordinator.ghosts) {
      this.gameCoordinator.ghosts.forEach((ghost) => {
        this.originalSpeeds.ghosts[ghost.name] = {
          slowSpeed: ghost.slowSpeed,
          mediumSpeed: ghost.mediumSpeed,
          fastSpeed: ghost.fastSpeed,
          scaredSpeed: ghost.scaredSpeed,
          transitionSpeed: ghost.transitionSpeed,
          eyeSpeed: ghost.eyeSpeed,
          defaultSpeed: ghost.defaultSpeed,
        };
        console.log(`[SpeedController] 📦 Stored ${ghost.name} original speeds:`, this.originalSpeeds.ghosts[ghost.name]);
      });
    }

    console.log('[SpeedController] ✅ All original speeds stored successfully');
  }

  bindEvents() {
    console.log('[SpeedController] 🎧 Binding to speedConfigChanged event');

    window.addEventListener('speedConfigChanged', (e) => {
      console.log('[SpeedController] 📡 RECEIVED speedConfigChanged event!', e.detail);
      this.applySpeedConfiguration(e.detail);
    });

    window.addEventListener('experimentSessionEnded', () => {
      this.resetToOriginalSpeeds();
    });
  }

  applySpeedConfiguration(detail) {
    const { pacmanMultiplier, ghostMultiplier, config } = detail;

    console.log('[SpeedController] ⚡ APPLYING SPEED CONFIG ⚡');
    console.log('[SpeedController] Config:', config);
    console.log('[SpeedController] Pac-Man multiplier:', pacmanMultiplier);
    console.log('[SpeedController] Ghost multiplier:', ghostMultiplier);

    this.currentMultipliers.pacman = pacmanMultiplier;
    this.currentMultipliers.ghost = ghostMultiplier;

    if (!this.gameCoordinator || !this.gameCoordinator.pacman) {
      console.warn('[SpeedController] ❌ Game entities not ready for speed application');
      return;
    }

    if (this.originalSpeeds.pacman === null) {
      console.log('[SpeedController] ⏳ Original speeds not stored yet, storing now...');
      this.storeOriginalSpeeds();

      // If still not ready after attempting to store, retry in 1 second
      if (this.originalSpeeds.pacman === null) {
        console.log('[SpeedController] ⏰ Retrying speed application in 1 second...');
        setTimeout(() => this.applySpeedConfiguration({ pacmanMultiplier, ghostMultiplier, config }), 1000);
        return;
      }
    }

    this.applyPacmanSpeed(pacmanMultiplier);
    this.applyGhostSpeeds(ghostMultiplier);

    // Start periodic verification to ensure speeds stay applied
    this.startSpeedVerification();

    console.log('[SpeedController] ✅ Speed configuration applied successfully');
  }

  startSpeedVerification() {
    // Clear any existing verification
    if (this.speedVerificationInterval) {
      clearInterval(this.speedVerificationInterval);
    }

    // Verify and reapply speeds every 2 seconds
    this.speedVerificationInterval = setInterval(() => {
      this.verifyAndReapplySpeeds();
    }, 2000);
  }

  verifyAndReapplySpeeds() {
    if (!this.gameCoordinator || !this.gameCoordinator.pacman || this.originalSpeeds.pacman === null) {
      return;
    }

    // Check if Pac-Man speed has been reset
    const expectedPacmanSpeed = this.originalSpeeds.pacman * this.currentMultipliers.pacman;
    const actualPacmanSpeed = this.gameCoordinator.pacman.velocityPerMs;

    if (Math.abs(actualPacmanSpeed - expectedPacmanSpeed) > 0.001) {
      console.log(`[SpeedController] 🔄 Pac-Man speed drift detected! Expected: ${expectedPacmanSpeed}, Actual: ${actualPacmanSpeed}, Reapplying...`);
      this.applyPacmanSpeed(this.currentMultipliers.pacman);
    }

    // Check ghost speeds
    if (this.gameCoordinator.ghosts) {
      this.gameCoordinator.ghosts.forEach((ghost) => {
        const originalSpeeds = this.originalSpeeds.ghosts[ghost.name];
        if (originalSpeeds) {
          const expectedSpeed = originalSpeeds.defaultSpeed * this.currentMultipliers.ghost;
          const actualSpeed = ghost.velocityPerMs;

          if (Math.abs(actualSpeed - expectedSpeed) > 0.001) {
            console.log(`[SpeedController] 🔄 ${ghost.name} speed drift detected! Expected: ${expectedSpeed}, Actual: ${actualSpeed}, Reapplying...`);
            // Reapply all ghost speeds
            this.applyGhostSpeeds(this.currentMultipliers.ghost);
          }
        }
      });
    }
  }

  applyPacmanSpeed(multiplier) {
    if (!this.gameCoordinator.pacman || this.originalSpeeds.pacman === null) {
      console.log('[SpeedController] ❌ Cannot apply Pac-Man speed - game not ready');
      return;
    }

    const newSpeed = this.originalSpeeds.pacman * multiplier;
    this.gameCoordinator.pacman.velocityPerMs = newSpeed;

    console.log(`[SpeedController] 🟡 Pac-Man speed: ${this.originalSpeeds.pacman} * ${multiplier} = ${newSpeed}`);
  }

  applyGhostSpeeds(multiplier) {
    if (!this.gameCoordinator.ghosts) {
      return;
    }

    this.gameCoordinator.ghosts.forEach((ghost) => {
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

      console.log(`[SpeedController] 👻 ${ghost.name} speeds multiplied by ${multiplier} (${originalSpeeds[currentSpeedType]} -> ${ghost.defaultSpeed})`);
    });
  }

  determineCurrentSpeedType(ghost, originalSpeeds) {
    if (Math.abs(ghost.defaultSpeed - originalSpeeds.slowSpeed) < 0.001) {
      return 'slowSpeed';
    } if (Math.abs(ghost.defaultSpeed - originalSpeeds.mediumSpeed) < 0.001) {
      return 'mediumSpeed';
    } if (Math.abs(ghost.defaultSpeed - originalSpeeds.fastSpeed) < 0.001) {
      return 'fastSpeed';
    }
    return 'slowSpeed';
  }

  resetToOriginalSpeeds() {
    console.log('[SpeedController] 🔄 Resetting to original speeds');

    // Stop speed verification
    if (this.speedVerificationInterval) {
      clearInterval(this.speedVerificationInterval);
      this.speedVerificationInterval = null;
    }

    this.currentMultipliers.pacman = 1.0;
    this.currentMultipliers.ghost = 1.0;

    if (this.gameCoordinator && this.gameCoordinator.pacman && this.originalSpeeds.pacman !== null) {
      this.gameCoordinator.pacman.velocityPerMs = this.originalSpeeds.pacman;
    }

    if (this.gameCoordinator && this.gameCoordinator.ghosts) {
      this.gameCoordinator.ghosts.forEach((ghost) => {
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
      isModified: this.currentMultipliers.pacman !== 1.0 || this.currentMultipliers.ghost !== 1.0,
    };
  }

  getDebugInfo() {
    return {
      originalSpeeds: this.originalSpeeds,
      currentMultipliers: this.currentMultipliers,
      isInitialized: this.isInitialized,
      currentConfig: this.getCurrentConfiguration(),
    };
  }

  // Debug function you can call from browser console
  debugCurrentSpeeds() {
    console.log('=== SPEED CONTROLLER DEBUG ===');
    console.log('Is Initialized:', this.isInitialized);
    console.log('Current Multipliers:', this.currentMultipliers);

    if (this.gameCoordinator && this.gameCoordinator.pacman) {
      console.log('Pac-Man Current Speed:', this.gameCoordinator.pacman.velocityPerMs);
      console.log('Pac-Man Original Speed:', this.originalSpeeds.pacman);
      console.log('Expected Pac-Man Speed:', this.originalSpeeds.pacman * this.currentMultipliers.pacman);
    } else {
      console.log('Pac-Man: Not available');
    }

    if (this.gameCoordinator && this.gameCoordinator.ghosts) {
      this.gameCoordinator.ghosts.forEach((ghost) => {
        console.log(`${ghost.name}:`);
        console.log(`  Current Speed: ${ghost.velocityPerMs}`);
        console.log(`  Default Speed: ${ghost.defaultSpeed}`);
        if (this.originalSpeeds.ghosts[ghost.name]) {
          console.log(`  Original Default: ${this.originalSpeeds.ghosts[ghost.name].defaultSpeed}`);
          console.log(`  Expected Speed: ${this.originalSpeeds.ghosts[ghost.name].defaultSpeed * this.currentMultipliers.ghost}`);
        }
      });
    } else {
      console.log('Ghosts: Not available');
    }
    console.log('===============================');
  }
}


/**
 * Supabase Data Manager for Pac-Man Research Project
 * Handles all database operations for collecting research data
 */

class SupabaseDataManager {
  constructor() {
    this.supabaseUrl = 'https://kozbxghtgtnoldywzdmg.supabase.co';
    this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvemJ4Z2h0Z3Rub2xkeXd6ZG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMDYzODMsImV4cCI6MjA2NDg4MjM4M30.CEaWBTEWM_oj0vtgyQSHWRoLzZ98mYIGuhEtjeGNaC4';
    this.supabase = null;
    this.isInitialized = false;
    this.currentSessionId = null;
  }

  async initialize() {
    try {
      // Load Supabase client from CDN if not already loaded
      if (typeof window.supabase === 'undefined') {
        await this.loadSupabaseClient();
      }

      this.supabase = window.supabase.createClient(
        this.supabaseUrl,
        this.supabaseKey
      );

      this.isInitialized = true;
      console.log('[SupabaseDataManager] ✅ Initialized successfully');
      return true;
    } catch (error) {
      console.error('[SupabaseDataManager] ❌ Initialization failed:', error);
      return false;
    }
  }

  async loadSupabaseClient() {
    return new Promise((resolve, reject) => {
      if (typeof window.supabase !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.onload = () => {
        console.log('[SupabaseDataManager] 📦 Supabase client loaded');
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Supabase client'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize or get existing user in the database
   */
  async initializeUser(userId, sessionOrder = []) {
    if (!this.isInitialized) {
      throw new Error('SupabaseDataManager not initialized');
    }

    try {
      // Check if user exists
      const { data: existingUser, error: selectError } = await this.supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned", which is expected for new users
        throw selectError;
      }

      if (existingUser) {
        console.log('[SupabaseDataManager] 👤 User exists:', userId);
        return existingUser;
      }

      // Create new user
      const { data: newUser, error: insertError } = await this.supabase
        .from('users')
        .insert([
          {
            user_id: userId,
            session_order: sessionOrder,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      console.log('[SupabaseDataManager] ✨ New user created:', userId);
      return newUser;
    } catch (error) {
      console.error('[SupabaseDataManager] Error initializing user:', error);
      throw error;
    }
  }

  /**
   * Update user's session order
   */
  async updateUserSessionOrder(userId, sessionOrder) {
    if (!this.isInitialized) return false;

    try {
      const { error } = await this.supabase
        .from('users')
        .update({ session_order: sessionOrder })
        .eq('user_id', userId);

      if (error) throw error;

      console.log('[SupabaseDataManager] 📝 Session order updated for:', userId);
      return true;
    } catch (error) {
      console.error('[SupabaseDataManager] Error updating session order:', 
        error);
      return false;
    }
  }

  /**
   * Create a new session
   */
  async createSession(sessionData) {
    if (!this.isInitialized) {
      throw new Error('SupabaseDataManager not initialized');
    }

    try {
      const { data: session, error } = await this.supabase
        .from('sessions')
        .insert([
          {
            user_id: sessionData.userId,
            session_id: sessionData.sessionId,
            session_type: sessionData.permutationId + 1, // 1-9
            permutation_id: sessionData.permutationId,
            pacman_speed: sessionData.speedConfig.pacman,
            ghost_speed: sessionData.speedConfig.ghost,
            resumed: sessionData.resumed || false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      this.currentSessionId = session.id;
      console.log('[SupabaseDataManager] 🎮 Session created:', session.id);

      // Create initial session summary
      await this.createSessionSummary(session.id, sessionData.userId);

      return session;
    } catch (error) {
      console.error('[SupabaseDataManager] Error creating session:', error);
      throw error;
    }
  }

  /**
   * Create session summary record
   */
  async createSessionSummary(sessionId, userId) {
    try {
      const { data: summary, error } = await this.supabase
        .from('session_summaries')
        .insert([
          {
            session_id: sessionId,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      console.log('[SupabaseDataManager] 📊 Session summary created');
      return summary;
    } catch (error) {
      console.error('[SupabaseDataManager] Error creating session summary:', 
        error);
      throw error;
    }
  }

  /**
   * Log an event during gameplay
   */
  async logEvent(eventData) {
    if (!this.isInitialized || !this.currentSessionId) return false;

    try {
      const { error } = await this.supabase
        .from('events')
        .insert([
          {
            session_id: this.currentSessionId,
            user_id: eventData.userId,
            event_type: eventData.type,
            event_time: eventData.time,
            event_data: eventData.data || {},
          },
        ]);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('[SupabaseDataManager] Error logging event:', error);
      return false;
    }
  }

  /**
   * Update session summary with aggregated metrics
   */
  async updateSessionSummary(summaryData) {
    if (!this.isInitialized || !this.currentSessionId) return false;

    try {
      const { error } = await this.supabase
        .from('session_summaries')
        .update({
          total_ghosts_eaten: summaryData.totalGhostsEaten,
          total_pellets_eaten: summaryData.totalPelletsEaten,
          total_pacdots_eaten: summaryData.totalPacdotsEaten || 0,
          total_power_pellets_eaten: summaryData.totalPowerPelletsEaten || 0,
          total_fruits_eaten: summaryData.totalFruitsEaten || 0,
          total_deaths: summaryData.totalDeaths,
          successful_turns: summaryData.successfulTurns,
          total_turns: summaryData.totalTurns,
          final_score: summaryData.finalScore || 0,
        })
        .eq('session_id', this.currentSessionId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('[SupabaseDataManager] Error updating session summary:', 
        error);
      return false;
    }
  }

  /**
   * Update session summary with score statistics
   */
  async updateScoreStatistics(userId) {
    if (!this.isInitialized) return false;

    try {
      // Get all completed sessions for this user with scores
      const { data: sessions, error: sessionsError } = await this.supabase
        .from('sessions')
        .select('final_score')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .not('final_score', 'is', null);

      if (sessionsError) throw sessionsError;

      if (!sessions || sessions.length === 0) {
        console.log('[SupabaseDataManager] No completed sessions with scores found');
        return true;
      }

      const scores = sessions.map(s => s.final_score).filter(score => score !== null);
      
      if (scores.length === 0) {
        console.log('[SupabaseDataManager] No valid scores found');
        return true;
      }

      // Calculate statistics
      const highestScore = Math.max(...scores);
      const lowestScore = Math.min(...scores);
      const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      
      // Calculate standard deviation
      const variance = scores.reduce((acc, score) => acc + Math.pow(score - averageScore, 2), 0) / scores.length;
      const stdDev = Math.sqrt(variance);

      console.log('[SupabaseDataManager] 📊 Score Statistics:', {
        count: scores.length,
        highest: highestScore,
        lowest: lowestScore,
        average: averageScore.toFixed(2),
        stdDev: stdDev.toFixed(2)
      });

      // Update all session summaries for this user with the statistics
      const { error: updateError } = await this.supabase
        .from('session_summaries')
        .update({
          highest_score: highestScore,
          lowest_score: lowestScore,
          average_score: parseFloat(averageScore.toFixed(2)),
          score_std_dev: parseFloat(stdDev.toFixed(2)),
        })
        .in('session_id', 
          sessions.map(session => 
            // We need to get session IDs, so let's do this differently
            this.supabase
              .from('sessions')
              .select('id')
              .eq('user_id', userId)
              .eq('status', 'completed')
          )
        );

      // Actually, let's do this with a different approach - update via user sessions
      const { data: userSessions, error: userSessionsError } = await this.supabase
        .from('sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (userSessionsError) throw userSessionsError;

      if (userSessions && userSessions.length > 0) {
        const sessionIds = userSessions.map(s => s.id);
        
        const { error: finalUpdateError } = await this.supabase
          .from('session_summaries')
          .update({
            highest_score: highestScore,
            lowest_score: lowestScore,
            average_score: parseFloat(averageScore.toFixed(2)),
            score_std_dev: parseFloat(stdDev.toFixed(2)),
          })
          .in('session_id', sessionIds);

        if (finalUpdateError) throw finalUpdateError;
      }

      console.log('[SupabaseDataManager] ✅ Score statistics updated for user:', userId);
      return true;
    } catch (error) {
      console.error('[SupabaseDataManager] Error updating score statistics:', error);
      return false;
    }
  }

  /**
   * Complete a session
   */
  async completeSession(gameTime, finalScore = 0) {
    if (!this.isInitialized || !this.currentSessionId) return false;

    try {
      const { error } = await this.supabase
        .from('sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          total_game_time: gameTime,
          final_score: finalScore,
        })
        .eq('id', this.currentSessionId);

      if (error) throw error;

      console.log('[SupabaseDataManager] ✅ Session completed:', 
        this.currentSessionId);
      this.currentSessionId = null;
      return true;
    } catch (error) {
      console.error('[SupabaseDataManager] Error completing session:', error);
      return false;
    }
  }

  /**
   * Get user's session data for local compatibility
   */
  async getUserData(userId) {
    if (!this.isInitialized) return null;

    try {
      // Get user with session order
      const { data: user, error: userError } = await this.supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (userError) throw userError;

      // Get completed sessions count
      const { data: completedSessions, error: sessionsError } = await this
        .supabase
        .from('sessions')
        .select('session_id')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (sessionsError) throw sessionsError;

      return {
        userId,
        sessionOrder: user.session_order,
        completedSessionsCount: completedSessions.length,
      };
    } catch (error) {
      console.error('[SupabaseDataManager] Error getting user data:', error);
      return null;
    }
  }

  /**
   * Export all user data for research analysis
   */
  async exportUserData(userId) {
    if (!this.isInitialized) return null;

    try {
      // Get all sessions with summaries
      const { data: sessions, error } = await this.supabase
        .from('sessions')
        .select(`
          *,
          session_summaries (*),
          events (*)
        `)
        .eq('user_id', userId)
        .order('session_id');

      if (error) throw error;

      return {
        userId,
        sessions,
        exportTimestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[SupabaseDataManager] Error exporting data:', error);
      return null;
    }
  }

  /**
   * Get aggregated research data (for researchers)
   */
  async getResearchData(filters = {}) {
    if (!this.isInitialized) return null;

    try {
      let query = this.supabase
        .from('sessions')
        .select(`
          *,
          session_summaries (*),
          users!inner (user_id)
        `);

      // Apply filters
      if (filters.sessionType) {
        query = query.eq('session_type', filters.sessionType);
      }
      if (filters.pacmanSpeed) {
        query = query.eq('pacman_speed', filters.pacmanSpeed);
      }
      if (filters.ghostSpeed) {
        query = query.eq('ghost_speed', filters.ghostSpeed);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('[SupabaseDataManager] Error getting research data:', 
        error);
      return null;
    }
  }

  /**
   * Check connection status
   */
  async testConnection() {
    if (!this.isInitialized) return false;

    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('[SupabaseDataManager] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get database health stats
   */
  async getHealthStats() {
    if (!this.isInitialized) return null;

    try {
      const [usersResult, sessionsResult, eventsResult] = await Promise.all([
        this.supabase.from('users').select('count'),
        this.supabase.from('sessions').select('count'),
        this.supabase.from('events').select('count'),
      ]);

      return {
        totalUsers: usersResult.data?.[0]?.count || 0,
        totalSessions: sessionsResult.data?.[0]?.count || 0,
        totalEvents: eventsResult.data?.[0]?.count || 0,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[SupabaseDataManager] Error getting health stats:', 
        error);
      return null;
    }
  }

  /**
   * Delete all user data from database (for experiment reset)
   */
  async deleteUserData(userId) {
    if (!this.isInitialized) {
      console.error('[SupabaseDataManager] Cannot delete user data - not initialized');
      return false;
    }

    try {
      console.log('[SupabaseDataManager] 🗑️ Starting deletion of user data:', userId);

      // First, verify the user exists
      const { data: userCheck, error: userCheckError } = await this.supabase
        .from('users')
        .select('user_id')
        .eq('user_id', userId);

      if (userCheckError) {
        console.error('[SupabaseDataManager] Error checking user existence:', userCheckError);
        throw userCheckError;
      }

      if (!userCheck || userCheck.length === 0) {
        console.log('[SupabaseDataManager] ℹ️ No user found with ID:', userId);
        return { success: true, message: 'No user data found to delete' };
      }

      console.log('[SupabaseDataManager] ✅ User exists, proceeding with deletion');

      // Get all session IDs for this user first
      const { data: sessions, error: sessionError } = await this.supabase
        .from('sessions')
        .select('id, session_id')
        .eq('user_id', userId);

      if (sessionError) {
        console.error('[SupabaseDataManager] Error fetching sessions:', sessionError);
        throw sessionError;
      }

      const sessionIds = sessions.map(session => session.id);
      console.log('[SupabaseDataManager] Found sessions to delete:', sessions);

      // Delete in order: events -> session_summaries -> sessions -> users
      if (sessionIds.length > 0) {
        // Delete events
        console.log('[SupabaseDataManager] 🗑️ Deleting events for sessions:', sessionIds);
        const { data: deletedEvents, error: eventsError } = await this.supabase
          .from('events')
          .delete()
          .in('session_id', sessionIds)
          .select();

        if (eventsError) {
          console.error('[SupabaseDataManager] Error deleting events:', eventsError);
          throw eventsError;
        }
        console.log('[SupabaseDataManager] ✅ Deleted events:', deletedEvents?.length || 0);

        // Delete session summaries
        console.log('[SupabaseDataManager] 🗑️ Deleting session summaries for sessions:', sessionIds);
        const { data: deletedSummaries, error: summariesError } = await this.supabase
          .from('session_summaries')
          .delete()
          .in('session_id', sessionIds)
          .select();

        if (summariesError) {
          console.error('[SupabaseDataManager] Error deleting session summaries:', summariesError);
          throw summariesError;
        }
        console.log('[SupabaseDataManager] ✅ Deleted session summaries:', deletedSummaries?.length || 0);

        // Delete sessions
        console.log('[SupabaseDataManager] 🗑️ Deleting sessions for user:', userId);
        const { data: deletedSessions, error: sessionsError } = await this.supabase
          .from('sessions')
          .delete()
          .eq('user_id', userId)
          .select();

        if (sessionsError) {
          console.error('[SupabaseDataManager] Error deleting sessions:', sessionsError);
          throw sessionsError;
        }
        console.log('[SupabaseDataManager] ✅ Deleted sessions:', deletedSessions?.length || 0);
      } else {
        console.log('[SupabaseDataManager] ℹ️ No sessions found for user:', userId);
      }

      // Delete user record
      console.log('[SupabaseDataManager] 🗑️ Deleting user record:', userId);
      const { data: deletedUser, error: userError } = await this.supabase
        .from('users')
        .delete()
        .eq('user_id', userId)
        .select();

      if (userError) {
        console.error('[SupabaseDataManager] Error deleting user record:', userError);
        throw userError;
      }
      console.log('[SupabaseDataManager] ✅ Deleted user record:', deletedUser);

      // Reset current session ID if it belongs to this user
      this.currentSessionId = null;

      // Verify deletion by checking if any data remains
      const { data: remainingSessions } = await this.supabase
        .from('sessions')
        .select('id')
        .eq('user_id', userId);

      const { data: remainingUser } = await this.supabase
        .from('users')
        .select('user_id')
        .eq('user_id', userId);

      if (remainingSessions?.length > 0 || remainingUser?.length > 0) {
        console.error('[SupabaseDataManager] ⚠️ Deletion verification failed - data still exists!');
        console.error('Remaining sessions:', remainingSessions);
        console.error('Remaining user:', remainingUser);
        return { success: false, message: 'Deletion verification failed - data still exists' };
      }

      console.log('[SupabaseDataManager] 🎉 Successfully deleted all data for user:', userId);
      console.log('[SupabaseDataManager] ✅ Deletion verified - no data remains');
      return { success: true, message: 'All user data successfully deleted' };
    } catch (error) {
      console.error('[SupabaseDataManager] ❌ Error deleting user data:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Delete the last (most recent) session's data for a user
   */
  async deleteLastSession(userId) {
    if (!this.isInitialized) return false;

    try {
      console.log('[SupabaseDataManager] 🗑️ Starting deletion of last session for user:', userId);

      // Get the most recent session for this user
      const { data: lastSession, error: sessionError } = await this.supabase
        .from('sessions')
        .select('id, session_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (sessionError) {
        if (sessionError.code === 'PGRST116') {
          console.log('[SupabaseDataManager] ℹ️ No sessions found for user:', userId);
          return { success: true, message: 'No sessions found to delete' };
        }
        throw sessionError;
      }

      console.log('[SupabaseDataManager] Found last session to delete:', lastSession);

      // Delete in order: events -> session_summaries -> sessions
      // Delete events for this session
      const { error: eventsError } = await this.supabase
        .from('events')
        .delete()
        .eq('session_id', lastSession.id);

      if (eventsError) throw eventsError;
      console.log('[SupabaseDataManager] ✅ Deleted events for session:', lastSession.id);

      // Delete session summary for this session
      const { error: summaryError } = await this.supabase
        .from('session_summaries')
        .delete()
        .eq('session_id', lastSession.id);

      if (summaryError) throw summaryError;
      console.log('[SupabaseDataManager] ✅ Deleted session summary for session:', lastSession.id);

      // Delete the session record
      const { error: sessionDeleteError } = await this.supabase
        .from('sessions')
        .delete()
        .eq('id', lastSession.id);

      if (sessionDeleteError) throw sessionDeleteError;
      console.log('[SupabaseDataManager] ✅ Deleted session record:', lastSession.id);

      // Reset current session ID if it matches the deleted session
      if (this.currentSessionId === lastSession.id) {
        this.currentSessionId = null;
      }

      console.log('[SupabaseDataManager] 🎉 Successfully deleted last session:', lastSession.session_id);
      return { 
        success: true, 
        message: `Deleted session ${lastSession.session_id}`,
        deletedSessionId: lastSession.session_id 
      };
    } catch (error) {
      console.error('[SupabaseDataManager] ❌ Error deleting last session:', error);
      return { success: false, message: error.message };
    }
  }
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SupabaseDataManager;
} else {
  window.SupabaseDataManager = SupabaseDataManager;
}
class VisualizationDashboard {
  constructor(experimentManager, sessionManager, exportManager) {
    this.experimentManager = experimentManager;
    this.sessionManager = sessionManager;
    this.exportManager = exportManager;
    this.charts = {};
    this.dashboardContainer = null;
    this.isVisible = false;
    this.updateInterval = null;
    this.chartColors = {
      primary: '#4CAF50',
      secondary: '#2196F3',
      accent: '#FF9800',
      error: '#F44336',
      success: '#8BC34A',
      warning: '#FFC107'
    };
    this.isInitialized = false;
    this.DEBUG = true;
  }

  initialize() {
    if (this.isInitialized) return;
    
    this.createDashboardStructure();
    this.bindEvents();
    this.isInitialized = true;
    
    if (this.DEBUG) {
      console.log('[VisualizationDashboard] Initialized');
    }
  }

  bindEvents() {
    window.addEventListener('experimentSessionStarted', () => {
      this.startRealTimeUpdates();
    });

    window.addEventListener('experimentSessionEnded', () => {
      this.updateDashboard();
    });

    window.addEventListener('experimentComplete', () => {
      this.generateCompleteDashboard();
    });

    // Keyboard shortcut to toggle dashboard
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        this.toggleDashboard();
      }
    });
  }

  createDashboardStructure() {
    // Remove existing dashboard
    const existing = document.getElementById('visualization-dashboard');
    if (existing) {
      existing.remove();
    }

    const dashboardHTML = `
      <div id="visualization-dashboard" style="
        position: fixed;
        top: 0;
        right: -500px;
        width: 480px;
        height: 100vh;
        background: rgba(0, 0, 0, 0.95);
        color: white;
        font-family: monospace;
        font-size: 12px;
        overflow-y: auto;
        z-index: 2000;
        transition: right 0.3s ease;
        border-left: 2px solid #4CAF50;
      ">
        <div style="padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #4CAF50;">Analytics Dashboard</h2>
            <button id="close-dashboard" style="background: #F44336; border: none; color: white; padding: 5px 10px; border-radius: 3px; cursor: pointer;">×</button>
          </div>
          
          <div id="dashboard-tabs" style="display: flex; margin-bottom: 20px; border-bottom: 1px solid #333;">
            <button class="dashboard-tab active" data-tab="overview" style="flex: 1; padding: 10px; background: none; border: none; color: white; cursor: pointer;">Overview</button>
            <button class="dashboard-tab" data-tab="performance" style="flex: 1; padding: 10px; background: none; border: none; color: white; cursor: pointer;">Performance</button>
            <button class="dashboard-tab" data-tab="analytics" style="flex: 1; padding: 10px; background: none; border: none; color: white; cursor: pointer;">Analytics</button>
          </div>

          <div id="tab-overview" class="dashboard-content">
            <div id="experiment-overview"></div>
            <div id="current-session-chart"></div>
            <div id="progress-visualization"></div>
          </div>

          <div id="tab-performance" class="dashboard-content" style="display: none;">
            <div id="performance-metrics"></div>
            <div id="speed-comparison-chart"></div>
            <div id="turn-accuracy-chart"></div>
          </div>

          <div id="tab-analytics" class="dashboard-content" style="display: none;">
            <div id="statistical-summary"></div>
            <div id="correlation-matrix"></div>
            <div id="trend-analysis"></div>
          </div>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #333;">
            <button id="export-dashboard" style="width: 100%; padding: 10px; background: #2196F3; border: none; color: white; border-radius: 3px; cursor: pointer; margin-bottom: 10px;">Export Dashboard</button>
            <button id="download-charts" style="width: 100%; padding: 10px; background: #FF9800; border: none; color: white; border-radius: 3px; cursor: pointer;">Download Charts</button>
          </div>

          <div style="margin-top: 10px; font-size: 10px; color: #666; text-align: center;">
            Press Ctrl+D to toggle dashboard
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', dashboardHTML);
    this.dashboardContainer = document.getElementById('visualization-dashboard');
    this.bindDashboardEvents();
  }

  bindDashboardEvents() {
    // Close button
    document.getElementById('close-dashboard').addEventListener('click', () => {
      this.hideDashboard();
    });

    // Tab switching
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.tab);
      });
    });

    // Export buttons
    document.getElementById('export-dashboard').addEventListener('click', () => {
      this.exportDashboard();
    });

    document.getElementById('download-charts').addEventListener('click', () => {
      this.downloadCharts();
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
      tab.classList.remove('active');
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
        tab.style.borderBottom = '2px solid #4CAF50';
      } else {
        tab.style.borderBottom = 'none';
      }
    });

    // Show/hide content
    document.querySelectorAll('.dashboard-content').forEach(content => {
      content.style.display = 'none';
    });
    
    const targetContent = document.getElementById(`tab-${tabName}`);
    if (targetContent) {
      targetContent.style.display = 'block';
      this.updateTabContent(tabName);
    }
  }

  updateTabContent(tabName) {
    switch (tabName) {
      case 'overview':
        this.updateOverviewTab();
        break;
      case 'performance':
        this.updatePerformanceTab();
        break;
      case 'analytics':
        this.updateAnalyticsTab();
        break;
    }
  }

  updateOverviewTab() {
    this.renderExperimentOverview();
    this.renderCurrentSessionChart();
    this.renderProgressVisualization();
  }

  updatePerformanceTab() {
    this.renderPerformanceMetrics();
    this.renderSpeedComparisonChart();
    this.renderTurnAccuracyChart();
  }

  updateAnalyticsTab() {
    this.renderStatisticalSummary();
    this.renderCorrelationMatrix();
    this.renderTrendAnalysis();
  }

  renderExperimentOverview() {
    const container = document.getElementById('experiment-overview');
    if (!container) return;

    const completedSessions = this.experimentManager.getCompletedSessionsCount();
    const analytics = this.sessionManager.getSessionAnalytics();
    const currentSession = this.experimentManager.getCurrentSessionInfo();

    container.innerHTML = `
      <div style="background: rgba(76, 175, 80, 0.1); padding: 15px; border-radius: 5px; margin-bottom: 15px;">
        <h3 style="margin: 0 0 10px 0; color: #4CAF50;">Experiment Status</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <div style="color: #ccc;">Progress</div>
            <div style="font-size: 18px; font-weight: bold;">${completedSessions}/9 Sessions</div>
          </div>
          <div>
            <div style="color: #ccc;">Completion</div>
            <div style="font-size: 18px; font-weight: bold;">${Math.round((completedSessions / 9) * 100)}%</div>
          </div>
          <div>
            <div style="color: #ccc;">User ID</div>
            <div style="font-size: 14px;">${this.experimentManager.userId || 'Not set'}</div>
          </div>
          <div>
            <div style="color: #ccc;">Current Session</div>
            <div style="font-size: 14px;">${currentSession ? currentSession.sessionId : 'None'}</div>
          </div>
        </div>
      </div>
    `;

    if (currentSession) {
      container.innerHTML += `
        <div style="background: rgba(33, 150, 243, 0.1); padding: 15px; border-radius: 5px;">
          <h4 style="margin: 0 0 10px 0; color: #2196F3;">Current Session</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <div style="color: #ccc;">Pac-Man Speed</div>
              <div style="font-weight: bold;">${currentSession.speedConfig.pacman}</div>
            </div>
            <div>
              <div style="color: #ccc;">Ghost Speed</div>
              <div style="font-weight: bold;">${currentSession.speedConfig.ghost}</div>
            </div>
          </div>
        </div>
      `;
    }
  }

  renderCurrentSessionChart() {
    const container = document.getElementById('current-session-chart');
    if (!container) return;

    const currentMetrics = this.experimentManager.currentMetrics;
    if (!currentMetrics) {
      container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No active session</div>';
      return;
    }

    const summary = currentMetrics.summary;
    const maxGhosts = 20; // Reasonable maximum for visualization
    const maxPellets = 200;

    container.innerHTML = `
      <div style="background: rgba(255, 152, 0, 0.1); padding: 15px; border-radius: 5px; margin-bottom: 15px;">
        <h4 style="margin: 0 0 15px 0; color: #FF9800;">Session Metrics</h4>
        
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Ghosts Eaten</span>
            <span>${summary.totalGhostsEaten}</span>
          </div>
          <div style="background: #333; height: 8px; border-radius: 4px;">
            <div style="background: #4CAF50; height: 100%; width: ${(summary.totalGhostsEaten / maxGhosts) * 100}%; border-radius: 4px;"></div>
          </div>
        </div>

        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Pellets Eaten</span>
            <span>${summary.totalPelletsEaten}</span>
          </div>
          <div style="background: #333; height: 8px; border-radius: 4px;">
            <div style="background: #2196F3; height: 100%; width: ${(summary.totalPelletsEaten / maxPellets) * 100}%; border-radius: 4px;"></div>
          </div>
        </div>

        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Turn Accuracy</span>
            <span>${summary.totalTurns > 0 ? Math.round((summary.successfulTurns / summary.totalTurns) * 100) : 0}%</span>
          </div>
          <div style="background: #333; height: 8px; border-radius: 4px;">
            <div style="background: #FF9800; height: 100%; width: ${summary.totalTurns > 0 ? (summary.successfulTurns / summary.totalTurns) * 100 : 0}%; border-radius: 4px;"></div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; text-align: center; margin-top: 15px;">
          <div>
            <div style="color: #F44336; font-size: 18px; font-weight: bold;">${summary.totalDeaths}</div>
            <div style="color: #ccc; font-size: 10px;">Deaths</div>
          </div>
          <div>
            <div style="color: #4CAF50; font-size: 18px; font-weight: bold;">${summary.successfulTurns}</div>
            <div style="color: #ccc; font-size: 10px;">Good Turns</div>
          </div>
          <div>
            <div style="color: #FF9800; font-size: 18px; font-weight: bold;">${currentMetrics.events.length}</div>
            <div style="color: #ccc; font-size: 10px;">Events</div>
          </div>
        </div>
      </div>
    `;
  }

  renderProgressVisualization() {
    const container = document.getElementById('progress-visualization');
    if (!container) return;

    const sessions = this.experimentManager.metrics;
    const sessionOrder = this.experimentManager.sessionOrder;
    const completedSessions = this.experimentManager.getCompletedSessionsCount();

    let progressHTML = `
      <div style="background: rgba(156, 39, 176, 0.1); padding: 15px; border-radius: 5px;">
        <h4 style="margin: 0 0 15px 0; color: #9C27B0;">Session Progress</h4>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
    `;

    for (let i = 0; i < 9; i++) {
      const isCompleted = i < completedSessions;
      const isCurrent = i === completedSessions && this.experimentManager.isExperimentActive;
      const permutationId = sessionOrder[i];
      const config = permutationId !== undefined ? this.experimentManager.PERMUTATIONS[permutationId] : null;
      
      let bgColor = '#333';
      let textColor = '#666';
      let borderColor = 'transparent';
      
      if (isCompleted) {
        bgColor = '#4CAF50';
        textColor = 'white';
      } else if (isCurrent) {
        bgColor = '#FF9800';
        textColor = 'white';
        borderColor = '#FFB74D';
      }

      progressHTML += `
        <div style="
          background: ${bgColor};
          color: ${textColor};
          padding: 8px;
          border-radius: 3px;
          text-align: center;
          font-size: 10px;
          border: 2px solid ${borderColor};
        ">
          <div style="font-weight: bold;">S${i + 1}</div>
          ${config ? `<div>${config.pacman.charAt(0).toUpperCase()}/${config.ghost.charAt(0).toUpperCase()}</div>` : '<div>-/-</div>'}
        </div>
      `;
    }

    progressHTML += `
        </div>
        <div style="margin-top: 10px; font-size: 10px; color: #666;">
          S = Session, P/G = Pac-Man/Ghost Speed (S/N/F = Slow/Normal/Fast)
        </div>
      </div>
    `;

    container.innerHTML = progressHTML;
  }

  renderPerformanceMetrics() {
    const container = document.getElementById('performance-metrics');
    if (!container) return;

    const sessions = this.experimentManager.metrics;
    if (sessions.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No completed sessions</div>';
      return;
    }

    const stats = this.calculateSessionStats(sessions);

    container.innerHTML = `
      <div style="background: rgba(33, 150, 243, 0.1); padding: 15px; border-radius: 5px; margin-bottom: 15px;">
        <h4 style="margin: 0 0 15px 0; color: #2196F3;">Performance Overview</h4>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div>
            <h5 style="margin: 0 0 10px 0; color: #4CAF50;">Ghosts Eaten</h5>
            <div>Avg: <span style="font-weight: bold;">${stats.ghosts.avg.toFixed(1)}</span></div>
            <div>Best: <span style="font-weight: bold;">${stats.ghosts.max}</span></div>
            <div>Total: <span style="font-weight: bold;">${stats.ghosts.total}</span></div>
          </div>
          
          <div>
            <h5 style="margin: 0 0 10px 0; color: #2196F3;">Pellets Eaten</h5>
            <div>Avg: <span style="font-weight: bold;">${stats.pellets.avg.toFixed(1)}</span></div>
            <div>Best: <span style="font-weight: bold;">${stats.pellets.max}</span></div>
            <div>Total: <span style="font-weight: bold;">${stats.pellets.total}</span></div>
          </div>
          
          <div>
            <h5 style="margin: 0 0 10px 0; color: #FF9800;">Turn Accuracy</h5>
            <div>Avg: <span style="font-weight: bold;">${(stats.accuracy.avg * 100).toFixed(1)}%</span></div>
            <div>Best: <span style="font-weight: bold;">${(stats.accuracy.max * 100).toFixed(1)}%</span></div>
            <div>Worst: <span style="font-weight: bold;">${(stats.accuracy.min * 100).toFixed(1)}%</span></div>
          </div>
          
          <div>
            <h5 style="margin: 0 0 10px 0; color: #F44336;">Deaths</h5>
            <div>Avg: <span style="font-weight: bold;">${stats.deaths.avg.toFixed(1)}</span></div>
            <div>Most: <span style="font-weight: bold;">${stats.deaths.max}</span></div>
            <div>Total: <span style="font-weight: bold;">${stats.deaths.total}</span></div>
          </div>
        </div>
      </div>
    `;
  }

  renderSpeedComparisonChart() {
    const container = document.getElementById('speed-comparison-chart');
    if (!container) return;

    const sessions = this.experimentManager.metrics;
    const speedAnalysis = this.analyzeSpeedEffects(sessions);

    if (!speedAnalysis || Object.keys(speedAnalysis.pacman).length === 0) {
      container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">Insufficient data for speed analysis</div>';
      return;
    }

    container.innerHTML = `
      <div style="background: rgba(76, 175, 80, 0.1); padding: 15px; border-radius: 5px; margin-bottom: 15px;">
        <h4 style="margin: 0 0 15px 0; color: #4CAF50;">Speed Configuration Effects</h4>
        
        <div style="margin-bottom: 20px;">
          <h5 style="margin: 0 0 10px 0;">Pac-Man Speed Impact</h5>
          ${this.renderSpeedBars('pacman', speedAnalysis.pacman)}
        </div>
        
        <div>
          <h5 style="margin: 0 0 10px 0;">Ghost Speed Impact</h5>
          ${this.renderSpeedBars('ghost', speedAnalysis.ghost)}
        </div>
      </div>
    `;
  }

  renderSpeedBars(entityType, data) {
    const speeds = ['slow', 'normal', 'fast'];
    const maxValue = Math.max(...speeds.map(speed => data[speed]?.avgGhostsEaten || 0));
    
    return speeds.map(speed => {
      const speedData = data[speed];
      if (!speedData) return '';
      
      const value = speedData.avgGhostsEaten;
      const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
      
      return `
        <div style="margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span style="text-transform: capitalize;">${speed}</span>
            <span style="font-weight: bold;">${value.toFixed(1)}</span>
          </div>
          <div style="background: #333; height: 6px; border-radius: 3px;">
            <div style="background: ${this.getSpeedColor(speed)}; height: 100%; width: ${percentage}%; border-radius: 3px;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  getSpeedColor(speed) {
    switch (speed) {
      case 'slow': return '#4CAF50';
      case 'normal': return '#FF9800';
      case 'fast': return '#F44336';
      default: return '#666';
    }
  }

  renderTurnAccuracyChart() {
    const container = document.getElementById('turn-accuracy-chart');
    if (!container) return;

    const sessions = this.experimentManager.metrics;
    if (sessions.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No session data available</div>';
      return;
    }

    const accuracyData = sessions.map((session, index) => ({
      session: index + 1,
      accuracy: session.summary && session.summary.totalTurns > 0 
        ? session.summary.successfulTurns / session.summary.totalTurns 
        : 0,
      config: session.speedConfig
    }));

    const maxAccuracy = Math.max(...accuracyData.map(d => d.accuracy));

    container.innerHTML = `
      <div style="background: rgba(255, 152, 0, 0.1); padding: 15px; border-radius: 5px;">
        <h4 style="margin: 0 0 15px 0; color: #FF9800;">Turn Accuracy by Session</h4>
        <div style="height: 120px; display: flex; align-items: end; justify-content: space-between; padding: 10px 0;">
          ${accuracyData.map(data => `
            <div style="flex: 1; margin: 0 2px; display: flex; flex-direction: column; align-items: center;">
              <div style="
                background: ${this.getAccuracyColor(data.accuracy)};
                width: 100%;
                height: ${(data.accuracy / (maxAccuracy || 1)) * 100}px;
                min-height: 2px;
                border-radius: 2px 2px 0 0;
              "></div>
              <div style="font-size: 9px; margin-top: 4px; text-align: center;">
                S${data.session}
              </div>
            </div>
          `).join('')}
        </div>
        <div style="font-size: 10px; color: #666; text-align: center;">
          Session accuracy: ${(accuracyData.reduce((sum, d) => sum + d.accuracy, 0) / accuracyData.length * 100).toFixed(1)}% average
        </div>
      </div>
    `;
  }

  getAccuracyColor(accuracy) {
    if (accuracy >= 0.8) return '#4CAF50';
    if (accuracy >= 0.6) return '#FF9800';
    return '#F44336';
  }

  renderStatisticalSummary() {
    const container = document.getElementById('statistical-summary');
    if (!container) return;

    const sessions = this.experimentManager.metrics;
    if (sessions.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No statistical data available</div>';
      return;
    }

    const stats = this.calculateAdvancedStats(sessions);

    container.innerHTML = `
      <div style="background: rgba(156, 39, 176, 0.1); padding: 15px; border-radius: 5px; margin-bottom: 15px;">
        <h4 style="margin: 0 0 15px 0; color: #9C27B0;">Statistical Summary</h4>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div>
            <h5 style="margin: 0 0 8px 0; color: #ccc;">Performance Metrics</h5>
            <div style="font-size: 11px;">
              <div>Ghosts: μ=${stats.ghosts.mean.toFixed(1)}, σ=${stats.ghosts.std.toFixed(1)}</div>
              <div>Pellets: μ=${stats.pellets.mean.toFixed(1)}, σ=${stats.pellets.std.toFixed(1)}</div>
              <div>Accuracy: μ=${(stats.accuracy.mean * 100).toFixed(1)}%, σ=${(stats.accuracy.std * 100).toFixed(1)}%</div>
            </div>
          </div>
          
          <div>
            <h5 style="margin: 0 0 8px 0; color: #ccc;">Data Quality</h5>
            <div style="font-size: 11px;">
              <div>Sessions: ${sessions.length}/9</div>
              <div>Completeness: ${(sessions.length / 9 * 100).toFixed(1)}%</div>
              <div>Data Points: ${sessions.reduce((sum, s) => sum + (s.events?.length || 0), 0)}</div>
            </div>
          </div>
        </div>

        <div style="margin-top: 15px;">
          <h5 style="margin: 0 0 8px 0; color: #ccc;">Speed Configuration Distribution</h5>
          <div style="font-size: 11px;">
            ${this.renderConfigDistribution(sessions)}
          </div>
        </div>
      </div>
    `;
  }

  renderConfigDistribution(sessions) {
    const configCounts = {};
    sessions.forEach(session => {
      if (session.speedConfig) {
        const key = `${session.speedConfig.pacman}-${session.speedConfig.ghost}`;
        configCounts[key] = (configCounts[key] || 0) + 1;
      }
    });

    return Object.entries(configCounts)
      .map(([config, count]) => `<div>${config}: ${count} session(s)</div>`)
      .join('');
  }

  renderCorrelationMatrix() {
    const container = document.getElementById('correlation-matrix');
    if (!container) return;

    const sessions = this.experimentManager.metrics;
    if (sessions.length < 3) {
      container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">Need more sessions for correlation analysis</div>';
      return;
    }

    const correlations = this.calculateCorrelations(sessions);

    container.innerHTML = `
      <div style="background: rgba(33, 150, 243, 0.1); padding: 15px; border-radius: 5px;">
        <h4 style="margin: 0 0 15px 0; color: #2196F3;">Correlation Analysis</h4>
        <div style="font-size: 11px;">
          <div style="margin-bottom: 8px;">
            <strong>Strong correlations found:</strong>
          </div>
          ${this.renderCorrelationList(correlations)}
        </div>
        <div style="margin-top: 10px; font-size: 10px; color: #666;">
          Correlation strength: |r| > 0.7 (strong), 0.5-0.7 (moderate), < 0.5 (weak)
        </div>
      </div>
    `;
  }

  renderCorrelationList(correlations) {
    return correlations
      .filter(corr => Math.abs(corr.value) > 0.5)
      .map(corr => `
        <div style="margin-bottom: 5px;">
          ${corr.var1} ↔ ${corr.var2}: 
          <span style="color: ${corr.value > 0 ? '#4CAF50' : '#F44336'}; font-weight: bold;">
            ${corr.value.toFixed(3)}
          </span>
          (${Math.abs(corr.value) > 0.7 ? 'strong' : 'moderate'})
        </div>
      `)
      .join('') || '<div style="color: #666;">No strong correlations detected</div>';
  }

  renderTrendAnalysis() {
    const container = document.getElementById('trend-analysis');
    if (!container) return;

    const sessions = this.experimentManager.metrics;
    if (sessions.length < 3) {
      container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">Need more sessions for trend analysis</div>';
      return;
    }

    const trends = this.calculateTrends(sessions);

    container.innerHTML = `
      <div style="background: rgba(76, 175, 80, 0.1); padding: 15px; border-radius: 5px;">
        <h4 style="margin: 0 0 15px 0; color: #4CAF50;">Performance Trends</h4>
        <div style="font-size: 11px;">
          ${this.renderTrendList(trends)}
        </div>
        <div style="margin-top: 10px; font-size: 10px; color: #666;">
          Trends calculated using linear regression over session order
        </div>
      </div>
    `;
  }

  renderTrendList(trends) {
    return Object.entries(trends)
      .map(([metric, trend]) => `
        <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
          <span style="text-transform: capitalize;">${metric.replace(/([A-Z])/g, ' $1')}</span>
          <span style="color: ${trend.slope > 0 ? '#4CAF50' : '#F44336'};">
            ${trend.slope > 0 ? '↗' : '↘'} ${Math.abs(trend.slope).toFixed(3)}/session
          </span>
        </div>
      `)
      .join('');
  }

  // Statistical calculation methods
  calculateSessionStats(sessions) {
    const getValues = (field) => sessions
      .filter(s => s.summary && s.summary[field] !== undefined)
      .map(s => s.summary[field]);

    const accuracyValues = sessions
      .filter(s => s.summary && s.summary.totalTurns > 0)
      .map(s => s.summary.successfulTurns / s.summary.totalTurns);

    return {
      ghosts: this.getStatSummary(getValues('totalGhostsEaten')),
      pellets: this.getStatSummary(getValues('totalPelletsEaten')),
      deaths: this.getStatSummary(getValues('totalDeaths')),
      accuracy: this.getStatSummary(accuracyValues)
    };
  }

  getStatSummary(values) {
    if (values.length === 0) return { avg: 0, max: 0, min: 0, total: 0 };
    
    return {
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      max: Math.max(...values),
      min: Math.min(...values),
      total: values.reduce((sum, val) => sum + val, 0)
    };
  }

  calculateAdvancedStats(sessions) {
    const getValues = (field) => sessions
      .filter(s => s.summary && s.summary[field] !== undefined)
      .map(s => s.summary[field]);

    const accuracyValues = sessions
      .filter(s => s.summary && s.summary.totalTurns > 0)
      .map(s => s.summary.successfulTurns / s.summary.totalTurns);

    return {
      ghosts: this.calculateMeanStd(getValues('totalGhostsEaten')),
      pellets: this.calculateMeanStd(getValues('totalPelletsEaten')),
      accuracy: this.calculateMeanStd(accuracyValues)
    };
  }

  calculateMeanStd(values) {
    if (values.length === 0) return { mean: 0, std: 0 };
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return {
      mean,
      std: Math.sqrt(variance)
    };
  }

  analyzeSpeedEffects(sessions) {
    const speedGroups = {
      pacman: { slow: [], normal: [], fast: [] },
      ghost: { slow: [], normal: [], fast: [] }
    };

    sessions.forEach(session => {
      if (session.speedConfig && session.summary) {
        speedGroups.pacman[session.speedConfig.pacman].push(session.summary);
        speedGroups.ghost[session.speedConfig.ghost].push(session.summary);
      }
    });

    const analysis = {};

    ['pacman', 'ghost'].forEach(entityType => {
      analysis[entityType] = {};
      
      ['slow', 'normal', 'fast'].forEach(speed => {
        const group = speedGroups[entityType][speed];
        if (group.length > 0) {
          analysis[entityType][speed] = {
            sessionCount: group.length,
            avgGhostsEaten: group.reduce((sum, s) => sum + (s.totalGhostsEaten || 0), 0) / group.length,
            avgPelletsEaten: group.reduce((sum, s) => sum + (s.totalPelletsEaten || 0), 0) / group.length,
            avgDeaths: group.reduce((sum, s) => sum + (s.totalDeaths || 0), 0) / group.length,
            avgTurnAccuracy: group.reduce((sum, s) => 
              sum + (s.totalTurns > 0 ? s.successfulTurns / s.totalTurns : 0), 0
            ) / group.length
          };
        }
      });
    });

    return analysis;
  }

  calculateCorrelations(sessions) {
    const variables = ['totalGhostsEaten', 'totalPelletsEaten', 'totalDeaths'];
    const correlations = [];

    for (let i = 0; i < variables.length; i++) {
      for (let j = i + 1; j < variables.length; j++) {
        const var1 = variables[i];
        const var2 = variables[j];
        
        const values1 = sessions
          .filter(s => s.summary && s.summary[var1] !== undefined)
          .map(s => s.summary[var1]);
        const values2 = sessions
          .filter(s => s.summary && s.summary[var2] !== undefined)
          .map(s => s.summary[var2]);

        if (values1.length === values2.length && values1.length > 2) {
          const correlation = this.pearsonCorrelation(values1, values2);
          correlations.push({
            var1: var1.replace(/total/g, '').toLowerCase(),
            var2: var2.replace(/total/g, '').toLowerCase(),
            value: correlation
          });
        }
      }
    }

    return correlations;
  }

  pearsonCorrelation(x, y) {
    const n = x.length;
    if (n === 0) return 0;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  calculateTrends(sessions) {
    const variables = ['totalGhostsEaten', 'totalPelletsEaten', 'totalDeaths'];
    const trends = {};

    variables.forEach(variable => {
      const values = sessions
        .filter(s => s.summary && s.summary[variable] !== undefined)
        .map((s, index) => ({ x: index + 1, y: s.summary[variable] }));

      if (values.length > 2) {
        trends[variable] = this.linearRegression(values);
      }
    });

    return trends;
  }

  linearRegression(points) {
    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  toggleDashboard() {
    if (this.isVisible) {
      this.hideDashboard();
    } else {
      this.showDashboard();
    }
  }

  showDashboard() {
    if (this.dashboardContainer) {
      this.dashboardContainer.style.right = '0px';
      this.isVisible = true;
      this.updateDashboard();
      
      if (this.DEBUG) {
        console.log('[VisualizationDashboard] Dashboard shown');
      }
    }
  }

  hideDashboard() {
    if (this.dashboardContainer) {
      this.dashboardContainer.style.right = '-500px';
      this.isVisible = false;
      
      if (this.DEBUG) {
        console.log('[VisualizationDashboard] Dashboard hidden');
      }
    }
  }

  updateDashboard() {
    if (!this.isVisible) return;
    
    const activeTab = document.querySelector('.dashboard-tab.active');
    if (activeTab) {
      this.updateTabContent(activeTab.dataset.tab);
    }
  }

  startRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      if (this.isVisible && this.experimentManager.isExperimentActive) {
        this.updateDashboard();
      }
    }, 5000); // Update every 5 seconds during active session
  }

  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  generateCompleteDashboard() {
    // Show dashboard with complete experiment analysis
    this.showDashboard();
    this.updateDashboard();
    
    // Switch to analytics tab for completion
    this.switchTab('analytics');
  }

  exportDashboard() {
    const dashboardData = {
      timestamp: new Date().toISOString(),
      userId: this.experimentManager.userId,
      dashboardSnapshot: {
        overview: this.getDashboardSnapshot('overview'),
        performance: this.getDashboardSnapshot('performance'),
        analytics: this.getDashboardSnapshot('analytics')
      }
    };

    const content = JSON.stringify(dashboardData, null, 2);
    const filename = `dashboard_${this.experimentManager.userId}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    this.downloadFile(filename, content, 'application/json');
  }

  getDashboardSnapshot(tabName) {
    // Capture current dashboard state for each tab
    return {
      tabName,
      lastUpdated: new Date().toISOString(),
      data: this.gatherTabData(tabName)
    };
  }

  gatherTabData(tabName) {
    switch (tabName) {
      case 'overview':
        return {
          experimentStatus: {
            completedSessions: this.experimentManager.getCompletedSessionsCount(),
            currentSession: this.experimentManager.getCurrentSessionInfo()
          },
          sessionProgress: this.experimentManager.sessionOrder
        };
      case 'performance':
        return {
          sessionStats: this.calculateSessionStats(this.experimentManager.metrics),
          speedAnalysis: this.analyzeSpeedEffects(this.experimentManager.metrics)
        };
      case 'analytics':
        return {
          statisticalSummary: this.calculateAdvancedStats(this.experimentManager.metrics),
          correlations: this.calculateCorrelations(this.experimentManager.metrics),
          trends: this.calculateTrends(this.experimentManager.metrics)
        };
      default:
        return {};
    }
  }

  downloadCharts() {
    // Generate chart images (simplified as text-based for this implementation)
    const chartData = this.generateChartExport();
    const content = JSON.stringify(chartData, null, 2);
    const filename = `charts_${this.experimentManager.userId}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    this.downloadFile(filename, content, 'application/json');
  }

  generateChartExport() {
    return {
      sessionProgress: this.experimentManager.sessionOrder,
      performanceMetrics: this.calculateSessionStats(this.experimentManager.metrics),
      speedComparison: this.analyzeSpeedEffects(this.experimentManager.metrics),
      turnAccuracy: this.experimentManager.metrics.map(s => ({
        session: s.sessionId,
        accuracy: s.summary?.totalTurns > 0 ? s.summary.successfulTurns / s.summary.totalTurns : 0
      }))
    };
  }

  downloadFile(filename, content, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      isVisible: this.isVisible,
      chartsActive: Object.keys(this.charts).length,
      updateInterval: this.updateInterval !== null,
      dashboardContainer: this.dashboardContainer !== null
    };
  }

  destroy() {
    this.stopRealTimeUpdates();
    
    if (this.dashboardContainer) {
      this.dashboardContainer.remove();
      this.dashboardContainer = null;
    }
    
    this.charts = {};
    this.isVisible = false;
    this.isInitialized = false;
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

