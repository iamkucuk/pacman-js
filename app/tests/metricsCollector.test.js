const assert = require('assert');
const sinon = require('sinon');
const MetricsCollector = require('../scripts/experiment/metricsCollector');

describe('MetricsCollector', () => {
  let metricsCollector;
  let mockExperimentManager;
  let mockGameCoordinator;
  let mockPacman;
  let mockCharacterUtil;

  beforeEach(() => {
    mockExperimentManager = {
      isExperimentActive: true,
      logEvent: sinon.stub(),
    };

    mockCharacterUtil = {
      determineGridPosition: sinon.stub().returns({ x: 13, y: 14 }),
    };

    mockPacman = {
      position: { left: 100, top: 200 },
      direction: 'right',
      moving: true,
      characterUtil: mockCharacterUtil,
    };

    mockGameCoordinator = {
      pacman: mockPacman,
      scaledTileSize: 8,
    };

    global.window = {
      addEventListener: sinon.stub(),
    };
    global.console = {
      log: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
    };
    global.Date = {
      now: sinon.stub().returns(1000),
    };
    global.setInterval = sinon.stub();

    metricsCollector = new MetricsCollector(mockExperimentManager);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      assert.strictEqual(metricsCollector.experimentManager, mockExperimentManager);
      assert.strictEqual(metricsCollector.turnTracker, null);
      assert.strictEqual(metricsCollector.consecutiveSuccessfulTurns, 0);
      assert.strictEqual(metricsCollector.isInitialized, false);
      assert.strictEqual(metricsCollector.DEBUG, true);
    });
  });

  describe('initialize', () => {
    it('should set initialized flag and bind events', () => {
      metricsCollector.initialize(mockGameCoordinator);

      assert.strictEqual(metricsCollector.isInitialized, true);
      assert.strictEqual(metricsCollector.gameCoordinator, mockGameCoordinator);
      assert(global.window.addEventListener.called);
    });

    it('should not initialize twice', () => {
      metricsCollector.initialize(mockGameCoordinator);
      const firstCallCount = global.window.addEventListener.callCount;

      metricsCollector.initialize(mockGameCoordinator);

      assert.strictEqual(global.window.addEventListener.callCount, firstCallCount);
    });
  });

  describe('bindGameEvents', () => {
    beforeEach(() => {
      metricsCollector.initialize(mockGameCoordinator);
    });

    it('should bind to all required events', () => {
      const expectedEvents = [
        'experimentSessionStarted',
        'experimentSessionEnded',
        'awardPoints',
        'dotEaten',
        'powerUp',
        'eatGhost',
        'deathSequence',
      ];

      expectedEvents.forEach((eventName) => {
        const eventCall = global.window.addEventListener.getCalls()
          .find(call => call.args[0] === eventName);
        assert(eventCall, `Should bind to ${eventName} event`);
      });
    });
  });

  describe('updateTurnTracking', () => {
    beforeEach(() => {
      metricsCollector.initialize(mockGameCoordinator);
      metricsCollector.lastDirection = 'left';
      metricsCollector.lastPosition = { x: 12, y: 14 };
    });

    it('should do nothing if experiment not active', () => {
      mockExperimentManager.isExperimentActive = false;

      metricsCollector.updateTurnTracking();

      assert(!mockExperimentManager.logEvent.called);
    });

    it('should do nothing if pacman not moving', () => {
      mockPacman.moving = false;

      metricsCollector.updateTurnTracking();

      assert(!mockExperimentManager.logEvent.called);
    });

    it('should handle direction change', () => {
      metricsCollector.updateTurnTracking();

      assert.strictEqual(metricsCollector.turnTracker.targetDirection, 'right');
      assert.strictEqual(metricsCollector.turnTracker.startDirection, 'left');
    });

    it('should update last position and direction', () => {
      metricsCollector.updateTurnTracking();

      assert.deepStrictEqual(metricsCollector.lastPosition, { x: 13, y: 14 });
      assert.strictEqual(metricsCollector.lastDirection, 'right');
    });
  });

  describe('turn tracking', () => {
    beforeEach(() => {
      metricsCollector.initialize(mockGameCoordinator);
    });

    describe('startNewTurn', () => {
      it('should initialize turn tracker', () => {
        const position = { x: 13, y: 14 };
        const direction = 'up';

        metricsCollector.startNewTurn(position, direction);

        assert(metricsCollector.turnTracker);
        assert.deepStrictEqual(metricsCollector.turnTracker.startPosition, position);
        assert.strictEqual(metricsCollector.turnTracker.targetDirection, direction);
        assert.strictEqual(metricsCollector.turnTracker.successful, false);
      });
    });

    describe('completeTurn', () => {
      beforeEach(() => {
        metricsCollector.turnTracker = {
          startPosition: { x: 13, y: 14 },
          startDirection: 'left',
          targetDirection: 'right',
          startTime: 500,
        };
        metricsCollector.turnStartTime = 500;
      });

      it('should complete successful turn', () => {
        const position = { x: 14, y: 14 };
        const actualDirection = 'right';

        metricsCollector.completeTurn(position, actualDirection);

        assert(mockExperimentManager.logEvent.calledWith('turnComplete'));
        const loggedData = mockExperimentManager.logEvent.firstCall.args[1];
        assert.strictEqual(loggedData.success, true);
        assert.strictEqual(metricsCollector.consecutiveSuccessfulTurns, 1);
      });

      it('should complete failed turn', () => {
        const position = { x: 14, y: 14 };
        const actualDirection = 'down';

        metricsCollector.completeTurn(position, actualDirection);

        assert(mockExperimentManager.logEvent.calledWith('turnComplete'));
        const loggedData = mockExperimentManager.logEvent.firstCall.args[1];
        assert.strictEqual(loggedData.success, false);
        assert.strictEqual(metricsCollector.consecutiveSuccessfulTurns, 0);
      });

      it('should reset turn tracker after completion', () => {
        metricsCollector.completeTurn({ x: 14, y: 14 }, 'right');

        assert.strictEqual(metricsCollector.turnTracker, null);
      });
    });

    describe('isTurnSuccessful', () => {
      beforeEach(() => {
        metricsCollector.turnTracker = {
          targetDirection: 'up',
        };
      });

      it('should return true for matching directions', () => {
        const result = metricsCollector.isTurnSuccessful('up');
        assert.strictEqual(result, true);
      });

      it('should return false for non-matching directions', () => {
        const result = metricsCollector.isTurnSuccessful('down');
        assert.strictEqual(result, false);
      });

      it('should return false when no turn tracker', () => {
        metricsCollector.turnTracker = null;
        const result = metricsCollector.isTurnSuccessful('up');
        assert.strictEqual(result, false);
      });
    });
  });

  describe('event handling', () => {
    beforeEach(() => {
      metricsCollector.initialize(mockGameCoordinator);
    });

    describe('handlePointsEvent', () => {
      it('should log fruit pellet eaten event', () => {
        const detail = { type: 'fruit', points: 100 };

        metricsCollector.handlePointsEvent(detail);

        assert(mockExperimentManager.logEvent.calledWith('pelletEaten'));
        const loggedData = mockExperimentManager.logEvent.firstCall.args[1];
        assert.strictEqual(loggedData.type, 'fruit');
        assert.strictEqual(loggedData.points, 100);
      });

      it('should not log non-fruit events', () => {
        const detail = { type: 'ghost', points: 200 };

        metricsCollector.handlePointsEvent(detail);

        assert(!mockExperimentManager.logEvent.called);
      });
    });
  });

  describe('position tracking', () => {
    beforeEach(() => {
      metricsCollector.initialize(mockGameCoordinator);
    });

    describe('getCurrentPacmanPosition', () => {
      it('should return current pacman position', () => {
        const position = metricsCollector.getCurrentPacmanPosition();

        assert.deepStrictEqual(position, { left: 100, top: 200 });
      });

      it('should return null if no game coordinator', () => {
        metricsCollector.gameCoordinator = null;
        const position = metricsCollector.getCurrentPacmanPosition();

        assert.strictEqual(position, null);
      });

      it('should return null if no pacman', () => {
        metricsCollector.gameCoordinator.pacman = null;
        const position = metricsCollector.getCurrentPacmanPosition();

        assert.strictEqual(position, null);
      });
    });

    describe('getCurrentPacmanGridPosition', () => {
      it('should return grid position from character util', () => {
        const gridPosition = metricsCollector.getCurrentPacmanGridPosition();

        assert.deepStrictEqual(gridPosition, { x: 13, y: 14 });
        assert(mockCharacterUtil.determineGridPosition.calledWith(
          mockPacman.position,
          mockGameCoordinator.scaledTileSize,
        ));
      });

      it('should return null if no character util', () => {
        mockPacman.characterUtil = null;
        const gridPosition = metricsCollector.getCurrentPacmanGridPosition();

        assert.strictEqual(gridPosition, null);
      });
    });
  });

  describe('state management', () => {
    beforeEach(() => {
      metricsCollector.initialize(mockGameCoordinator);
    });

    describe('resetTurnTracking', () => {
      beforeEach(() => {
        metricsCollector.turnTracker = { test: 'data' };
        metricsCollector.consecutiveSuccessfulTurns = 5;
        metricsCollector.lastPosition = { x: 1, y: 1 };
        metricsCollector.lastDirection = 'up';
      });

      it('should reset all turn tracking state', () => {
        metricsCollector.resetTurnTracking();

        assert.strictEqual(metricsCollector.turnTracker, null);
        assert.strictEqual(metricsCollector.consecutiveSuccessfulTurns, 0);
        assert.strictEqual(metricsCollector.lastPosition, null);
        assert.strictEqual(metricsCollector.lastDirection, null);
      });
    });

    describe('resetMetrics', () => {
      it('should call resetTurnTracking', () => {
        const resetSpy = sinon.spy(metricsCollector, 'resetTurnTracking');

        metricsCollector.resetMetrics();

        assert(resetSpy.calledOnce);
      });
    });
  });

  describe('metrics retrieval', () => {
    beforeEach(() => {
      metricsCollector.initialize(mockGameCoordinator);
      mockExperimentManager.currentMetrics = {
        sessionId: 1,
        summary: {
          totalGhostsEaten: 2,
          totalPelletsEaten: 50,
          totalDeaths: 1,
          successfulTurns: 10,
          totalTurns: 12,
        },
        events: [
          { type: 'ghostEaten' },
          { type: 'pelletEaten' },
          { type: 'death' },
        ],
      };
    });

    describe('getCurrentMetrics', () => {
      it('should return current metrics with additional data', () => {
        metricsCollector.consecutiveSuccessfulTurns = 3;
        metricsCollector.turnTracker = { test: 'data' };

        const metrics = metricsCollector.getCurrentMetrics();

        assert.strictEqual(metrics.session, 1);
        assert.strictEqual(metrics.events, 3);
        assert.strictEqual(metrics.consecutiveTurns, 3);
        assert.strictEqual(metrics.turnInProgress, true);
      });

      it('should return null if no current metrics', () => {
        mockExperimentManager.currentMetrics = null;

        const metrics = metricsCollector.getCurrentMetrics();

        assert.strictEqual(metrics, null);
      });
    });

    describe('getDetailedMetrics', () => {
      it('should return detailed breakdown of events', () => {
        const metrics = metricsCollector.getDetailedMetrics();

        assert.strictEqual(metrics.eventBreakdown.ghostsEaten, 1);
        assert.strictEqual(metrics.eventBreakdown.pelletsEaten, 1);
        assert.strictEqual(metrics.eventBreakdown.deaths, 1);
        assert.strictEqual(metrics.recentEvents.length, 3);
      });
    });
  });

  describe('logging', () => {
    beforeEach(() => {
      metricsCollector.initialize(mockGameCoordinator);
    });

    describe('logMetric', () => {
      it('should enrich data with position information', () => {
        metricsCollector.logMetric('test', { custom: 'data' });

        assert(mockExperimentManager.logEvent.called);
        const loggedData = mockExperimentManager.logEvent.firstCall.args[1];
        assert.strictEqual(loggedData.custom, 'data');
        assert.deepStrictEqual(loggedData.pacmanPosition, { left: 100, top: 200 });
        assert.deepStrictEqual(loggedData.pacmanGridPosition, { x: 13, y: 14 });
        assert(loggedData.timestamp);
      });

      it('should warn if no experiment manager', () => {
        metricsCollector.experimentManager = null;

        metricsCollector.logMetric('test');

        assert(global.console.warn.called);
      });
    });
  });

  describe('utility methods', () => {
    beforeEach(() => {
      metricsCollector.initialize(mockGameCoordinator);
    });

    describe('isExperimentActive', () => {
      it('should return true when experiment is active', () => {
        mockExperimentManager.isExperimentActive = true;

        const result = metricsCollector.isExperimentActive();

        assert.strictEqual(result, true);
      });

      it('should return false when experiment is inactive', () => {
        mockExperimentManager.isExperimentActive = false;

        const result = metricsCollector.isExperimentActive();

        assert.strictEqual(result, false);
      });

      it('should return false when no experiment manager', () => {
        metricsCollector.experimentManager = null;

        const result = metricsCollector.isExperimentActive();

        assert.strictEqual(result, false);
      });
    });

    describe('getDebugInfo', () => {
      it('should return comprehensive debug information', () => {
        metricsCollector.consecutiveSuccessfulTurns = 3;
        metricsCollector.turnTracker = { test: 'data' };
        metricsCollector.lastPosition = { x: 1, y: 1 };
        metricsCollector.lastDirection = 'up';

        const debugInfo = metricsCollector.getDebugInfo();

        assert.strictEqual(debugInfo.isInitialized, true);
        assert.strictEqual(debugInfo.isExperimentActive, true);
        assert.strictEqual(debugInfo.consecutiveSuccessfulTurns, 3);
        assert.strictEqual(debugInfo.turnInProgress, true);
        assert.deepStrictEqual(debugInfo.lastPosition, { x: 1, y: 1 });
        assert.strictEqual(debugInfo.lastDirection, 'up');
      });
    });
  });
});
