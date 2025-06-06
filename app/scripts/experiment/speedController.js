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
      this.gameCoordinator.ghosts.forEach(ghost => {
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

// removeIf(production)
module.exports = SpeedController;
// endRemoveIf(production)
