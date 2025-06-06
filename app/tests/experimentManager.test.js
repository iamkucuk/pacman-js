const assert = require('assert');
const sinon = require('sinon');
const ExperimentManager = require('../scripts/experiment/experimentManager');

describe('ExperimentManager', () => {
  let experimentManager;
  let localStorageStub;

  beforeEach(() => {
    experimentManager = new ExperimentManager();

    localStorageStub = {
      getItem: sinon.stub(),
      setItem: sinon.stub(),
      removeItem: sinon.stub(),
    };

    global.localStorage = localStorageStub;
    global.window = {
      dispatchEvent: sinon.stub(),
    };
    global.CustomEvent = function (type, options) {
      this.type = type;
      this.detail = options && options.detail;
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('constructor', () => {
    it('should initialize with correct speed configurations', () => {
      assert.deepStrictEqual(experimentManager.SPEED_CONFIGS.pacman, {
        slow: 0.3,
        normal: 1.0,
        fast: 2.5,
      });
      assert.deepStrictEqual(experimentManager.SPEED_CONFIGS.ghost, {
        slow: 0.2,
        normal: 1.0,
        fast: 3.0,
      });
    });

    it('should generate 9 permutations', () => {
      assert.strictEqual(experimentManager.PERMUTATIONS.length, 9);
    });

    it('should initialize with default values', () => {
      assert.strictEqual(experimentManager.currentSession, null);
      assert.strictEqual(experimentManager.userId, null);
      assert.deepStrictEqual(experimentManager.sessionOrder, []);
      assert.deepStrictEqual(experimentManager.metrics, []);
      assert.strictEqual(experimentManager.isExperimentActive, false);
    });
  });

  describe('generatePermutations', () => {
    it('should create all 9 speed combinations', () => {
      const permutations = experimentManager.generatePermutations();
      const expectedCombinations = [
        { id: 0, pacman: 'slow', ghost: 'slow' },
        { id: 1, pacman: 'slow', ghost: 'normal' },
        { id: 2, pacman: 'slow', ghost: 'fast' },
        { id: 3, pacman: 'normal', ghost: 'slow' },
        { id: 4, pacman: 'normal', ghost: 'normal' },
        { id: 5, pacman: 'normal', ghost: 'fast' },
        { id: 6, pacman: 'fast', ghost: 'slow' },
        { id: 7, pacman: 'fast', ghost: 'normal' },
        { id: 8, pacman: 'fast', ghost: 'fast' },
      ];

      assert.deepStrictEqual(permutations, expectedCombinations);
    });
  });

  describe('initializeUser', () => {
    it('should throw error for empty user ID', () => {
      assert.throws(() => {
        experimentManager.initializeUser('');
      }, /User ID is required/);
    });

    it('should throw error for whitespace user ID', () => {
      assert.throws(() => {
        experimentManager.initializeUser('   ');
      }, /User ID is required/);
    });

    it('should set user ID and load data', () => {
      localStorageStub.getItem.returns(null);
      experimentManager.initializeUser('test123');

      assert.strictEqual(experimentManager.userId, 'test123');
      assert.strictEqual(experimentManager.sessionOrder.length, 9);
    });

    it('should load existing user data if available', () => {
      const userData = {
        sessionOrder: [1, 2, 3, 4, 5, 6, 7, 8, 0],
        metrics: [{ sessionId: 1 }],
      };
      localStorageStub.getItem.returns(JSON.stringify(userData));

      experimentManager.initializeUser('test123');

      assert.deepStrictEqual(experimentManager.sessionOrder, userData.sessionOrder);
      assert.deepStrictEqual(experimentManager.metrics, userData.metrics);
    });
  });

  describe('generateRandomizedOrder', () => {
    it('should return array with numbers 0-8', () => {
      const order = experimentManager.generateRandomizedOrder();
      const sorted = [...order].sort((a, b) => a - b);

      assert.strictEqual(order.length, 9);
      assert.deepStrictEqual(sorted, [0, 1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('should produce different orders on multiple calls', () => {
      const orders = [];
      for (let i = 0; i < 10; i++) {
        orders.push(experimentManager.generateRandomizedOrder().join(','));
      }

      const uniqueOrders = new Set(orders);
      assert(uniqueOrders.size > 1, 'Should generate different random orders');
    });
  });

  describe('startSession', () => {
    beforeEach(() => {
      experimentManager.initializeUser('test123');
    });

    it('should throw error if user ID not set', () => {
      experimentManager.userId = null;
      assert.throws(() => {
        experimentManager.startSession();
      }, /User ID must be set/);
    });

    it('should throw error if all sessions completed', () => {
      experimentManager.metrics = new Array(9).fill({ sessionId: 1 });
      assert.throws(() => {
        experimentManager.startSession();
      }, /All sessions completed/);
    });

    it('should start first session correctly', () => {
      sinon.stub(Date, 'now').returns(1000);
      const session = experimentManager.startSession();

      assert.strictEqual(session.sessionId, 1);
      assert.strictEqual(session.userId, 'test123');
      assert.strictEqual(experimentManager.isExperimentActive, true);
      assert.strictEqual(experimentManager.gameStartTime, 1000);
    });

    it('should dispatch speed configuration event', () => {
      experimentManager.startSession();

      assert(global.window.dispatchEvent.calledOnce);
      const event = global.window.dispatchEvent.firstCall.args[0];
      assert.strictEqual(event.type, 'speedConfigChanged');
    });
  });

  describe('logEvent', () => {
    beforeEach(() => {
      experimentManager.initializeUser('test123');
      experimentManager.startSession();
      sinon.stub(Date, 'now').returns(2000);
    });

    it('should not log events when experiment inactive', () => {
      experimentManager.isExperimentActive = false;
      experimentManager.logEvent('test');

      assert.strictEqual(experimentManager.currentMetrics.events.length, 0);
    });

    it('should log events with correct timing', () => {
      experimentManager.logEvent('ghostEaten', { ghostId: 'blinky' });

      const event = experimentManager.currentMetrics.events[0];
      assert.strictEqual(event.type, 'ghostEaten');
      assert.strictEqual(event.time, 1000); // 2000 - 1000 (gameStartTime)
      assert.strictEqual(event.ghostId, 'blinky');
    });

    it('should update summary for ghost eaten events', () => {
      experimentManager.logEvent('ghostEaten');

      assert.strictEqual(experimentManager.currentMetrics.summary.totalGhostsEaten, 1);
    });

    it('should update summary for pellet eaten events', () => {
      experimentManager.logEvent('pelletEaten');

      assert.strictEqual(experimentManager.currentMetrics.summary.totalPelletsEaten, 1);
    });

    it('should update summary for death events', () => {
      experimentManager.logEvent('death');

      assert.strictEqual(experimentManager.currentMetrics.summary.totalDeaths, 1);
    });

    it('should update summary for turn complete events', () => {
      experimentManager.logEvent('turnComplete', { success: true });
      experimentManager.logEvent('turnComplete', { success: false });

      assert.strictEqual(experimentManager.currentMetrics.summary.totalTurns, 2);
      assert.strictEqual(experimentManager.currentMetrics.summary.successfulTurns, 1);
    });
  });

  describe('endSession', () => {
    beforeEach(() => {
      experimentManager.initializeUser('test123');
      experimentManager.startSession();
      sinon.stub(Date, 'now').returns(5000);
    });

    it('should calculate game time correctly', () => {
      experimentManager.endSession();

      assert.strictEqual(experimentManager.metrics[0].summary.gameTime, 4000);
    });

    it('should reset experiment state', () => {
      experimentManager.endSession();

      assert.strictEqual(experimentManager.isExperimentActive, false);
      assert.strictEqual(experimentManager.currentMetrics, null);
      assert.strictEqual(experimentManager.gameStartTime, null);
      assert.strictEqual(experimentManager.currentSession, null);
    });

    it('should save metrics', () => {
      experimentManager.endSession();

      assert.strictEqual(experimentManager.metrics.length, 1);
      assert(localStorageStub.setItem.called);
    });
  });

  describe('getCompletedSessionsCount', () => {
    it('should return correct count', () => {
      experimentManager.metrics = [{ sessionId: 1 }, { sessionId: 2 }];
      assert.strictEqual(experimentManager.getCompletedSessionsCount(), 2);
    });
  });

  describe('getRemainingSessionsCount', () => {
    it('should return correct remaining count', () => {
      experimentManager.metrics = [{ sessionId: 1 }, { sessionId: 2 }];
      assert.strictEqual(experimentManager.getRemainingSessionsCount(), 7);
    });
  });

  describe('exportData', () => {
    beforeEach(() => {
      experimentManager.userId = 'test123';
      experimentManager.metrics = [{
        userId: 'test123',
        sessionId: 1,
        permutationId: 0,
        speedConfig: { pacman: 'slow', ghost: 'slow' },
        summary: {
          totalGhostsEaten: 2,
          totalPelletsEaten: 50,
          totalDeaths: 1,
          successfulTurns: 10,
          totalTurns: 12,
          gameTime: 30000,
        },
        timestamp: '2023-01-01T00:00:00.000Z',
      }];
    });

    it('should export JSON format by default', () => {
      const exported = experimentManager.exportData();
      const parsed = JSON.parse(exported);

      assert.strictEqual(parsed.userId, 'test123');
      assert.strictEqual(parsed.metrics.length, 1);
      assert.strictEqual(parsed.totalSessions, 1);
    });

    it('should export CSV format when specified', () => {
      const exported = experimentManager.exportData('csv');
      const lines = exported.split('\n');

      assert(lines[0].includes('userId,sessionId,permutationId'));
      assert(lines[1].includes('test123,1,0'));
    });
  });

  describe('getDebugInfo', () => {
    it('should return complete debug information', () => {
      experimentManager.userId = 'test123';
      experimentManager.sessionOrder = [1, 2, 3, 4, 5, 6, 7, 8, 0];

      const debugInfo = experimentManager.getDebugInfo();

      assert.strictEqual(debugInfo.userId, 'test123');
      assert.strictEqual(debugInfo.completedSessions, 0);
      assert.strictEqual(debugInfo.remainingSessions, 9);
      assert.deepStrictEqual(debugInfo.sessionOrder, [1, 2, 3, 4, 5, 6, 7, 8, 0]);
      assert.strictEqual(debugInfo.isExperimentActive, false);
    });
  });
});
