const assert = require('assert');
const sinon = require('sinon');
const ExperimentUI = require('../scripts/experiment/experimentUI');

describe('ExperimentUI', () => {
  let experimentUI;
  let mockExperimentManager;
  let mockDocument;
  let mockElement;

  beforeEach(() => {
    mockExperimentManager = {
      initializeUser: sinon.stub(),
      startSession: sinon.stub(),
      endSession: sinon.stub(),
      getCompletedSessionsCount: sinon.stub().returns(0),
      getCurrentSessionInfo: sinon.stub().returns({
        sessionId: 1,
        completedSessions: 0,
        totalSessions: 9,
        speedConfig: { pacman: 'normal', ghost: 'normal' }
      }),
      getDebugInfo: sinon.stub().returns({
        userId: 'test123',
        currentSession: 1,
        completedSessions: 0,
        remainingSessions: 9,
        isExperimentActive: true,
        sessionOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8]
      }),
      exportData: sinon.stub().returns('{"test": "data"}'),
      logEvent: sinon.stub(),
      userId: 'test123'
    };

    mockElement = {
      remove: sinon.stub(),
      addEventListener: sinon.stub(),
      click: sinon.stub(),
      style: {},
      textContent: '',
      innerHTML: '',
      value: '',
      href: '',
      download: ''
    };

    mockDocument = {
      getElementById: sinon.stub().returns(mockElement),
      body: {
        insertAdjacentHTML: sinon.stub(),
        appendChild: sinon.stub(),
        removeChild: sinon.stub()
      },
      createElement: sinon.stub().returns(mockElement)
    };

    global.document = mockDocument;
    global.window = {
      dispatchEvent: sinon.stub(),
      URL: {
        createObjectURL: sinon.stub().returns('blob:url'),
        revokeObjectURL: sinon.stub()
      },
      Blob: function(content, options) {
        this.content = content;
        this.type = options.type;
      },
      CustomEvent: function(type, options) {
        this.type = type;
        this.detail = options && options.detail;
      },
      confirm: sinon.stub().returns(true),
      location: {
        reload: sinon.stub()
      }
    };
    global.localStorage = {
      removeItem: sinon.stub()
    };

    experimentUI = new ExperimentUI(mockExperimentManager);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('constructor', () => {
    it('should initialize with experiment manager', () => {
      assert.strictEqual(experimentUI.experimentManager, mockExperimentManager);
      assert.strictEqual(experimentUI.isInitialized, false);
      assert.strictEqual(experimentUI.DEBUG, true);
    });
  });

  describe('initialize', () => {
    it('should set initialized flag', () => {
      experimentUI.initialize();
      assert.strictEqual(experimentUI.isInitialized, true);
    });

    it('should not initialize twice', () => {
      experimentUI.initialize();
      const firstCallCount = mockDocument.body.insertAdjacentHTML.callCount;
      
      experimentUI.initialize();
      
      assert.strictEqual(mockDocument.body.insertAdjacentHTML.callCount, firstCallCount);
    });
  });

  describe('createExperimentInterface', () => {
    it('should remove existing interface before creating new one', () => {
      experimentUI.createExperimentInterface();
      
      assert(mockElement.remove.called);
      assert(mockDocument.body.insertAdjacentHTML.called);
    });

    it('should create interface with debug panel when DEBUG is true', () => {
      experimentUI.DEBUG = true;
      experimentUI.createExperimentInterface();
      
      const htmlContent = mockDocument.body.insertAdjacentHTML.firstCall.args[1];
      assert(htmlContent.includes('debug-panel'));
    });

    it('should create interface without debug panel when DEBUG is false', () => {
      experimentUI.DEBUG = false;
      experimentUI.createExperimentInterface();
      
      const htmlContent = mockDocument.body.insertAdjacentHTML.firstCall.args[1];
      assert(!htmlContent.includes('debug-panel'));
    });
  });

  describe('handleStartExperiment', () => {
    beforeEach(() => {
      experimentUI.initialize();
      mockElement.value = 'test123';
    });

    it('should handle successful experiment start', () => {
      experimentUI.handleStartExperiment();
      
      assert(mockExperimentManager.initializeUser.calledWith('test123'));
      assert(mockExperimentManager.startSession.called);
      assert(global.window.dispatchEvent.called);
    });

    it('should handle empty user ID', () => {
      mockElement.value = '';
      experimentUI.handleStartExperiment();
      
      assert(!mockExperimentManager.initializeUser.called);
    });

    it('should handle completed sessions', () => {
      mockExperimentManager.getCompletedSessionsCount.returns(9);
      experimentUI.handleStartExperiment();
      
      assert(!mockExperimentManager.startSession.called);
    });

    it('should handle initialization errors', () => {
      mockExperimentManager.initializeUser.throws(new Error('Test error'));
      experimentUI.handleStartExperiment();
      
      assert(!mockExperimentManager.startSession.called);
    });
  });

  describe('handleEndSession', () => {
    it('should end session and show login interface for incomplete experiment', () => {
      mockExperimentManager.getCompletedSessionsCount.returns(5);
      experimentUI.handleEndSession();
      
      assert(mockExperimentManager.endSession.called);
      assert(global.window.dispatchEvent.called);
    });

    it('should show complete interface when all sessions done', () => {
      mockExperimentManager.getCompletedSessionsCount.returns(9);
      experimentUI.handleEndSession();
      
      assert(mockExperimentManager.endSession.called);
    });
  });

  describe('handleExportData', () => {
    beforeEach(() => {
      experimentUI.initialize();
    });

    it('should export both JSON and CSV formats', () => {
      mockExperimentManager.exportData.onFirstCall().returns('{"json": "data"}');
      mockExperimentManager.exportData.onSecondCall().returns('csv,data');
      
      experimentUI.handleExportData();
      
      assert(mockExperimentManager.exportData.calledWith('json'));
      assert(mockExperimentManager.exportData.calledWith('csv'));
      assert.strictEqual(mockDocument.createElement.callCount, 2);
    });
  });

  describe('handleResetExperiment', () => {
    beforeEach(() => {
      experimentUI.initialize();
    });

    it('should reset experiment when confirmed', () => {
      global.window.confirm.returns(true);
      experimentUI.handleResetExperiment();
      
      assert(global.localStorage.removeItem.called);
      assert(global.window.location.reload.called);
    });

    it('should not reset when cancelled', () => {
      global.window.confirm.returns(false);
      experimentUI.handleResetExperiment();
      
      assert(!global.localStorage.removeItem.called);
      assert(!global.window.location.reload.called);
    });
  });

  describe('interface switching', () => {
    beforeEach(() => {
      experimentUI.initialize();
    });

    it('should show login interface', () => {
      experimentUI.showLoginInterface();
      
      assert.strictEqual(mockElement.style.display, 'block');
    });

    it('should show session interface', () => {
      experimentUI.showSessionInterface();
      
      assert.strictEqual(mockElement.style.display, 'block');
    });

    it('should show complete interface', () => {
      experimentUI.showCompleteInterface();
      
      assert.strictEqual(mockElement.style.display, 'block');
    });
  });

  describe('updateSessionDisplay', () => {
    beforeEach(() => {
      experimentUI.initialize();
    });

    it('should update all session display elements', () => {
      experimentUI.updateSessionDisplay();
      
      assert(mockElement.innerHTML.length > 0);
    });

    it('should handle null session info gracefully', () => {
      mockExperimentManager.getCurrentSessionInfo.returns(null);
      
      assert.doesNotThrow(() => {
        experimentUI.updateSessionDisplay();
      });
    });
  });

  describe('logMetric', () => {
    it('should log metric to experiment manager', () => {
      experimentUI.logMetric('test', { data: 'value' });
      
      assert(mockExperimentManager.logEvent.calledWith('test', { data: 'value' }));
    });
  });

  describe('destroy', () => {
    it('should remove interface and reset state', () => {
      experimentUI.initialize();
      experimentUI.destroy();
      
      assert(mockElement.remove.called);
      assert.strictEqual(experimentUI.isInitialized, false);
    });
  });

  describe('downloadFile', () => {
    beforeEach(() => {
      experimentUI.initialize();
    });

    it('should create and trigger download', () => {
      experimentUI.downloadFile('test.txt', 'content');
      
      assert(global.window.URL.createObjectURL.called);
      assert(mockDocument.createElement.called);
      assert(mockDocument.body.appendChild.called);
      assert(mockDocument.body.removeChild.called);
      assert(global.window.URL.revokeObjectURL.called);
    });
  });

  describe('debug functionality', () => {
    beforeEach(() => {
      experimentUI.DEBUG = true;
      experimentUI.initialize();
    });

    it('should update debug display', () => {
      experimentUI.updateDebugDisplay();
      
      assert(mockElement.innerHTML.includes('test123'));
    });

    it('should toggle debug details', () => {
      experimentUI.toggleDebugDetails();
      
      assert(mockElement.innerHTML.length > 0);
    });
  });
});