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
    const containerStyle = 'background: rgba(0,0,0,0.8); color: white; '
      + 'padding: 12px;';
    const sizeStyle = 'border-radius: 8px; font-family: monospace; '
      + 'max-width: 350px; min-width: 280px;';
    const fontStyle = 'font-size: 12px; line-height: 1.4;';
    const showStyle = this.DEBUG ? '' : 'display: none;';

    const interfaceHTML = `
      <div id="experiment-interface" style="${baseStyle} ${containerStyle} 
        ${sizeStyle} ${fontStyle} ${showStyle}">
        <div id="experiment-session" style="display: none;">
          <div style="display: flex; justify-content: space-between; 
            align-items: center; margin-bottom: 5px;">
            <h4 style="margin: 0; color: #ffff00; font-size: 12px;">
              Live Metrics
            </h4>
            <button id="minimize-metrics-btn" style="background: none; 
              border: none; color: #ffff00; cursor: pointer; font-size: 14px; 
              padding: 0; line-height: 1;" title="Minimize">
              ▼
            </button>
          </div>
          <div id="metrics-content" style="display: block;">
          <div id="session-info" style="margin-bottom: 8px; font-size: 11px; 
            background: rgba(0,0,0,0.4); padding: 8px; border-radius: 4px;">
          </div>
          <div id="speed-config" style="margin-bottom: 8px; font-size: 11px; 
            background: rgba(0,0,0,0.4); padding: 8px; border-radius: 4px;">
          </div>
          <div id="metrics-display" style="margin-bottom: 8px; font-size: 11px; 
            background: rgba(0,0,0,0.4); padding: 8px; border-radius: 4px;">
          </div>
          <div id="progress-info" style="margin-bottom: 8px; font-size: 11px; 
            background: rgba(0,0,0,0.4); padding: 8px; border-radius: 4px;">
          </div>
          <button id="end-session-btn" style="width: 100%; padding: 8px; 
            background: #ff4444; border: none; border-radius: 4px; 
            cursor: pointer; font-size: 11px; font-weight: bold; color: white;">
            End Session
          </button>
          </div>
        </div>
        
        <div id="experiment-complete" style="display: none;">
          <h4 style="margin: 0 0 5px 0; color: #00ff00; font-size: 12px;">
            Experiment Complete!
          </h4>
          <p style="margin: 0 0 8px 0; font-size: 10px;">
            All ${this.experimentManager.SESSION_CONFIGS.length} sessions completed.
          </p>
          <button id="export-final-data-btn" style="width: 100%; padding: 4px; 
            background: #00ff00; border: none; border-radius: 2px; 
            cursor: pointer; font-size: 10px;">
            Export Data
          </button>
          <button id="reset-experiment-btn" style="width: 100%; padding: 4px; 
            background: #ff4444; border: none; border-radius: 2px; 
            cursor: pointer; margin-top: 3px; font-size: 10px;">
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
      <div id="debug-panel" style="margin-top: 15px; border-top: 1px solid #333;
        padding-top: 10px;">
        <h4 style="margin: 0 0 5px 0; color: #ffaa00;">Debug Info</h4>
        <div id="debug-info" style="font-size: 10px; color: #ccc;"></div>
        <button id="toggle-debug" style="padding: 3px 6px; background: #333; 
          border: none; border-radius: 2px; cursor: pointer; font-size: 10px; 
          margin-top: 5px;">Toggle Details</button>
      </div>
    `;
  }

  bindEvents() {
    if (this.isTestEnvironment) return;

    const endBtn = document.getElementById('end-session-btn');
    const minimizeBtn = document.getElementById('minimize-metrics-btn');

    if (endBtn) {
      endBtn.addEventListener('click', () => this.handleEndSession());
    }

    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', () => {
        this.toggleMetricsMinimized();
      });
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
      // eslint-disable-next-line no-console
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


  async handleEndSession() {
    try {
      // eslint-disable-next-line no-console
      console.log('[ExperimentUI] End session button clicked - saving session and reloading');

      // Store the current user ID so we can auto-continue after reload
      const currentUserId = window.gameCoordinator && window.gameCoordinator.experimentManager ? window.gameCoordinator.experimentManager.userId : null;
      if (currentUserId) {
        localStorage.setItem('autoResumeUserId', currentUserId);
        // eslint-disable-next-line no-console
        console.log('[ExperimentUI] Stored user ID for auto-resume:', currentUserId);
      }

      // End the current session properly and wait for it to complete
      if (window.gameCoordinator && window.gameCoordinator.experimentManager) {
        // eslint-disable-next-line no-console
        console.log('[ExperimentUI] Ending experiment session and waiting for save...');

        // Dispatch game ended event first
        window.dispatchEvent(new CustomEvent('gameEnded', {
          detail: {
            sessionId: (window.gameCoordinator.experimentManager.currentSession && window.gameCoordinator.experimentManager.currentSession.sessionId) ? window.gameCoordinator.experimentManager.currentSession.sessionId : null,
            finalScore: window.gameCoordinator.points || 0,
            gameTime: Date.now() - (window.gameCoordinator.gameStartTime || Date.now()),
            reason: 'user_terminated',
            timestamp: Date.now(),
          },
        }));

        // Actually end the session with final score and wait for all async operations
        const finalScore = window.gameCoordinator.points || 0;
        window.gameCoordinator.experimentManager.blockSessionEnd = true; // Allow session end
        await window.gameCoordinator.experimentManager.endSession(finalScore);
        // eslint-disable-next-line no-console
        console.log('[ExperimentUI] ✅ Session saved successfully');

        // Dispatch session ended event
        window.dispatchEvent(new CustomEvent('experimentSessionEnded', {
          detail: {
            sessionId: (window.gameCoordinator.experimentManager.currentSession && window.gameCoordinator.experimentManager.currentSession.sessionId) ? window.gameCoordinator.experimentManager.currentSession.sessionId : 'unknown',
            completedSessions: window.gameCoordinator.experimentManager.getCompletedSessionsCount(),
            reason: 'user_terminated',
          },
        }));
      }

      // Now reload after session is properly saved
      // eslint-disable-next-line no-console
      console.log('[ExperimentUI] Reloading page for clean state');
      window.location.reload();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error ending session:', error);

      // Fallback: just reload (data may not be saved but better than broken state)
      window.location.reload();
    }
  }

  handleExportData() {
    try {
      // Use the new CSV export functionality from experimentManager
      const success = this.experimentManager.exportUserCSV();

      if (success) {
        // eslint-disable-next-line no-console
        console.log('[ExperimentUI] CSV export completed');
      } else {
        // eslint-disable-next-line no-console
        console.warn('[ExperimentUI] CSV export failed, trying fallback');
        // Fallback to old method
        const jsonData = this.experimentManager.exportData('json');
        const csvData = this.experimentManager.exportData('csv');
        this.downloadFile(
          `experiment_${this.experimentManager.userId}_data.json`,
          jsonData,
        );
        this.downloadFile(
          `experiment_${this.experimentManager.userId}_data.csv`,
          csvData,
        );
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error exporting data:', error);
    }
  }

  async handleResetExperiment() {
    try {
      // Show comprehensive confirmation dialog
      const confirmed = confirm(
        '⚠️ Are you sure you want to reset the experiment?\n\n'
        + 'This will:\n'
        + '• Delete ALL session data\n'
        + '• Clear the user ID\n'
        + '• Remove data from both local storage and cloud database\n'
        + '• Reload the page for a fresh start\n\n'
        + 'This action cannot be undone!',
      );

      if (!confirmed) {
        console.log('[ExperimentUI] Reset cancelled by user');
        return;
      }

      console.log('[ExperimentUI] 🔄 Resetting experiment and reloading page...');

      // Delete all experiment data
      if (this.experimentManager) {
        await this.experimentManager.resetExperiment();
        console.log('[ExperimentUI] ✅ Experiment data deleted');
      }

      // Simple and reliable: reload the page for a completely fresh start
      window.location.reload();
    } catch (error) {
      console.error('[ExperimentUI] ❌ Error during experiment reset:', error);

      // Even if data deletion fails, reload the page for a fresh start
      window.location.reload();
    }
  }

  async handleDeleteLastSession() {
    try {
      // Show confirmation dialog
      const confirmed = confirm(
        '⚠️ Delete the last completed session?\n\n'
        + 'This will:\n'
        + '• Remove the most recent session from Supabase database\n'
        + '• Remove session data from local storage\n'
        + '• Reload the page for a fresh start\n'
        + '• Allow you to replay that session configuration\n\n'
        + 'This action cannot be undone!',
      );

      if (!confirmed) {
        console.log('[ExperimentUI] Delete last session cancelled by user');
        return;
      }

      console.log('[ExperimentUI] 🗑️ Deleting last session and reloading page...');

      // Delete the last session data
      if (this.experimentManager) {
        await this.experimentManager.deleteLastSession();
        console.log('[ExperimentUI] ✅ Last session deleted');
      }

      // Simple and reliable: reload the page for a completely fresh start
      window.location.reload();
    } catch (error) {
      console.error('[ExperimentUI] ❌ Error during last session deletion:', error);

      // Even if data deletion fails, reload the page for a fresh start
      window.location.reload();
    }
  }

  toggleMetricsMinimized() {
    if (this.isTestEnvironment) return;

    const metricsContent = document.getElementById('metrics-content');
    const minimizeBtn = document.getElementById('minimize-metrics-btn');

    if (!metricsContent || !minimizeBtn) return;

    const isMinimized = metricsContent.style.display === 'none';

    if (isMinimized) {
      // Expand
      metricsContent.style.display = 'block';
      minimizeBtn.innerHTML = '▼';
      minimizeBtn.title = 'Minimize';
    } else {
      // Minimize
      metricsContent.style.display = 'none';
      minimizeBtn.innerHTML = '▲';
      minimizeBtn.title = 'Maximize';
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

    // Ensure the main experiment interface is visible
    const experimentInterface = document.getElementById('experiment-interface');
    if (experimentInterface) {
      experimentInterface.style.display = 'block';
    }

    this.hideAllInterfaces();
    const sessionDiv = document.getElementById('experiment-session');
    if (sessionDiv) {
      sessionDiv.style.display = 'block';
    }

    // Reset metrics for new session
    this.resetMetricsDisplay();

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
      // eslint-disable-next-line no-console
      console.warn('[ExperimentUI] No session info available');
      return;
    }

    const sessionInfoDiv = document.getElementById('session-info');
    const speedConfigDiv = document.getElementById('speed-config');
    const progressInfoDiv = document.getElementById('progress-info');

    if (sessionInfoDiv) {
      // Debug logging for session display
      console.log('[ExperimentUI] Session display debug:');
      console.log('- sessionInfo:', sessionInfo);
      console.log('- sessionInfo.sessionId:', sessionInfo.sessionId);
      console.log('- completedSessions from info:', sessionInfo.completedSessions);
      console.log('- Direct completedSessions call:', this.experimentManager.getCompletedSessionsCount());

      sessionInfoDiv.innerHTML = `
        <strong>User:</strong> ${this.experimentManager.userId}<br>
        <strong>Session:</strong> ${sessionInfo.sessionId}/${this.experimentManager.SESSION_CONFIGS.length}
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
        <strong>Progress:</strong> ${sessionInfo.completedSessions}/`
        + `${sessionInfo.totalSessions} completed
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
    // eslint-disable-next-line no-console
    console.log('[ExperimentUI] stopMetricsDisplay called, interval ID:',
      this.metricsUpdateInterval);
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
      this.metricsUpdateInterval = null;
      // eslint-disable-next-line no-console
      console.log('[ExperimentUI] Metrics interval cleared');
    } else {
      // eslint-disable-next-line no-console
      console.log('[ExperimentUI] No metrics interval to clear');
    }
  }

  resetMetricsDisplay() {
    if (this.isTestEnvironment) return;

    // eslint-disable-next-line no-console
    console.log('[ExperimentUI] Resetting metrics display for new session');

    const metricsDiv = document.getElementById('metrics-display');
    if (metricsDiv) {
      // Reset to initial state showing zeros
      metricsDiv.innerHTML = `
        <strong>📊 New Session Starting...</strong><br>
        <strong>🍴 Eaten Items:</strong><br>
        &nbsp;&nbsp;🔸 Pacdots: 0<br>
        &nbsp;&nbsp;⚡ Power Pellets: 0<br>
        &nbsp;&nbsp;🍎 Fruits: 0<br>
        &nbsp;&nbsp;👻 Ghosts: 0<br>
        <strong>📈 Game Stats:</strong><br>
        &nbsp;&nbsp;💀 Deaths: 0<br>
        &nbsp;&nbsp;🔄 Turns: 0/0<br>
        &nbsp;&nbsp;⏱️ Time: 0s<br>
        &nbsp;&nbsp;📋 Events: 0
      `;
    }
  }

  updateMetricsDisplay() {
    if (this.isTestEnvironment) return;

    // eslint-disable-next-line no-console
    console.log('[ExperimentUI] updateMetricsDisplay called');

    const metricsDiv = document.getElementById('metrics-display');
    if (!metricsDiv) {
      // eslint-disable-next-line no-console
      console.log('[ExperimentUI] No metrics div found');
      return;
    }

    const metrics = this.getGameCoordinatorMetrics();
    if (!metrics) {
      // eslint-disable-next-line no-console
      console.log('[ExperimentUI] No metrics available, '
        + 'showing waiting message');
      metricsDiv.innerHTML = '<em>Waiting for game data...</em>';
      return;
    }

    const gameTime = this.experimentManager.gameStartTime
      ? Math.floor(this.experimentManager.getGameplayTime() / 1000) : 0;

    // Get detailed breakdown of eaten items
    const detailedStats = this.getDetailedEatenStats();

    const sessionInfo = this.experimentManager.getCurrentSessionInfo();
    const sessionId = sessionInfo ? sessionInfo.sessionId : '?';

    // Get current game stats and session aggregated stats
    const currentGameStats = this.experimentManager.getCurrentGameStats() || {
      ghostsEaten: 0, pelletsEaten: 0, deaths: 0, successfulTurns: 0, totalTurns: 0
    };
    const currentGameId = this.experimentManager.currentSession?.currentGame?.gameId || 1;
    const totalGames = this.experimentManager.currentSession?.games?.length || 0;
    const aggregatedStats = this.experimentManager.currentSession?.summary?.aggregatedStats;

    // Debug logging for live metrics display
    console.log('[ExperimentUI] Live metrics debug:');
    console.log('- sessionInfo from getCurrentSessionInfo:', sessionInfo);
    console.log('- sessionId being displayed:', sessionId);
    console.log('- currentGameStats:', currentGameStats);
    console.log('- currentGameId:', currentGameId);
    console.log('- totalGames completed:', totalGames);

    let htmlContent = `
      <strong>📊 Session ${sessionId} - Game ${currentGameId}</strong><br>
      <strong>🎮 Current Game:</strong><br>
      &nbsp;&nbsp;🔸 Pacdots: ${detailedStats.pacdots}<br>
      &nbsp;&nbsp;⚡ Power Pellets: ${detailedStats.powerPellets}<br>
      &nbsp;&nbsp;🍎 Fruits: ${detailedStats.fruits}<br>
      &nbsp;&nbsp;👻 Ghosts: ${currentGameStats.ghostsEaten}<br>
      &nbsp;&nbsp;💀 Deaths: ${currentGameStats.deaths}<br>
      &nbsp;&nbsp;🔄 Turns: ${currentGameStats.successfulTurns}/${currentGameStats.totalTurns}<br>
      &nbsp;&nbsp;⏱️ Time: ${gameTime}s<br>
    `;

    // Add aggregated session stats if there are completed games
    if (totalGames > 0 && aggregatedStats) {
      htmlContent += `
        <br><strong>📈 Session Stats (${totalGames} games):</strong><br>
        &nbsp;&nbsp;👻 Ghosts: µ=${aggregatedStats.ghostsEaten.mean.toFixed(1)}, σ=${aggregatedStats.ghostsEaten.std.toFixed(1)}<br>
        &nbsp;&nbsp;🍴 Pellets: µ=${aggregatedStats.pelletsEaten.mean.toFixed(1)}, σ=${aggregatedStats.pelletsEaten.std.toFixed(1)}<br>
        &nbsp;&nbsp;💀 Deaths: µ=${aggregatedStats.deaths.mean.toFixed(1)}, σ=${aggregatedStats.deaths.std.toFixed(1)}<br>
        &nbsp;&nbsp;⭐ Scores: µ=${aggregatedStats.finalScore.mean.toFixed(0)}, σ=${aggregatedStats.finalScore.std.toFixed(0)}<br>
      `;
    }

    htmlContent += `&nbsp;&nbsp;📋 Events: ${metrics.events ? metrics.events.length : 0}`;
    metricsDiv.innerHTML = htmlContent;
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

      const { events } = this.experimentManager.currentMetrics;
      if (!events) {
        return {
          pacdots: 0,
          powerPellets: 0,
          fruits: 0,
          ghosts: 0,
        };
      }

      // Debug: Log session info to verify reset behavior
      if (this.DEBUG) {
        if (events.length === 0) {
          // eslint-disable-next-line no-console
          console.log('[ExperimentUI] New session detected - events reset');
        } else {
          // eslint-disable-next-line no-console
          console.log(`[ExperimentUI] Processing ${events.length} events for detailed stats`);
        }
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
          case 'pelletEaten':
            // Check the specific pellet type in data.type
            if (event.data && event.data.type === 'pacdot') {
              stats.pacdots += 1;
            } else if (event.data && event.data.type === 'powerPellet') {
              stats.powerPellets += 1;
            } else if (event.data && event.data.type === 'fruit') {
              stats.fruits += 1;
            }
            break;
          case 'ghostEaten':
            stats.ghosts += 1;
            break;
          default:
            // Other event types not tracked in detailed stats
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
      if (!this.isTestEnvironment && window.gameCoordinator
        && window.gameCoordinator.metricsCollector) {
        return window.gameCoordinator.metricsCollector.getCurrentMetrics();
      }

      if (this.metricsCollector) {
        return this.metricsCollector.getCurrentMetrics();
      }

      return null;
    } catch (error) {
      if (this.DEBUG) {
        // eslint-disable-next-line no-console
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
      Completed: ${debugInfo.completedSessions}/${this.experimentManager.SESSION_CONFIGS.length}<br>
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
        Completed: ${debugInfo.completedSessions}/${this.experimentManager.SESSION_CONFIGS.length}<br>
        Active: ${debugInfo.isExperimentActive ? 'Yes' : 'No'}<br>
        Session Order: [${debugInfo.sessionOrder.join(', ')}]<br>
        Remaining: ${debugInfo.remainingSessions}
      `;
    }
  }

  logMetric(type, data = {}) {
    this.experimentManager.logEvent(type, data);

    if (this.DEBUG) {
      // eslint-disable-next-line no-console
      console.log('[METRICS]', type, data);
    }
  }

  destroy() {
    if (!this.isTestEnvironment) {
      const experimentInterface = document
        .getElementById('experiment-interface');
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
