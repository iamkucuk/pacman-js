class SpeedController {
  constructor() {
    this.originalSpeeds = {
      pacman: null,
      ghosts: {},
    };
    this.currentSpeeds = {
      pacman: 11,  // Default normal speed
      ghost: 8.25  // Default normal ghost speed
    };
    this.isInitialized = false;
  }

  // Convert tiles per second to velocityPerMs (pixels per millisecond)
  convertTilesToMs(tilesPerSecond) {
    if (!this.gameCoordinator || !this.gameCoordinator.scaledTileSize) {
      // Fallback calculation if scaledTileSize not available
      const estimatedTileSize = 20; // Typical tile size
      return (tilesPerSecond * estimatedTileSize) / 1000;
    }
    const scaledTileSize = this.gameCoordinator.scaledTileSize;
    return (tilesPerSecond * scaledTileSize) / 1000;
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
    const { pacmanSpeed, ghostSpeed, config } = detail;

    console.log('[SpeedController] ⚡ APPLYING SPEED CONFIG ⚡');
    console.log('[SpeedController] Config:', config);
    console.log('[SpeedController] Pac-Man speed:', pacmanSpeed, 'tiles/sec');
    console.log('[SpeedController] Ghost speed:', ghostSpeed, 'tiles/sec');

    // Store the direct speeds
    this.currentSpeeds = {
      pacman: pacmanSpeed,
      ghost: ghostSpeed
    };

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
        setTimeout(() => this.applySpeedConfiguration({ pacmanSpeed, ghostSpeed, config }), 1000);
        return;
      }
    }

    this.applyPacmanSpeed(pacmanSpeed);
    this.applyGhostSpeeds(ghostSpeed);

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
    if (!this.gameCoordinator || !this.gameCoordinator.pacman || !this.currentSpeeds) {
      return;
    }

    // Check if Pac-Man speed has been reset
    const expectedPacmanSpeed = this.convertTilesToMs(this.currentSpeeds.pacman);
    const actualPacmanSpeed = this.gameCoordinator.pacman.velocityPerMs;

    if (Math.abs(actualPacmanSpeed - expectedPacmanSpeed) > 0.001) {
      console.log(`[SpeedController] 🔄 Pac-Man speed drift detected! Expected: ${expectedPacmanSpeed}, Actual: ${actualPacmanSpeed}, Reapplying...`);
      this.applyPacmanSpeed(this.currentSpeeds.pacman);
    }

    // Check ghost speeds
    if (this.gameCoordinator.ghosts) {
      this.gameCoordinator.ghosts.forEach((ghost) => {
        const expectedSpeed = this.convertTilesToMs(this.currentSpeeds.ghost);
        const actualSpeed = ghost.velocityPerMs;

        if (Math.abs(actualSpeed - expectedSpeed) > 0.001) {
          console.log(`[SpeedController] 🔄 ${ghost.name} speed drift detected! Expected: ${expectedSpeed}, Actual: ${actualSpeed}, Reapplying...`);
          // Reapply all ghost speeds
          this.applyGhostSpeeds(this.currentSpeeds.ghost);
        }
      });
    }
  }

  applyPacmanSpeed(tilesPerSecond) {
    if (!this.gameCoordinator.pacman) {
      console.log('[SpeedController] ❌ Cannot apply Pac-Man speed - game not ready');
      return;
    }

    const newSpeed = this.convertTilesToMs(tilesPerSecond);
    this.gameCoordinator.pacman.velocityPerMs = newSpeed;

    console.log(`[SpeedController] 🟡 Pac-Man speed: ${tilesPerSecond} tiles/sec = ${newSpeed} velocityPerMs`);
  }

  applyGhostSpeeds(tilesPerSecond) {
    if (!this.gameCoordinator.ghosts) {
      return;
    }

    const newSpeedVelocityPerMs = this.convertTilesToMs(tilesPerSecond);

    this.gameCoordinator.ghosts.forEach((ghost) => {
      // Set all ghost speed variants to the same base speed for consistency
      ghost.slowSpeed = newSpeedVelocityPerMs;
      ghost.mediumSpeed = newSpeedVelocityPerMs * 1.17; // Slightly faster for medium
      ghost.fastSpeed = newSpeedVelocityPerMs * 1.33;   // Faster for fast mode
      ghost.scaredSpeed = newSpeedVelocityPerMs * 0.5;  // Half speed when scared
      ghost.transitionSpeed = newSpeedVelocityPerMs * 0.4; // Slow when transitioning
      ghost.eyeSpeed = newSpeedVelocityPerMs * 2;       // Fast when returning as eyes

      ghost.defaultSpeed = newSpeedVelocityPerMs;
      ghost.velocityPerMs = newSpeedVelocityPerMs;

      console.log(`[SpeedController] 👻 ${ghost.name} speed: ${tilesPerSecond} tiles/sec = ${newSpeedVelocityPerMs} velocityPerMs`);
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

    // Reset to normal speeds (Pac-Man: 11 tiles/sec, Ghosts: 8.25 tiles/sec)
    this.currentSpeeds.pacman = 11;
    this.currentSpeeds.ghost = 8.25;

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
      pacmanSpeed: this.currentSpeeds.pacman,
      ghostSpeed: this.currentSpeeds.ghost,
      isModified: this.currentSpeeds.pacman !== 11 || this.currentSpeeds.ghost !== 8.25,
    };
  }

  getDebugInfo() {
    return {
      originalSpeeds: this.originalSpeeds,
      currentSpeeds: this.currentSpeeds,
      isInitialized: this.isInitialized,
      currentConfig: this.getCurrentConfiguration(),
    };
  }

  // Debug function you can call from browser console
  debugCurrentSpeeds() {
    console.log('=== SPEED CONTROLLER DEBUG ===');
    console.log('Is Initialized:', this.isInitialized);
    console.log('Current Speeds:', this.currentSpeeds);

    if (this.gameCoordinator && this.gameCoordinator.pacman) {
      console.log('Pac-Man Current Speed:', this.gameCoordinator.pacman.velocityPerMs);
      console.log('Pac-Man Target Speed:', this.currentSpeeds.pacman, 'tiles/sec');
      console.log('Pac-Man Expected VelocityPerMs:', this.convertTilesToMs(this.currentSpeeds.pacman));
    } else {
      console.log('Pac-Man: Not available');
    }

    if (this.gameCoordinator && this.gameCoordinator.ghosts) {
      this.gameCoordinator.ghosts.forEach((ghost) => {
        console.log(`${ghost.name}:`);
        console.log(`  Current Speed: ${ghost.velocityPerMs}`);
        console.log(`  Target Speed: ${this.currentSpeeds.ghost} tiles/sec`);
        console.log(`  Expected VelocityPerMs: ${this.convertTilesToMs(this.currentSpeeds.ghost)}`);
      });
    } else {
      console.log('Ghosts: Not available');
    }
    console.log('===============================');
  }
}

// removeIf(production)
module.exports = SpeedController;
// endRemoveIf(production)
