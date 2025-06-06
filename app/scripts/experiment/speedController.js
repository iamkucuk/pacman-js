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

// removeIf(production)
module.exports = SpeedController;
// endRemoveIf(production)