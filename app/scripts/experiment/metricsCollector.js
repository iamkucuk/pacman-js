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

// removeIf(production)
module.exports = MetricsCollector;
// endRemoveIf(production)