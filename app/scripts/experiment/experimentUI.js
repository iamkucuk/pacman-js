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

  showUserIdPrompt() {
    // Show login section, hide others
    this.showSection('experiment-login');
    
    // Clear and focus input field
    const userIdInput = document.getElementById('user-id-input');
    if (userIdInput) {
      userIdInput.value = '';
      userIdInput.focus();
    }
    
    // Clear any error messages
    const errorDiv = document.getElementById('login-error');
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
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
    if (this.isTestEnvironment) return;
    
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

      window.dispatchEvent(new window.CustomEvent('experimentSessionStarted', {
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

      window.dispatchEvent(new window.CustomEvent('experimentSessionEnded'));
      
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
    if (window.confirm('Are you sure you want to reset the experiment? All data will be lost.')) {
      if (this.experimentManager.userId) {
        localStorage.removeItem(`experiment_${this.experimentManager.userId}`);
        localStorage.removeItem(`current_session_${this.experimentManager.userId}`);
      }
      window.location.reload();
    }
  }

  downloadFile(filename, content) {
    if (this.isTestEnvironment) {
      // In test environment, just log the action
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
    
    this.hideAllInterfaces();
    const loginDiv = document.getElementById('experiment-login');
    if (loginDiv) {
      loginDiv.style.display = 'block';
    }
  }

  showSessionInterface() {
    if (this.isTestEnvironment) return;
    
    this.hideAllInterfaces();
    const sessionDiv = document.getElementById('experiment-session');
    if (sessionDiv) {
      sessionDiv.style.display = 'block';
    }
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
    
    const interfaces = ['experiment-login', 'experiment-session', 'experiment-complete'];
    interfaces.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.style.display = 'none';
      }
    });
  }

  updateSessionDisplay() {
    if (this.isTestEnvironment) return;
    
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
    if (this.isTestEnvironment) return;
    
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
    if (this.isTestEnvironment) return;
    
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
      if (!this.isTestEnvironment && window.gameCoordinator && window.gameCoordinator.metricsCollector) {
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
      console.log('[METRICS]', type, data);
    }
  }

  destroy() {
    if (!this.isTestEnvironment) {
      const experimentInterface = document.getElementById('experiment-interface');
      if (experimentInterface) {
        experimentInterface.remove();
      }
    }
    this.isInitialized = false;
  }
}

// removeIf(production)
module.exports = ExperimentUI;
// endRemoveIf(production)