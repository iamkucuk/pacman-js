class ExperimentManager {
  constructor() {
    this.SPEED_CONFIGS = {
      pacman: {
        slow: 0.3,    // Very slow - 30% of normal speed
        normal: 1.0,  // Normal baseline
        fast: 2.5     // Very fast - 250% of normal speed
      },
      ghost: {
        slow: 0.2,    // Very slow - 20% of normal speed  
        normal: 1.0,  // Normal baseline
        fast: 3.0     // Very fast - 300% of normal speed
      }
    };

    this.PERMUTATIONS = this.generatePermutations();
    this.currentSession = null;
    this.userId = null;
    this.sessionOrder = [];
    this.metrics = [];
    this.currentMetrics = null;
    this.gameStartTime = null;
    this.isExperimentActive = false;
  }

  generatePermutations() {
    const permutations = [];
    const pacmanSpeeds = ['slow', 'normal', 'fast'];
    const ghostSpeeds = ['slow', 'normal', 'fast'];
    
    let id = 0;
    for (const pacmanSpeed of pacmanSpeeds) {
      for (const ghostSpeed of ghostSpeeds) {
        permutations.push({
          id: id++,
          pacman: pacmanSpeed,
          ghost: ghostSpeed
        });
      }
    }
    return permutations;
  }

  initializeUser(userId) {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    this.userId = userId.trim();
    this.loadUserData();
    
    if (this.sessionOrder.length === 0) {
      this.sessionOrder = this.generateRandomizedOrder();
      this.saveUserData();
    }
  }

  generateRandomizedOrder() {
    if (this.sessionManager) {
      return this.sessionManager.generateAdvancedRandomization(this.userId);
    }
    
    // Fallback to simple randomization
    const order = [...Array(9).keys()];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  }

  startSession() {
    console.log('[ExperimentManager] 🟢 START SESSION CALLED');
    if (!this.userId) {
      throw new Error('User ID must be set before starting session');
    }

    // Check for existing session state
    const savedState = this.loadCurrentSession();
    if (savedState && this.canResumeSession(savedState)) {
      return this.resumeSession(savedState);
    }

    const completedSessions = this.getCompletedSessionsCount();
    if (completedSessions >= 9) {
      throw new Error('All sessions completed');
    }

    const permutationId = this.sessionOrder[completedSessions];
    const config = this.PERMUTATIONS[permutationId];
    
    this.currentSession = {
      userId: this.userId,
      sessionId: completedSessions + 1,
      permutationId: permutationId,
      speedConfig: config,
      timestamp: new Date(),
      events: [],
      summary: {
        totalGhostsEaten: 0,
        totalPelletsEaten: 0,
        totalDeaths: 0,
        successfulTurns: 0,
        totalTurns: 0,
        gameTime: 0
      },
      resumed: false,
      startTime: Date.now()
    };

    this.currentMetrics = this.currentSession;
    this.gameStartTime = null; // Will be set when gameplay actually starts
    this.gameplayStarted = false;
    this.gameplayPausedTime = 0; // Total time paused
    this.lastPauseStart = null;
    this.isExperimentActive = true;

    console.log('[ExperimentManager] 🎯 About to apply speed configuration:', config);
    this.applySpeedConfiguration(config);
    this.saveCurrentSession();
    
    return this.currentSession;
  }

  canResumeSession(savedState) {
    const age = Date.now() - (savedState.lastSaved || savedState.startTime || 0);
    const maxAge = 60 * 60 * 1000; // 1 hour
    
    return age < maxAge && 
           savedState.userId === this.userId && 
           savedState.sessionId > 0 && 
           savedState.sessionId <= 9;
  }

  resumeSession(savedState) {
    console.log('[ExperimentManager] Resuming previous session:', savedState.sessionId);
    
    this.currentSession = {
      ...savedState,
      resumed: true,
      resumeTime: Date.now()
    };
    
    this.currentMetrics = this.currentSession;
    this.gameStartTime = savedState.startTime || Date.now();
    this.isExperimentActive = true;

    this.applySpeedConfiguration(savedState.speedConfig);
    this.saveCurrentSession();
    
    return this.currentSession;
  }

  applySpeedConfiguration(config) {
    const pacmanMultiplier = this.SPEED_CONFIGS.pacman[config.pacman];
    const ghostMultiplier = this.SPEED_CONFIGS.ghost[config.ghost];

    console.log('[ExperimentManager] 🚀 DISPATCHING SPEED CONFIG EVENT');
    console.log('[ExperimentManager] Config:', config);
    console.log('[ExperimentManager] Pac-Man multiplier:', pacmanMultiplier);
    console.log('[ExperimentManager] Ghost multiplier:', ghostMultiplier);

    // Store the config for retry if needed
    this.pendingSpeedConfig = { pacmanMultiplier, ghostMultiplier, config };

    const event = new CustomEvent('speedConfigChanged', {
      detail: {
        pacmanMultiplier,
        ghostMultiplier,
        config
      }
    });
    
    window.dispatchEvent(event);
    console.log('[ExperimentManager] ✅ Speed config event dispatched');

    // Also try direct application via gameCoordinator if available
    if (window.gameCoordinator && window.gameCoordinator.speedController && window.gameCoordinator.speedController.isInitialized) {
      console.log('[ExperimentManager] 🔄 Applying speeds directly as backup');
      window.gameCoordinator.speedController.applySpeedConfiguration({
        pacmanMultiplier,
        ghostMultiplier,
        config
      });
    }
  }

  logEvent(type, data = {}) {
    if (!this.isExperimentActive || !this.currentMetrics) {
      console.warn('[ExperimentManager] Cannot log event - experiment not active');
      return false;
    }

    if (!this.validateEventData(type, data)) {
      console.error('[ExperimentManager] Invalid event data:', { type, data });
      return false;
    }

    try {
      const event = {
        type,
        time: Date.now() - this.gameStartTime,
        timestamp: new Date(),
        ...data
      };

      this.currentMetrics.events.push(event);
      this.updateSummary(type, data);
      this.saveCurrentSession();
      
      return true;
    } catch (error) {
      console.error('[ExperimentManager] Error logging event:', error);
      return false;
    }
  }

  validateEventData(type, data) {
    const validTypes = ['ghostEaten', 'pelletEaten', 'death', 'turnComplete'];
    
    if (!validTypes.includes(type)) {
      console.warn(`[ExperimentManager] Unknown event type: ${type}`);
      return false;
    }

    if (typeof data !== 'object' || data === null) {
      console.warn('[ExperimentManager] Event data must be an object');
      return false;
    }

    switch (type) {
      case 'ghostEaten':
        if (!data.ghostId || typeof data.ghostId !== 'string') {
          console.warn('[ExperimentManager] ghostEaten event requires valid ghostId');
          return false;
        }
        break;
        
      case 'pelletEaten':
        if (!data.type || !['pacdot', 'powerPellet', 'fruit'].includes(data.type)) {
          console.warn('[ExperimentManager] pelletEaten event requires valid type');
          return false;
        }
        break;
        
      case 'death':
        if (!data.cause || typeof data.cause !== 'string') {
          console.warn('[ExperimentManager] death event requires valid cause');
          return false;
        }
        break;
        
      case 'turnComplete':
        if (typeof data.success !== 'boolean') {
          console.warn('[ExperimentManager] turnComplete event requires boolean success');
          return false;
        }
        break;
    }

    return true;
  }

  updateSummary(type, data) {
    if (!this.currentMetrics) return;

    const summary = this.currentMetrics.summary;
    
    switch (type) {
      case 'ghostEaten':
        summary.totalGhostsEaten++;
        break;
      case 'pelletEaten':
        summary.totalPelletsEaten++;
        break;
      case 'death':
        summary.totalDeaths++;
        break;
      case 'turnComplete':
        summary.totalTurns++;
        if (data.success) {
          summary.successfulTurns++;
        }
        break;
    }
  }

  startGameplayTimer() {
    if (!this.isExperimentActive || this.gameplayStarted) return;
    
    this.gameStartTime = Date.now();
    this.gameplayStarted = true;
    this.gameplayPausedTime = 0;
    this.lastPauseStart = null;
    
    console.log('[ExperimentManager] ⏱️ Gameplay timer started');
  }

  pauseGameplayTimer() {
    if (!this.gameplayStarted || this.lastPauseStart) return;
    
    this.lastPauseStart = Date.now();
    console.log('[ExperimentManager] ⏸️ Gameplay timer paused');
  }

  resumeGameplayTimer() {
    if (!this.gameplayStarted || !this.lastPauseStart) return;
    
    const pauseDuration = Date.now() - this.lastPauseStart;
    this.gameplayPausedTime += pauseDuration;
    this.lastPauseStart = null;
    
    console.log('[ExperimentManager] ▶️ Gameplay timer resumed (paused for ' + pauseDuration + 'ms)');
  }

  getGameplayTime() {
    if (!this.gameStartTime) return 0;
    
    let currentTime = Date.now();
    let totalTime = currentTime - this.gameStartTime;
    
    // Subtract total paused time
    totalTime -= this.gameplayPausedTime;
    
    // If currently paused, subtract current pause duration
    if (this.lastPauseStart) {
      totalTime -= (currentTime - this.lastPauseStart);
    }
    
    return Math.max(0, totalTime);
  }

  endSession() {
    if (!this.isExperimentActive || !this.currentMetrics) return;

    // Ensure timer is properly stopped and calculate final time
    if (this.lastPauseStart) {
      this.resumeGameplayTimer(); // Close any open pause
    }
    
    this.currentMetrics.summary.gameTime = this.getGameplayTime();
    this.metrics.push(this.currentMetrics);
    
    this.saveUserData();
    this.clearCurrentSession();
    
    this.isExperimentActive = false;
    this.currentMetrics = null;
    this.gameStartTime = null;
    this.gameplayStarted = false;
    this.gameplayPausedTime = 0;
    this.lastPauseStart = null;
  }

  getCompletedSessionsCount() {
    return this.metrics.length;
  }

  getRemainingSessionsCount() {
    return 9 - this.getCompletedSessionsCount();
  }

  getCurrentSessionInfo() {
    if (!this.currentSession) return null;
    
    return {
      sessionId: this.currentSession.sessionId,
      completedSessions: this.getCompletedSessionsCount(),
      totalSessions: 9,
      speedConfig: this.currentSession.speedConfig
    };
  }

  saveUserData() {
    if (!this.userId) {
      console.warn('[ExperimentManager] Cannot save user data - no userId');
      return false;
    }

    try {
      const userData = {
        userId: this.userId,
        sessionOrder: this.sessionOrder,
        metrics: this.metrics,
        lastUpdated: new Date(),
        version: '1.0'
      };

      const serialized = JSON.stringify(userData);
      if (serialized.length > 5000000) { // 5MB limit
        console.warn('[ExperimentManager] User data too large, truncating old sessions');
        userData.metrics = userData.metrics.slice(-5); // Keep only last 5 sessions
      }

      localStorage.setItem(`experiment_${this.userId}`, JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('[ExperimentManager] Error saving user data:', error);
      return false;
    }
  }

  loadUserData() {
    if (!this.userId) {
      console.warn('[ExperimentManager] Cannot load user data - no userId');
      return false;
    }

    try {
      const stored = localStorage.getItem(`experiment_${this.userId}`);
      if (stored) {
        const userData = JSON.parse(stored);
        
        if (this.validateUserData(userData)) {
          this.sessionOrder = userData.sessionOrder || [];
          this.metrics = userData.metrics || [];
          return true;
        } else {
          console.warn('[ExperimentManager] Invalid user data format, resetting');
          this.resetUserData();
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('[ExperimentManager] Error loading user data:', error);
      this.resetUserData();
      return false;
    }
  }

  validateUserData(userData) {
    if (!userData || typeof userData !== 'object') {
      return false;
    }

    if (userData.userId !== this.userId) {
      console.warn('[ExperimentManager] User ID mismatch in stored data');
      return false;
    }

    if (!Array.isArray(userData.sessionOrder) || userData.sessionOrder.length > 9) {
      console.warn('[ExperimentManager] Invalid session order in stored data');
      return false;
    }

    if (!Array.isArray(userData.metrics) || userData.metrics.length > 9) {
      console.warn('[ExperimentManager] Invalid metrics array in stored data');
      return false;
    }

    return true;
  }

  resetUserData() {
    this.sessionOrder = [];
    this.metrics = [];
    
    if (this.userId) {
      localStorage.removeItem(`experiment_${this.userId}`);
      localStorage.removeItem(`current_session_${this.userId}`);
    }
  }

  saveCurrentSession() {
    if (!this.currentSession) return;
    localStorage.setItem(`current_session_${this.userId}`, JSON.stringify(this.currentSession));
  }

  loadCurrentSession() {
    if (!this.userId) return null;
    
    const stored = localStorage.getItem(`current_session_${this.userId}`);
    if (stored) {
      this.currentSession = JSON.parse(stored);
      this.currentMetrics = this.currentSession;
      return this.currentSession;
    }
    return null;
  }

  clearCurrentSession() {
    if (!this.userId) return;
    localStorage.removeItem(`current_session_${this.userId}`);
    this.currentSession = null;
  }

  exportData(format = 'json') {
    const exportData = {
      userId: this.userId,
      sessionOrder: this.sessionOrder,
      metrics: this.metrics,
      exportTimestamp: new Date(),
      totalSessions: this.metrics.length
    };

    if (format === 'csv') {
      return this.convertToCSV(exportData);
    }
    
    return JSON.stringify(exportData, null, 2);
  }

  convertToCSV(data) {
    const headers = [
      'userId', 'sessionId', 'permutationId', 'pacmanSpeed', 'ghostSpeed',
      'totalGhostsEaten', 'totalPelletsEaten', 'totalDeaths', 
      'successfulTurns', 'totalTurns', 'gameTime', 'timestamp'
    ];

    const rows = data.metrics.map(session => [
      session.userId,
      session.sessionId,
      session.permutationId,
      session.speedConfig.pacman,
      session.speedConfig.ghost,
      session.summary.totalGhostsEaten,
      session.summary.totalPelletsEaten,
      session.summary.totalDeaths,
      session.summary.successfulTurns,
      session.summary.totalTurns,
      session.summary.gameTime,
      session.timestamp
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  getDebugInfo() {
    return {
      userId: this.userId,
      currentSession: this.currentSession?.sessionId || null,
      completedSessions: this.getCompletedSessionsCount(),
      remainingSessions: this.getRemainingSessionsCount(),
      sessionOrder: this.sessionOrder,
      isExperimentActive: this.isExperimentActive
    };
  }
}

// removeIf(production)
module.exports = ExperimentManager;
// endRemoveIf(production)