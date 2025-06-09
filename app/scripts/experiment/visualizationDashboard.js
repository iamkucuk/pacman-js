class VisualizationDashboard {
  constructor(experimentManager, sessionManager, exportManager) {
    this.experimentManager = experimentManager;
    this.sessionManager = sessionManager;
    this.exportManager = exportManager;
    this.charts = {};
    this.dashboardContainer = null;
    this.isVisible = false;
    this.updateInterval = null;
    this.chartColors = {
      primary: '#4CAF50',
      secondary: '#2196F3',
      accent: '#FF9800',
      error: '#F44336',
      success: '#8BC34A',
      warning: '#FFC107',
    };
    this.isInitialized = false;
    this.DEBUG = true;
  }

  initialize() {
    if (this.isInitialized) return;

    this.createDashboardStructure();
    this.bindEvents();
    this.isInitialized = true;

    if (this.DEBUG) {
      console.log('[VisualizationDashboard] Initialized');
    }
  }

  bindEvents() {
    window.addEventListener('experimentSessionStarted', () => {
      this.startRealTimeUpdates();
    });

    window.addEventListener('experimentSessionEnded', () => {
      this.updateDashboard();
    });

    window.addEventListener('experimentComplete', () => {
      this.generateCompleteDashboard();
    });

    // Keyboard shortcut to toggle dashboard
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        this.toggleDashboard();
      }
    });
  }

  createDashboardStructure() {
    // Remove existing dashboard
    const existing = document.getElementById('visualization-dashboard');
    if (existing) {
      existing.remove();
    }

    const dashboardHTML = `
      <div id="visualization-dashboard" style="
        position: fixed;
        top: 0;
        right: -500px;
        width: 480px;
        height: 100vh;
        background: rgba(0, 0, 0, 0.95);
        color: white;
        font-family: monospace;
        font-size: 12px;
        overflow-y: auto;
        z-index: 2000;
        transition: right 0.3s ease;
        border-left: 2px solid #4CAF50;
      ">
        <div style="padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #4CAF50;">Analytics Dashboard</h2>
            <button id="close-dashboard" style="background: #F44336; border: none; color: white; padding: 5px 10px; border-radius: 3px; cursor: pointer;">×</button>
          </div>
          
          <div id="dashboard-tabs" style="display: flex; margin-bottom: 20px; border-bottom: 1px solid #333;">
            <button class="dashboard-tab active" data-tab="overview" style="flex: 1; padding: 10px; background: none; border: none; color: white; cursor: pointer;">Overview</button>
            <button class="dashboard-tab" data-tab="performance" style="flex: 1; padding: 10px; background: none; border: none; color: white; cursor: pointer;">Performance</button>
            <button class="dashboard-tab" data-tab="analytics" style="flex: 1; padding: 10px; background: none; border: none; color: white; cursor: pointer;">Analytics</button>
          </div>

          <div id="tab-overview" class="dashboard-content">
            <div id="experiment-overview"></div>
            <div id="current-session-chart"></div>
            <div id="progress-visualization"></div>
          </div>

          <div id="tab-performance" class="dashboard-content" style="display: none;">
            <div id="performance-metrics"></div>
            <div id="speed-comparison-chart"></div>
            <div id="turn-accuracy-chart"></div>
          </div>

          <div id="tab-analytics" class="dashboard-content" style="display: none;">
            <div id="statistical-summary"></div>
            <div id="correlation-matrix"></div>
            <div id="trend-analysis"></div>
          </div>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #333;">
            <button id="export-dashboard" style="width: 100%; padding: 10px; background: #2196F3; border: none; color: white; border-radius: 3px; cursor: pointer; margin-bottom: 10px;">Export Dashboard</button>
            <button id="download-charts" style="width: 100%; padding: 10px; background: #FF9800; border: none; color: white; border-radius: 3px; cursor: pointer;">Download Charts</button>
          </div>

          <div style="margin-top: 10px; font-size: 10px; color: #666; text-align: center;">
            Press Ctrl+D to toggle dashboard
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', dashboardHTML);
    this.dashboardContainer = document.getElementById('visualization-dashboard');
    this.bindDashboardEvents();
  }

  bindDashboardEvents() {
    // Close button
    document.getElementById('close-dashboard').addEventListener('click', () => {
      this.hideDashboard();
    });

    // Tab switching
    document.querySelectorAll('.dashboard-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.tab);
      });
    });

    // Export buttons
    document.getElementById('export-dashboard').addEventListener('click', () => {
      this.exportDashboard();
    });

    document.getElementById('download-charts').addEventListener('click', () => {
      this.downloadCharts();
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.dashboard-tab').forEach((tab) => {
      tab.classList.remove('active');
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
        tab.style.borderBottom = '2px solid #4CAF50';
      } else {
        tab.style.borderBottom = 'none';
      }
    });

    // Show/hide content
    document.querySelectorAll('.dashboard-content').forEach((content) => {
      content.style.display = 'none';
    });

    const targetContent = document.getElementById(`tab-${tabName}`);
    if (targetContent) {
      targetContent.style.display = 'block';
      this.updateTabContent(tabName);
    }
  }

  updateTabContent(tabName) {
    switch (tabName) {
      case 'overview':
        this.updateOverviewTab();
        break;
      case 'performance':
        this.updatePerformanceTab();
        break;
      case 'analytics':
        this.updateAnalyticsTab();
        break;
    }
  }

  updateOverviewTab() {
    this.renderExperimentOverview();
    this.renderCurrentSessionChart();
    this.renderProgressVisualization();
  }

  updatePerformanceTab() {
    this.renderPerformanceMetrics();
    this.renderSpeedComparisonChart();
    this.renderTurnAccuracyChart();
  }

  updateAnalyticsTab() {
    this.renderStatisticalSummary();
    this.renderCorrelationMatrix();
    this.renderTrendAnalysis();
  }

  renderExperimentOverview() {
    const container = document.getElementById('experiment-overview');
    if (!container) return;

    const completedSessions = this.experimentManager.getCompletedSessionsCount();
    const analytics = this.sessionManager.getSessionAnalytics();
    const currentSession = this.experimentManager.getCurrentSessionInfo();

    container.innerHTML = `
      <div style="background: rgba(76, 175, 80, 0.1); padding: 15px; border-radius: 5px; margin-bottom: 15px;">
        <h3 style="margin: 0 0 10px 0; color: #4CAF50;">Experiment Status</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <div style="color: #ccc;">Progress</div>
            <div style="font-size: 18px; font-weight: bold;">${completedSessions}/${this.experimentManager.SESSION_CONFIGS.length} Sessions</div>
          </div>
          <div>
            <div style="color: #ccc;">Completion</div>
            <div style="font-size: 18px; font-weight: bold;">${Math.round((completedSessions / this.experimentManager.SESSION_CONFIGS.length) * 100)}%</div>
          </div>
          <div>
            <div style="color: #ccc;">User ID</div>
            <div style="font-size: 14px;">${this.experimentManager.userId || 'Not set'}</div>
          </div>
          <div>
            <div style="color: #ccc;">Current Session</div>
            <div style="font-size: 14px;">${currentSession ? currentSession.sessionId : 'None'}</div>
          </div>
        </div>
      </div>
    `;

    if (currentSession) {
      container.innerHTML += `
        <div style="background: rgba(33, 150, 243, 0.1); padding: 15px; border-radius: 5px;">
          <h4 style="margin: 0 0 10px 0; color: #2196F3;">Current Session</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <div style="color: #ccc;">Pac-Man Speed</div>
              <div style="font-weight: bold;">${currentSession.speedConfig.pacman}</div>
            </div>
            <div>
              <div style="color: #ccc;">Ghost Speed</div>
              <div style="font-weight: bold;">${currentSession.speedConfig.ghost}</div>
            </div>
          </div>
        </div>
      `;
    }
  }

  renderCurrentSessionChart() {
    const container = document.getElementById('current-session-chart');
    if (!container) return;

    const { currentMetrics } = this.experimentManager;
    if (!currentMetrics) {
      container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No active session</div>';
      return;
    }

    const { summary } = currentMetrics;
    const maxGhosts = 20; // Reasonable maximum for visualization
    const maxPellets = 200;

    container.innerHTML = `
      <div style="background: rgba(255, 152, 0, 0.1); padding: 15px; border-radius: 5px; margin-bottom: 15px;">
        <h4 style="margin: 0 0 15px 0; color: #FF9800;">Session Metrics</h4>
        
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Ghosts Eaten</span>
            <span>${summary.totalGhostsEaten}</span>
          </div>
          <div style="background: #333; height: 8px; border-radius: 4px;">
            <div style="background: #4CAF50; height: 100%; width: ${(summary.totalGhostsEaten / maxGhosts) * 100}%; border-radius: 4px;"></div>
          </div>
        </div>

        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Pellets Eaten</span>
            <span>${summary.totalPelletsEaten}</span>
          </div>
          <div style="background: #333; height: 8px; border-radius: 4px;">
            <div style="background: #2196F3; height: 100%; width: ${(summary.totalPelletsEaten / maxPellets) * 100}%; border-radius: 4px;"></div>
          </div>
        </div>

        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Turn Accuracy</span>
            <span>${summary.totalTurns > 0 ? Math.round((summary.successfulTurns / summary.totalTurns) * 100) : 0}%</span>
          </div>
          <div style="background: #333; height: 8px; border-radius: 4px;">
            <div style="background: #FF9800; height: 100%; width: ${summary.totalTurns > 0 ? (summary.successfulTurns / summary.totalTurns) * 100 : 0}%; border-radius: 4px;"></div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; text-align: center; margin-top: 15px;">
          <div>
            <div style="color: #F44336; font-size: 18px; font-weight: bold;">${summary.totalDeaths}</div>
            <div style="color: #ccc; font-size: 10px;">Deaths</div>
          </div>
          <div>
            <div style="color: #4CAF50; font-size: 18px; font-weight: bold;">${summary.successfulTurns}</div>
            <div style="color: #ccc; font-size: 10px;">Good Turns</div>
          </div>
          <div>
            <div style="color: #FF9800; font-size: 18px; font-weight: bold;">${currentMetrics.events.length}</div>
            <div style="color: #ccc; font-size: 10px;">Events</div>
          </div>
        </div>
      </div>
    `;
  }

  renderProgressVisualization() {
    const container = document.getElementById('progress-visualization');
    if (!container) return;

    const sessions = this.experimentManager.metrics;
    const { sessionOrder } = this.experimentManager;
    const completedSessions = this.experimentManager.getCompletedSessionsCount();

    let progressHTML = `
      <div style="background: rgba(156, 39, 176, 0.1); padding: 15px; border-radius: 5px;">
        <h4 style="margin: 0 0 15px 0; color: #9C27B0;">Session Progress</h4>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
    `;

    for (let i = 0; i < this.experimentManager.SESSION_CONFIGS.length; i++) {
      const isCompleted = i < completedSessions;
      const isCurrent = i === completedSessions && this.experimentManager.isExperimentActive;
      const permutationId = sessionOrder[i];
      const config = permutationId !== undefined ? this.experimentManager.PERMUTATIONS[permutationId] : null;

      let bgColor = '#333';
      let textColor = '#666';
      let borderColor = 'transparent';

      if (isCompleted) {
        bgColor = '#4CAF50';
        textColor = 'white';
      } else if (isCurrent) {
        bgColor = '#FF9800';
        textColor = 'white';
        borderColor = '#FFB74D';
      }

      progressHTML += `
        <div style="
          background: ${bgColor};
          color: ${textColor};
          padding: 8px;
          border-radius: 3px;
          text-align: center;
          font-size: 10px;
          border: 2px solid ${borderColor};
        ">
          <div style="font-weight: bold;">S${i + 1}</div>
          ${config ? `<div>${config.pacman.charAt(0).toUpperCase()}/${config.ghost.charAt(0).toUpperCase()}</div>` : '<div>-/-</div>'}
        </div>
      `;
    }

    progressHTML += `
        </div>
        <div style="margin-top: 10px; font-size: 10px; color: #666;">
          S = Session, P/G = Pac-Man/Ghost Speed (S/N/F = Slow/Normal/Fast)
        </div>
      </div>
    `;

    container.innerHTML = progressHTML;
  }

  renderPerformanceMetrics() {
    const container = document.getElementById('performance-metrics');
    if (!container) return;

    const sessions = this.experimentManager.metrics;
    if (sessions.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No completed sessions</div>';
      return;
    }

    const stats = this.calculateSessionStats(sessions);

    container.innerHTML = `
      <div style="background: rgba(33, 150, 243, 0.1); padding: 15px; border-radius: 5px; margin-bottom: 15px;">
        <h4 style="margin: 0 0 15px 0; color: #2196F3;">Performance Overview</h4>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div>
            <h5 style="margin: 0 0 10px 0; color: #4CAF50;">Ghosts Eaten</h5>
            <div>Avg: <span style="font-weight: bold;">${stats.ghosts.avg.toFixed(1)}</span></div>
            <div>Best: <span style="font-weight: bold;">${stats.ghosts.max}</span></div>
            <div>Total: <span style="font-weight: bold;">${stats.ghosts.total}</span></div>
          </div>
          
          <div>
            <h5 style="margin: 0 0 10px 0; color: #2196F3;">Pellets Eaten</h5>
            <div>Avg: <span style="font-weight: bold;">${stats.pellets.avg.toFixed(1)}</span></div>
            <div>Best: <span style="font-weight: bold;">${stats.pellets.max}</span></div>
            <div>Total: <span style="font-weight: bold;">${stats.pellets.total}</span></div>
          </div>
          
          <div>
            <h5 style="margin: 0 0 10px 0; color: #FF9800;">Turn Accuracy</h5>
            <div>Avg: <span style="font-weight: bold;">${(stats.accuracy.avg * 100).toFixed(1)}%</span></div>
            <div>Best: <span style="font-weight: bold;">${(stats.accuracy.max * 100).toFixed(1)}%</span></div>
            <div>Worst: <span style="font-weight: bold;">${(stats.accuracy.min * 100).toFixed(1)}%</span></div>
          </div>
          
          <div>
            <h5 style="margin: 0 0 10px 0; color: #F44336;">Deaths</h5>
            <div>Avg: <span style="font-weight: bold;">${stats.deaths.avg.toFixed(1)}</span></div>
            <div>Most: <span style="font-weight: bold;">${stats.deaths.max}</span></div>
            <div>Total: <span style="font-weight: bold;">${stats.deaths.total}</span></div>
          </div>
        </div>
      </div>
    `;
  }

  renderSpeedComparisonChart() {
    const container = document.getElementById('speed-comparison-chart');
    if (!container) return;

    const sessions = this.experimentManager.metrics;
    const speedAnalysis = this.analyzeSpeedEffects(sessions);

    if (!speedAnalysis || Object.keys(speedAnalysis.pacman).length === 0) {
      container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">Insufficient data for speed analysis</div>';
      return;
    }

    container.innerHTML = `
      <div style="background: rgba(76, 175, 80, 0.1); padding: 15px; border-radius: 5px; margin-bottom: 15px;">
        <h4 style="margin: 0 0 15px 0; color: #4CAF50;">Speed Configuration Effects</h4>
        
        <div style="margin-bottom: 20px;">
          <h5 style="margin: 0 0 10px 0;">Pac-Man Speed Impact</h5>
          ${this.renderSpeedBars('pacman', speedAnalysis.pacman)}
        </div>
        
        <div>
          <h5 style="margin: 0 0 10px 0;">Ghost Speed Impact</h5>
          ${this.renderSpeedBars('ghost', speedAnalysis.ghost)}
        </div>
      </div>
    `;
  }

  renderSpeedBars(entityType, data) {
    const speeds = ['slow', 'normal', 'fast'];
    const maxValue = Math.max(...speeds.map(speed => ((data[speed] && data[speed].avgGhostsEaten) ? data[speed].avgGhostsEaten : 0)));

    return speeds.map((speed) => {
      const speedData = data[speed];
      if (!speedData) return '';

      const value = speedData.avgGhostsEaten;
      const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

      return `
        <div style="margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span style="text-transform: capitalize;">${speed}</span>
            <span style="font-weight: bold;">${value.toFixed(1)}</span>
          </div>
          <div style="background: #333; height: 6px; border-radius: 3px;">
            <div style="background: ${this.getSpeedColor(speed)}; height: 100%; width: ${percentage}%; border-radius: 3px;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  getSpeedColor(speed) {
    switch (speed) {
      case 'slow': return '#4CAF50';
      case 'normal': return '#FF9800';
      case 'fast': return '#F44336';
      default: return '#666';
    }
  }

  renderTurnAccuracyChart() {
    const container = document.getElementById('turn-accuracy-chart');
    if (!container) return;

    const sessions = this.experimentManager.metrics;
    if (sessions.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No session data available</div>';
      return;
    }

    const accuracyData = sessions.map((session, index) => ({
      session: index + 1,
      accuracy: session.summary && session.summary.totalTurns > 0
        ? session.summary.successfulTurns / session.summary.totalTurns
        : 0,
      config: session.speedConfig,
    }));

    const maxAccuracy = Math.max(...accuracyData.map(d => d.accuracy));

    container.innerHTML = `
      <div style="background: rgba(255, 152, 0, 0.1); padding: 15px; border-radius: 5px;">
        <h4 style="margin: 0 0 15px 0; color: #FF9800;">Turn Accuracy by Session</h4>
        <div style="height: 120px; display: flex; align-items: end; justify-content: space-between; padding: 10px 0;">
          ${accuracyData.map(data => `
            <div style="flex: 1; margin: 0 2px; display: flex; flex-direction: column; align-items: center;">
              <div style="
                background: ${this.getAccuracyColor(data.accuracy)};
                width: 100%;
                height: ${(data.accuracy / (maxAccuracy || 1)) * 100}px;
                min-height: 2px;
                border-radius: 2px 2px 0 0;
              "></div>
              <div style="font-size: 9px; margin-top: 4px; text-align: center;">
                S${data.session}
              </div>
            </div>
          `).join('')}
        </div>
        <div style="font-size: 10px; color: #666; text-align: center;">
          Session accuracy: ${(accuracyData.reduce((sum, d) => sum + d.accuracy, 0) / accuracyData.length * 100).toFixed(1)}% average
        </div>
      </div>
    `;
  }

  getAccuracyColor(accuracy) {
    if (accuracy >= 0.8) return '#4CAF50';
    if (accuracy >= 0.6) return '#FF9800';
    return '#F44336';
  }

  renderStatisticalSummary() {
    const container = document.getElementById('statistical-summary');
    if (!container) return;

    const sessions = this.experimentManager.metrics;
    if (sessions.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No statistical data available</div>';
      return;
    }

    const stats = this.calculateAdvancedStats(sessions);

    container.innerHTML = `
      <div style="background: rgba(156, 39, 176, 0.1); padding: 15px; border-radius: 5px; margin-bottom: 15px;">
        <h4 style="margin: 0 0 15px 0; color: #9C27B0;">Statistical Summary</h4>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div>
            <h5 style="margin: 0 0 8px 0; color: #ccc;">Performance Metrics</h5>
            <div style="font-size: 11px;">
              <div>Ghosts: μ=${stats.ghosts.mean.toFixed(1)}, σ=${stats.ghosts.std.toFixed(1)}</div>
              <div>Pellets: μ=${stats.pellets.mean.toFixed(1)}, σ=${stats.pellets.std.toFixed(1)}</div>
              <div>Accuracy: μ=${(stats.accuracy.mean * 100).toFixed(1)}%, σ=${(stats.accuracy.std * 100).toFixed(1)}%</div>
            </div>
          </div>
          
          <div>
            <h5 style="margin: 0 0 8px 0; color: #ccc;">Data Quality</h5>
            <div style="font-size: 11px;">
              <div>Sessions: ${sessions.length}/${this.experimentManager.SESSION_CONFIGS.length}</div>
              <div>Completeness: ${(sessions.length / this.experimentManager.SESSION_CONFIGS.length * 100).toFixed(1)}%</div>
              <div>Data Points: ${sessions.reduce((sum, s) => sum + ((s.events && s.events.length) ? s.events.length : 0), 0)}</div>
            </div>
          </div>
        </div>

        <div style="margin-top: 15px;">
          <h5 style="margin: 0 0 8px 0; color: #ccc;">Speed Configuration Distribution</h5>
          <div style="font-size: 11px;">
            ${this.renderConfigDistribution(sessions)}
          </div>
        </div>
      </div>
    `;
  }

  renderConfigDistribution(sessions) {
    const configCounts = {};
    sessions.forEach((session) => {
      if (session.speedConfig) {
        const key = `${session.speedConfig.pacman}-${session.speedConfig.ghost}`;
        configCounts[key] = (configCounts[key] || 0) + 1;
      }
    });

    return Object.entries(configCounts)
      .map(([config, count]) => `<div>${config}: ${count} session(s)</div>`)
      .join('');
  }

  renderCorrelationMatrix() {
    const container = document.getElementById('correlation-matrix');
    if (!container) return;

    const sessions = this.experimentManager.metrics;
    if (sessions.length < 3) {
      container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">Need more sessions for correlation analysis</div>';
      return;
    }

    const correlations = this.calculateCorrelations(sessions);

    container.innerHTML = `
      <div style="background: rgba(33, 150, 243, 0.1); padding: 15px; border-radius: 5px;">
        <h4 style="margin: 0 0 15px 0; color: #2196F3;">Correlation Analysis</h4>
        <div style="font-size: 11px;">
          <div style="margin-bottom: 8px;">
            <strong>Strong correlations found:</strong>
          </div>
          ${this.renderCorrelationList(correlations)}
        </div>
        <div style="margin-top: 10px; font-size: 10px; color: #666;">
          Correlation strength: |r| > 0.7 (strong), 0.5-0.7 (moderate), < 0.5 (weak)
        </div>
      </div>
    `;
  }

  renderCorrelationList(correlations) {
    return correlations
      .filter(corr => Math.abs(corr.value) > 0.5)
      .map(corr => `
        <div style="margin-bottom: 5px;">
          ${corr.var1} ↔ ${corr.var2}: 
          <span style="color: ${corr.value > 0 ? '#4CAF50' : '#F44336'}; font-weight: bold;">
            ${corr.value.toFixed(3)}
          </span>
          (${Math.abs(corr.value) > 0.7 ? 'strong' : 'moderate'})
        </div>
      `)
      .join('') || '<div style="color: #666;">No strong correlations detected</div>';
  }

  renderTrendAnalysis() {
    const container = document.getElementById('trend-analysis');
    if (!container) return;

    const sessions = this.experimentManager.metrics;
    if (sessions.length < 3) {
      container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">Need more sessions for trend analysis</div>';
      return;
    }

    const trends = this.calculateTrends(sessions);

    container.innerHTML = `
      <div style="background: rgba(76, 175, 80, 0.1); padding: 15px; border-radius: 5px;">
        <h4 style="margin: 0 0 15px 0; color: #4CAF50;">Performance Trends</h4>
        <div style="font-size: 11px;">
          ${this.renderTrendList(trends)}
        </div>
        <div style="margin-top: 10px; font-size: 10px; color: #666;">
          Trends calculated using linear regression over session order
        </div>
      </div>
    `;
  }

  renderTrendList(trends) {
    return Object.entries(trends)
      .map(([metric, trend]) => `
        <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
          <span style="text-transform: capitalize;">${metric.replace(/([A-Z])/g, ' $1')}</span>
          <span style="color: ${trend.slope > 0 ? '#4CAF50' : '#F44336'};">
            ${trend.slope > 0 ? '↗' : '↘'} ${Math.abs(trend.slope).toFixed(3)}/session
          </span>
        </div>
      `)
      .join('');
  }

  // Statistical calculation methods
  calculateSessionStats(sessions) {
    const getValues = field => sessions
      .filter(s => s.summary && s.summary[field] !== undefined)
      .map(s => s.summary[field]);

    const accuracyValues = sessions
      .filter(s => s.summary && s.summary.totalTurns > 0)
      .map(s => s.summary.successfulTurns / s.summary.totalTurns);

    return {
      ghosts: this.getStatSummary(getValues('totalGhostsEaten')),
      pellets: this.getStatSummary(getValues('totalPelletsEaten')),
      deaths: this.getStatSummary(getValues('totalDeaths')),
      accuracy: this.getStatSummary(accuracyValues),
    };
  }

  getStatSummary(values) {
    if (values.length === 0) {
      return {
        avg: 0, max: 0, min: 0, total: 0,
      };
    }

    return {
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      max: Math.max(...values),
      min: Math.min(...values),
      total: values.reduce((sum, val) => sum + val, 0),
    };
  }

  calculateAdvancedStats(sessions) {
    const getValues = field => sessions
      .filter(s => s.summary && s.summary[field] !== undefined)
      .map(s => s.summary[field]);

    const accuracyValues = sessions
      .filter(s => s.summary && s.summary.totalTurns > 0)
      .map(s => s.summary.successfulTurns / s.summary.totalTurns);

    return {
      ghosts: this.calculateMeanStd(getValues('totalGhostsEaten')),
      pellets: this.calculateMeanStd(getValues('totalPelletsEaten')),
      accuracy: this.calculateMeanStd(accuracyValues),
    };
  }

  calculateMeanStd(values) {
    if (values.length === 0) return { mean: 0, std: 0 };

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

    return {
      mean,
      std: Math.sqrt(variance),
    };
  }

  analyzeSpeedEffects(sessions) {
    const speedGroups = {
      pacman: { slow: [], normal: [], fast: [] },
      ghost: { slow: [], normal: [], fast: [] },
    };

    sessions.forEach((session) => {
      if (session.speedConfig && session.summary) {
        speedGroups.pacman[session.speedConfig.pacman].push(session.summary);
        speedGroups.ghost[session.speedConfig.ghost].push(session.summary);
      }
    });

    const analysis = {};

    ['pacman', 'ghost'].forEach((entityType) => {
      analysis[entityType] = {};

      ['slow', 'normal', 'fast'].forEach((speed) => {
        const group = speedGroups[entityType][speed];
        if (group.length > 0) {
          analysis[entityType][speed] = {
            sessionCount: group.length,
            avgGhostsEaten: group.reduce((sum, s) => sum + (s.totalGhostsEaten || 0), 0) / group.length,
            avgPelletsEaten: group.reduce((sum, s) => sum + (s.totalPelletsEaten || 0), 0) / group.length,
            avgDeaths: group.reduce((sum, s) => sum + (s.totalDeaths || 0), 0) / group.length,
            avgTurnAccuracy: group.reduce((sum, s) => sum + (s.totalTurns > 0 ? s.successfulTurns / s.totalTurns : 0), 0) / group.length,
          };
        }
      });
    });

    return analysis;
  }

  calculateCorrelations(sessions) {
    const variables = ['totalGhostsEaten', 'totalPelletsEaten', 'totalDeaths'];
    const correlations = [];

    for (let i = 0; i < variables.length; i++) {
      for (let j = i + 1; j < variables.length; j++) {
        const var1 = variables[i];
        const var2 = variables[j];

        const values1 = sessions
          .filter(s => s.summary && s.summary[var1] !== undefined)
          .map(s => s.summary[var1]);
        const values2 = sessions
          .filter(s => s.summary && s.summary[var2] !== undefined)
          .map(s => s.summary[var2]);

        if (values1.length === values2.length && values1.length > 2) {
          const correlation = this.pearsonCorrelation(values1, values2);
          correlations.push({
            var1: var1.replace(/total/g, '').toLowerCase(),
            var2: var2.replace(/total/g, '').toLowerCase(),
            value: correlation,
          });
        }
      }
    }

    return correlations;
  }

  pearsonCorrelation(x, y) {
    const n = x.length;
    if (n === 0) return 0;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  calculateTrends(sessions) {
    const variables = ['totalGhostsEaten', 'totalPelletsEaten', 'totalDeaths'];
    const trends = {};

    variables.forEach((variable) => {
      const values = sessions
        .filter(s => s.summary && s.summary[variable] !== undefined)
        .map((s, index) => ({ x: index + 1, y: s.summary[variable] }));

      if (values.length > 2) {
        trends[variable] = this.linearRegression(values);
      }
    });

    return trends;
  }

  linearRegression(points) {
    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  toggleDashboard() {
    if (this.isVisible) {
      this.hideDashboard();
    } else {
      this.showDashboard();
    }
  }

  showDashboard() {
    if (this.dashboardContainer) {
      this.dashboardContainer.style.right = '0px';
      this.isVisible = true;
      this.updateDashboard();

      if (this.DEBUG) {
        console.log('[VisualizationDashboard] Dashboard shown');
      }
    }
  }

  hideDashboard() {
    if (this.dashboardContainer) {
      this.dashboardContainer.style.right = '-500px';
      this.isVisible = false;

      if (this.DEBUG) {
        console.log('[VisualizationDashboard] Dashboard hidden');
      }
    }
  }

  updateDashboard() {
    if (!this.isVisible) return;

    const activeTab = document.querySelector('.dashboard-tab.active');
    if (activeTab) {
      this.updateTabContent(activeTab.dataset.tab);
    }
  }

  startRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      if (this.isVisible && this.experimentManager.isExperimentActive) {
        this.updateDashboard();
      }
    }, 5000); // Update every 5 seconds during active session
  }

  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  generateCompleteDashboard() {
    // Show dashboard with complete experiment analysis
    this.showDashboard();
    this.updateDashboard();

    // Switch to analytics tab for completion
    this.switchTab('analytics');
  }

  exportDashboard() {
    const dashboardData = {
      timestamp: new Date().toISOString(),
      userId: this.experimentManager.userId,
      dashboardSnapshot: {
        overview: this.getDashboardSnapshot('overview'),
        performance: this.getDashboardSnapshot('performance'),
        analytics: this.getDashboardSnapshot('analytics'),
      },
    };

    const content = JSON.stringify(dashboardData, null, 2);
    const filename = `dashboard_${this.experimentManager.userId}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

    this.downloadFile(filename, content, 'application/json');
  }

  getDashboardSnapshot(tabName) {
    // Capture current dashboard state for each tab
    return {
      tabName,
      lastUpdated: new Date().toISOString(),
      data: this.gatherTabData(tabName),
    };
  }

  gatherTabData(tabName) {
    switch (tabName) {
      case 'overview':
        return {
          experimentStatus: {
            completedSessions: this.experimentManager.getCompletedSessionsCount(),
            currentSession: this.experimentManager.getCurrentSessionInfo(),
          },
          sessionProgress: this.experimentManager.sessionOrder,
        };
      case 'performance':
        return {
          sessionStats: this.calculateSessionStats(this.experimentManager.metrics),
          speedAnalysis: this.analyzeSpeedEffects(this.experimentManager.metrics),
        };
      case 'analytics':
        return {
          statisticalSummary: this.calculateAdvancedStats(this.experimentManager.metrics),
          correlations: this.calculateCorrelations(this.experimentManager.metrics),
          trends: this.calculateTrends(this.experimentManager.metrics),
        };
      default:
        return {};
    }
  }

  downloadCharts() {
    // Generate chart images (simplified as text-based for this implementation)
    const chartData = this.generateChartExport();
    const content = JSON.stringify(chartData, null, 2);
    const filename = `charts_${this.experimentManager.userId}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

    this.downloadFile(filename, content, 'application/json');
  }

  generateChartExport() {
    return {
      sessionProgress: this.experimentManager.sessionOrder,
      performanceMetrics: this.calculateSessionStats(this.experimentManager.metrics),
      speedComparison: this.analyzeSpeedEffects(this.experimentManager.metrics),
      turnAccuracy: this.experimentManager.metrics.map(s => ({
        session: s.sessionId,
        accuracy: (s.summary && s.summary.totalTurns && s.summary.totalTurns > 0) ? s.summary.successfulTurns / s.summary.totalTurns : 0,
      })),
    };
  }

  downloadFile(filename, content, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      isVisible: this.isVisible,
      chartsActive: Object.keys(this.charts).length,
      updateInterval: this.updateInterval !== null,
      dashboardContainer: this.dashboardContainer !== null,
    };
  }

  destroy() {
    this.stopRealTimeUpdates();

    if (this.dashboardContainer) {
      this.dashboardContainer.remove();
      this.dashboardContainer = null;
    }

    this.charts = {};
    this.isVisible = false;
    this.isInitialized = false;
  }
}

// removeIf(production)
module.exports = VisualizationDashboard;
// endRemoveIf(production)
