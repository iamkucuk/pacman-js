const assert = require('assert');
const sinon = require('sinon');
const SpeedController = require('../scripts/experiment/speedController');

describe('SpeedController', () => {
  let speedController;
  let mockGameCoordinator;
  let mockPacman;
  let mockGhosts;

  beforeEach(() => {
    speedController = new SpeedController();

    mockPacman = {
      velocityPerMs: 0.088,
    };

    mockGhosts = [
      {
        name: 'blinky',
        slowSpeed: 0.066,
        mediumSpeed: 0.077,
        fastSpeed: 0.088,
        scaredSpeed: 0.044,
        transitionSpeed: 0.035,
        eyeSpeed: 0.176,
        defaultSpeed: 0.066,
        velocityPerMs: 0.066,
      },
      {
        name: 'pinky',
        slowSpeed: 0.066,
        mediumSpeed: 0.077,
        fastSpeed: 0.088,
        scaredSpeed: 0.044,
        transitionSpeed: 0.035,
        eyeSpeed: 0.176,
        defaultSpeed: 0.066,
        velocityPerMs: 0.066,
      },
    ];

    mockGameCoordinator = {
      pacman: mockPacman,
      ghosts: mockGhosts,
    };

    global.window = {
      addEventListener: sinon.stub(),
    };
    global.console = {
      log: sinon.stub(),
      warn: sinon.stub(),
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      assert.deepStrictEqual(speedController.originalSpeeds, {
        pacman: null,
        ghosts: {},
      });
      assert.deepStrictEqual(speedController.currentMultipliers, {
        pacman: 1.0,
        ghost: 1.0,
      });
      assert.strictEqual(speedController.isInitialized, false);
    });
  });

  describe('initialize', () => {
    it('should set initialized flag and bind events', () => {
      speedController.initialize(mockGameCoordinator);

      assert.strictEqual(speedController.isInitialized, true);
      assert.strictEqual(speedController.gameCoordinator, mockGameCoordinator);
      assert(global.window.addEventListener.calledTwice);
    });

    it('should not initialize twice', () => {
      speedController.initialize(mockGameCoordinator);
      const firstCall = global.window.addEventListener.callCount;

      speedController.initialize(mockGameCoordinator);

      assert.strictEqual(global.window.addEventListener.callCount, firstCall);
    });
  });

  describe('storeOriginalSpeeds', () => {
    beforeEach(() => {
      speedController.gameCoordinator = mockGameCoordinator;
    });

    it('should store pacman original speed', () => {
      speedController.storeOriginalSpeeds();

      assert.strictEqual(speedController.originalSpeeds.pacman, 0.088);
    });

    it('should store ghost original speeds', () => {
      speedController.storeOriginalSpeeds();

      const blinkyOriginal = speedController.originalSpeeds.ghosts.blinky;
      assert.strictEqual(blinkyOriginal.slowSpeed, 0.066);
      assert.strictEqual(blinkyOriginal.mediumSpeed, 0.077);
      assert.strictEqual(blinkyOriginal.fastSpeed, 0.088);
      assert.strictEqual(blinkyOriginal.defaultSpeed, 0.066);
    });

    it('should warn if game entities not ready', () => {
      speedController.gameCoordinator = null;
      speedController.storeOriginalSpeeds();

      assert(global.console.warn.calledOnce);
    });
  });

  describe('applySpeedConfiguration', () => {
    beforeEach(() => {
      speedController.initialize(mockGameCoordinator);
      speedController.storeOriginalSpeeds();
    });

    it('should apply pacman speed multiplier', () => {
      const detail = {
        pacmanMultiplier: 1.5,
        ghostMultiplier: 1.0,
        config: { pacman: 'fast', ghost: 'normal' },
      };

      speedController.applySpeedConfiguration(detail);

      assert.strictEqual(mockPacman.velocityPerMs, 0.088 * 1.5);
    });

    it('should apply ghost speed multipliers', () => {
      const detail = {
        pacmanMultiplier: 1.0,
        ghostMultiplier: 0.5,
        config: { pacman: 'normal', ghost: 'slow' },
      };

      speedController.applySpeedConfiguration(detail);

      const blinky = mockGhosts[0];
      assert.strictEqual(blinky.slowSpeed, 0.066 * 0.5);
      assert.strictEqual(blinky.mediumSpeed, 0.077 * 0.5);
      assert.strictEqual(blinky.fastSpeed, 0.088 * 0.5);
      assert.strictEqual(blinky.defaultSpeed, 0.066 * 0.5);
    });

    it('should update current multipliers', () => {
      const detail = {
        pacmanMultiplier: 1.5,
        ghostMultiplier: 0.5,
        config: { pacman: 'fast', ghost: 'slow' },
      };

      speedController.applySpeedConfiguration(detail);

      assert.strictEqual(speedController.currentMultipliers.pacman, 1.5);
      assert.strictEqual(speedController.currentMultipliers.ghost, 0.5);
    });

    it('should handle missing game entities gracefully', () => {
      speedController.gameCoordinator = null;

      const detail = {
        pacmanMultiplier: 1.5,
        ghostMultiplier: 0.5,
        config: { pacman: 'fast', ghost: 'slow' },
      };

      speedController.applySpeedConfiguration(detail);

      assert(global.console.warn.calledOnce);
    });
  });

  describe('determineCurrentSpeedType', () => {
    it('should identify slow speed type', () => {
      const ghost = { defaultSpeed: 0.066 };
      const originalSpeeds = { slowSpeed: 0.066, mediumSpeed: 0.077, fastSpeed: 0.088 };

      const speedType = speedController.determineCurrentSpeedType(ghost, originalSpeeds);

      assert.strictEqual(speedType, 'slowSpeed');
    });

    it('should identify medium speed type', () => {
      const ghost = { defaultSpeed: 0.077 };
      const originalSpeeds = { slowSpeed: 0.066, mediumSpeed: 0.077, fastSpeed: 0.088 };

      const speedType = speedController.determineCurrentSpeedType(ghost, originalSpeeds);

      assert.strictEqual(speedType, 'mediumSpeed');
    });

    it('should identify fast speed type', () => {
      const ghost = { defaultSpeed: 0.088 };
      const originalSpeeds = { slowSpeed: 0.066, mediumSpeed: 0.077, fastSpeed: 0.088 };

      const speedType = speedController.determineCurrentSpeedType(ghost, originalSpeeds);

      assert.strictEqual(speedType, 'fastSpeed');
    });

    it('should default to slow speed for unmatched values', () => {
      const ghost = { defaultSpeed: 0.999 };
      const originalSpeeds = { slowSpeed: 0.066, mediumSpeed: 0.077, fastSpeed: 0.088 };

      const speedType = speedController.determineCurrentSpeedType(ghost, originalSpeeds);

      assert.strictEqual(speedType, 'slowSpeed');
    });
  });

  describe('resetToOriginalSpeeds', () => {
    beforeEach(() => {
      speedController.initialize(mockGameCoordinator);
      speedController.storeOriginalSpeeds();

      // Apply some changes first
      speedController.currentMultipliers.pacman = 1.5;
      speedController.currentMultipliers.ghost = 0.5;
      mockPacman.velocityPerMs = 0.132;
    });

    it('should reset pacman speed to original', () => {
      speedController.resetToOriginalSpeeds();

      assert.strictEqual(mockPacman.velocityPerMs, 0.088);
    });

    it('should reset ghost speeds to original', () => {
      speedController.resetToOriginalSpeeds();

      const blinky = mockGhosts[0];
      assert.strictEqual(blinky.slowSpeed, 0.066);
      assert.strictEqual(blinky.mediumSpeed, 0.077);
      assert.strictEqual(blinky.fastSpeed, 0.088);
      assert.strictEqual(blinky.defaultSpeed, 0.066);
    });

    it('should reset multipliers to 1.0', () => {
      speedController.resetToOriginalSpeeds();

      assert.strictEqual(speedController.currentMultipliers.pacman, 1.0);
      assert.strictEqual(speedController.currentMultipliers.ghost, 1.0);
    });
  });

  describe('getCurrentConfiguration', () => {
    it('should return current multipliers and modification status', () => {
      speedController.currentMultipliers.pacman = 1.5;
      speedController.currentMultipliers.ghost = 0.5;

      const config = speedController.getCurrentConfiguration();

      assert.strictEqual(config.pacmanMultiplier, 1.5);
      assert.strictEqual(config.ghostMultiplier, 0.5);
      assert.strictEqual(config.isModified, true);
    });

    it('should indicate no modification when multipliers are 1.0', () => {
      const config = speedController.getCurrentConfiguration();

      assert.strictEqual(config.pacmanMultiplier, 1.0);
      assert.strictEqual(config.ghostMultiplier, 1.0);
      assert.strictEqual(config.isModified, false);
    });
  });

  describe('getDebugInfo', () => {
    beforeEach(() => {
      speedController.initialize(mockGameCoordinator);
      speedController.storeOriginalSpeeds();
    });

    it('should return comprehensive debug information', () => {
      const debugInfo = speedController.getDebugInfo();

      assert.strictEqual(debugInfo.isInitialized, true);
      assert.strictEqual(debugInfo.originalSpeeds.pacman, 0.088);
      assert.deepStrictEqual(debugInfo.currentMultipliers, { pacman: 1.0, ghost: 1.0 });
      assert.strictEqual(debugInfo.currentConfig.isModified, false);
    });
  });

  describe('event handling', () => {
    it('should bind to speedConfigChanged event', () => {
      speedController.bindEvents();

      const calls = global.window.addEventListener.getCalls();
      const speedConfigCall = calls.find(call => call.args[0] === 'speedConfigChanged');

      assert(speedConfigCall, 'Should bind to speedConfigChanged event');
    });

    it('should bind to experimentSessionEnded event', () => {
      speedController.bindEvents();

      const calls = global.window.addEventListener.getCalls();
      const sessionEndCall = calls.find(call => call.args[0] === 'experimentSessionEnded');

      assert(sessionEndCall, 'Should bind to experimentSessionEnded event');
    });
  });
});
