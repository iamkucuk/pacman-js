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
    const containerStyle = 'background: rgba(0,0,0,0.8); color: white; ' +
      'padding: 12px;';
    const sizeStyle = 'border-radius: 8px; font-family: monospace; ' +
      'max-width: 350px; min-width: 280px;';
    const fontStyle = 'font-size: 12px; line-height: 1.4;';
    const showStyle = this.DEBUG ? '' : 'display: none;';
    
    const interfaceHTML = `
      <div id="experiment-interface" style="${baseStyle} ${containerStyle} ${sizeStyle} ${fontStyle} ${showStyle}">
        <div id="experiment-session" style="display: none;">
          <h4 style="margin: 0 0 5px 0; color: #ffff00; font-size: 12px;">
            Live Metrics
          </h4>
          <div id="session-info" style="margin-bottom: 8px; font-size: 11px; background: rgba(0,0,0,0.4); padding: 8px; border-radius: 4px;">
          </div>
          <div id="speed-config" style="margin-bottom: 8px; font-size: 11px; background: rgba(0,0,0,0.4); padding: 8px; border-radius: 4px;">
          </div>
          <div id="metrics-display" style="margin-bottom: 8px; font-size: 11px; background: rgba(0,0,0,0.4); padding: 8px; border-radius: 4px;">
          </div>
          <div id="progress-info" style="margin-bottom: 8px; font-size: 11px; background: rgba(0,0,0,0.4); padding: 8px; border-radius: 4px;">
          </div>
          <button id="end-session-btn" style="width: 100%; padding: 8px; background: #ff4444; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold; color: white;">
            End Session
          </button>
          <button id="export-data-btn" style="width: 100%; padding: 6px; background: #4444ff; border: none; border-radius: 4px; cursor: pointer; margin-top: 4px; font-size: 10px; color: white;">
            Export Data
          </button>
        </div>
        
        <div id="experiment-complete" style="display: none;">
          <h4 style="margin: 0 0 5px 0; color: #00ff00; font-size: 12px;">
            Experiment Complete!
          </h4>
          <p style="margin: 0 0 8px 0; font-size: 10px;">
            All 9 sessions completed.
          </p>
          <button id="export-final-data-btn" style="width: 100%; padding: 4px; background: #00ff00; border: none; border-radius: 2px; cursor: pointer; font-size: 10px;">
            Export Data
          </button>
          <button id="reset-experiment-btn" style="width: 100%; padding: 4px; background: #ff4444; border: none; border-radius: 2px; cursor: pointer; margin-top: 3px; font-size: 10px;">
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
      <div id="debug-panel" style="margin-top: 15px; border-top: 1px solid #333; padding-top: 10px;">
        <h4 style="margin: 0 0 5px 0; color: #ffaa00;">Debug Info</h4>
        <div id="debug-info" style="font-size: 10px; color: #ccc;"></div>
        <button id="toggle-debug" style="padding: 3px 6px; background: #333; border: none; border-radius: 2px; cursor: pointer; font-size: 10px; margin-top: 5px;">Toggle Details</button>
      </div>
    `;
  }

  bindEvents() {
    if (this.isTestEnvironment) return;

    const endBtn = document.getElementById('end-session-btn');
    const exportBtn = document.getElementById('export-data-btn');
    const exportFinalBtn = document.getElementById('export-final-data-btn');
    const resetBtn = document.getElementById('reset-experiment-btn');

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


  handleEndSession() {
    try {
      // End the current session in experiment manager
      this.experimentManager.endSession();

      // Stop the game if it's running
      if (window.gameCoordinator && window.gameCoordinator.gameEngine) {
        window.gameCoordinator.gameEngine.stopGame();
      }

      // Check if experiment is complete
      const completedSessions = this.experimentManager.getCompletedSessionsCount();
      if (completedSessions >= 9) {
        this.showCompleteInterface();
        window.dispatchEvent(new window.CustomEvent('experimentComplete'));
      } else {
        // Return to main menu for next session
        this.hideAllInterfaces();
        if (window.gameCoordinator) {
          window.gameCoordinator.mainMenu.style.opacity = 1;
          window.gameCoordinator.mainMenu.style.visibility = 'visible';
        }
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
    const confirmMessage = 'Are you sure you want to reset the experiment? All data will be lost.';
    // eslint-disable-next-line no-alert
    if (window.confirm(confirmMessage)) {
      if (this.experimentManager.userId) {
        const expKey = `experiment_${this.experimentManager.userId}`;
        const sessionKey = `current_session_${this.experimentManager.userId}`;
        localStorage.removeItem(expKey);
        localStorage.removeItem(sessionKey);
      }
      window.location.reload();
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

    this.hideAllInterfaces();
    const sessionDiv = document.getElementById('experiment-session');
    if (sessionDiv) {
      sessionDiv.style.display = 'block';
    }
    
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
      console.warn('[ExperimentUI] No session info available');
      return;
    }

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

    const gameTime = this.experimentManager.gameStartTime ? 
      Math.floor((Date.now() - this.experimentManager.gameStartTime) / 1000) : 0;
    
    // Get detailed breakdown of eaten items
    const detailedStats = this.getDetailedEatenStats();
    
    metricsDiv.innerHTML = `
      <strong>📊 Live Metrics</strong><br>
      <strong>🍴 Eaten Items:</strong><br>
      &nbsp;&nbsp;🔸 Pacdots: ${detailedStats.pacdots}<br>
      &nbsp;&nbsp;⚡ Power Pellets: ${detailedStats.powerPellets}<br>
      &nbsp;&nbsp;🍎 Fruits: ${detailedStats.fruits}<br>
      &nbsp;&nbsp;👻 Ghosts: ${detailedStats.ghosts}<br>
      <strong>📈 Game Stats:</strong><br>
      &nbsp;&nbsp;💀 Deaths: ${metrics.summary.totalDeaths}<br>
      &nbsp;&nbsp;🔄 Turns: ${metrics.summary.successfulTurns}/${metrics.summary.totalTurns}<br>
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

      const events = this.experimentManager.currentMetrics.events;
      if (!events) {
        return {
          pacdots: 0,
          powerPellets: 0,
          fruits: 0,
          ghosts: 0,
        };
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
          case 'pacdot':
            stats.pacdots += 1;
            break;
          case 'powerPellet':
            stats.powerPellets += 1;
            break;
          case 'fruit':
            stats.fruits += 1;
            break;
          case 'ghostEaten':
            stats.ghosts += 1;
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
