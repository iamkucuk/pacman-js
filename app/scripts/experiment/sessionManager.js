class SessionManager {
  constructor(experimentManager) {
    this.experimentManager = experimentManager;
    this.sessionHistory = [];
    this.currentSessionData = null;
    this.sessionStartTime = null;
    this.lastActivityTime = null;
    this.idleThreshold = 5 * 60 * 1000; // 5 minutes
    this.maxSessionDuration = 30 * 60 * 1000; // 30 minutes
    this.isInitialized = false;
    this.DEBUG = true;
  }

  initialize() {
    if (this.isInitialized) return;

    this.bindEvents();
    this.setupActivityTracking();
    this.loadSessionHistory();
    this.isInitialized = true;

    if (this.DEBUG) {
      console.log('[SessionManager] Initialized');
    }
  }

  bindEvents() {
    window.addEventListener('experimentSessionStarted', (e) => {
      this.handleSessionStart(e.detail);
    });

    window.addEventListener('experimentSessionEnded', () => {
      this.handleSessionEnd();
    });

    window.addEventListener('beforeunload', () => {
      this.handlePageUnload();
    });

    window.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });
  }

  setupActivityTracking() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    events.forEach((event) => {
      document.addEventListener(event, () => {
        this.updateLastActivity();
      }, true);
    });

    setInterval(() => {
      this.checkIdleStatus();
    }, 30000); // Check every 30 seconds
  }

  generateAdvancedRandomization(userId) {
    const seed = this.createSeedFromUserId(userId);
    const rng = this.createSeededRandom(seed);

    // Fisher-Yates shuffle with seeded random based on actual session count
    const sessionCount = this.experimentManager.SESSION_CONFIGS.length;
    const permutations = [...Array(sessionCount).keys()]; // 0, 1, 2, 3, 4, 5
    for (let i = permutations.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [permutations[i], permutations[j]] = [permutations[j], permutations[i]];
    }

    // Validate session distribution for our 6 custom sessions
    const sessionDistribution = this.validateSpeedDistribution(permutations);

    if (this.DEBUG) {
      console.log('[SessionManager] Generated 6-session randomization for', userId, permutations);
      console.log('[SessionManager] Session distribution:', sessionDistribution);
    }

    return permutations;
  }

  createSeedFromUserId(userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash &= hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  createSeededRandom(seed) {
    let currentSeed = seed;
    return function () {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };
  }

  validateSpeedDistribution(permutations) {
    // For the new 6-session system, just return a valid distribution
    // Since we have hand-designed sessions, we don't need the old speed validation
    const sessionCounts = {};
    
    permutations.forEach((permId) => {
      const config = this.experimentManager.PERMUTATIONS[permId];
      if (config && config.name) {
        sessionCounts[config.name] = (sessionCounts[config.name] || 0) + 1;
      }
    });

    return { sessions: sessionCounts };
  }

  handleSessionStart(sessionInfo) {
    this.currentSessionData = {
      ...sessionInfo,
      startTime: Date.now(),
      events: [],
      milestones: [],
      deviceInfo: this.captureDeviceInfo(),
      browserInfo: this.captureBrowserInfo(),
    };

    this.sessionStartTime = Date.now();
    this.updateLastActivity();
    this.saveSessionState();

    this.logMilestone('session_started', {
      sessionId: sessionInfo.sessionId,
      speedConfig: sessionInfo.speedConfig,
    });

    if (this.DEBUG) {
      console.log('[SessionManager] Session started:', this.currentSessionData);
    }
  }

  handleSessionEnd() {
    if (!this.currentSessionData) return;

    const sessionDuration = Date.now() - this.sessionStartTime;

    this.logMilestone('session_ended', {
      duration: sessionDuration,
      totalEvents: this.currentSessionData.events.length,
    });

    this.sessionHistory.push({
      ...this.currentSessionData,
      endTime: Date.now(),
      duration: sessionDuration,
      completed: true,
    });

    this.saveSessionHistory();
    this.clearSessionState();
    this.currentSessionData = null;
    this.sessionStartTime = null;

    if (this.DEBUG) {
      console.log('[SessionManager] Session ended, duration:', sessionDuration);
    }
  }

  handlePageUnload() {
    if (this.currentSessionData) {
      this.logMilestone('page_unload', {
        duration: Date.now() - this.sessionStartTime,
        completed: false,
      });

      this.saveSessionState();

      if (this.DEBUG) {
        console.log('[SessionManager] Page unload detected, session saved');
      }
    }
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.logMilestone('tab_hidden', {
        timestamp: Date.now(),
      });
    } else {
      this.logMilestone('tab_visible', {
        timestamp: Date.now(),
      });
      this.updateLastActivity();
    }
  }

  updateLastActivity() {
    this.lastActivityTime = Date.now();
  }

  checkIdleStatus() {
    if (!this.currentSessionData || !this.lastActivityTime) return;

    const idleTime = Date.now() - this.lastActivityTime;
    const sessionTime = Date.now() - this.sessionStartTime;

    if (idleTime > this.idleThreshold) {
      this.logMilestone('idle_detected', {
        idleTime,
        sessionTime,
      });

      this.handleIdleSession();
    }

    if (sessionTime > this.maxSessionDuration) {
      this.logMilestone('session_timeout', {
        sessionTime,
      });

      this.handleSessionTimeout();
    }
  }

  handleIdleSession() {
    if (this.DEBUG) {
      console.log('[SessionManager] Idle session detected');
    }

    // Could trigger a warning or pause the game
    window.dispatchEvent(new CustomEvent('sessionIdle', {
      detail: {
        idleTime: Date.now() - this.lastActivityTime,
      },
    }));
  }

  handleSessionTimeout() {
    if (this.DEBUG) {
      console.log('[SessionManager] Session timeout detected');
    }

    // Force end the session
    window.dispatchEvent(new CustomEvent('sessionTimeout', {
      detail: {
        sessionTime: Date.now() - this.sessionStartTime,
      },
    }));
  }

  logMilestone(type, data = {}) {
    if (!this.currentSessionData) return;

    const milestone = {
      type,
      timestamp: Date.now(),
      sessionTime: Date.now() - this.sessionStartTime,
      ...data,
    };

    this.currentSessionData.milestones.push(milestone);
    this.saveSessionState();

    if (this.DEBUG) {
      console.log('[SessionManager] Milestone:', type, data);
    }
  }

  captureDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenResolution: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
  }

  captureBrowserInfo() {
    return {
      url: window.location.href,
      referrer: document.referrer,
      title: document.title,
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      localStorageAvailable: this.testLocalStorage(),
    };
  }

  testLocalStorage() {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  saveSessionState() {
    if (!this.currentSessionData || !this.experimentManager.userId) return;

    try {
      const stateData = {
        ...this.currentSessionData,
        lastSaved: Date.now(),
      };

      localStorage.setItem(
        `session_state_${this.experimentManager.userId}`,
        JSON.stringify(stateData),
      );

      return true;
    } catch (error) {
      console.error('[SessionManager] Error saving session state:', error);
      return false;
    }
  }

  loadSessionState() {
    if (!this.experimentManager.userId) return null;

    try {
      const stored = localStorage.getItem(`session_state_${this.experimentManager.userId}`);
      if (stored) {
        const stateData = JSON.parse(stored);

        // Check if session is recent (within 1 hour)
        const age = Date.now() - stateData.lastSaved;
        if (age < 60 * 60 * 1000) {
          return stateData;
        }
      }

      return null;
    } catch (error) {
      console.error('[SessionManager] Error loading session state:', error);
      return null;
    }
  }

  clearSessionState() {
    if (!this.experimentManager.userId) return;

    localStorage.removeItem(`session_state_${this.experimentManager.userId}`);
  }

  saveSessionHistory() {
    if (!this.experimentManager.userId) return;

    try {
      const historyData = {
        userId: this.experimentManager.userId,
        sessions: this.sessionHistory,
        lastUpdated: Date.now(),
      };

      localStorage.setItem(
        `session_history_${this.experimentManager.userId}`,
        JSON.stringify(historyData),
      );

      return true;
    } catch (error) {
      console.error('[SessionManager] Error saving session history:', error);
      return false;
    }
  }

  loadSessionHistory() {
    if (!this.experimentManager.userId) return;

    try {
      const stored = localStorage.getItem(`session_history_${this.experimentManager.userId}`);
      if (stored) {
        const historyData = JSON.parse(stored);
        this.sessionHistory = historyData.sessions || [];
      }
    } catch (error) {
      console.error('[SessionManager] Error loading session history:', error);
      this.sessionHistory = [];
    }
  }

  getSessionAnalytics() {
    const completed = this.sessionHistory.filter(s => s.completed);
    const incomplete = this.sessionHistory.filter(s => !s.completed);

    const avgDuration = completed.length > 0
      ? completed.reduce((sum, s) => sum + s.duration, 0) / completed.length
      : 0;

    const totalEvents = completed.reduce((sum, s) => sum + ((s.events && s.events.length) ? s.events.length : 0), 0);

    return {
      totalSessions: this.sessionHistory.length,
      completedSessions: completed.length,
      incompleteSessions: incomplete.length,
      averageDuration: avgDuration,
      totalEvents,
      sessionHistory: this.sessionHistory.map(s => ({
        sessionId: s.sessionId,
        speedConfig: s.speedConfig,
        duration: s.duration,
        completed: s.completed,
        events: (s.events && s.events.length) ? s.events.length : 0,
        milestones: (s.milestones && s.milestones.length) ? s.milestones.length : 0,
      })),
    };
  }

  exportSessionData() {
    const analytics = this.getSessionAnalytics();
    const deviceInfo = this.captureDeviceInfo();
    const browserInfo = this.captureBrowserInfo();

    return {
      userId: this.experimentManager.userId,
      exportTimestamp: new Date().toISOString(),
      analytics,
      deviceInfo,
      browserInfo,
      fullSessionHistory: this.sessionHistory,
      currentSession: this.currentSessionData,
    };
  }

  getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      currentSessionActive: this.currentSessionData !== null,
      sessionStartTime: this.sessionStartTime,
      lastActivityTime: this.lastActivityTime,
      sessionHistory: this.sessionHistory.length,
      idleThreshold: this.idleThreshold,
      maxSessionDuration: this.maxSessionDuration,
      analytics: this.getSessionAnalytics(),
    };
  }
}

// removeIf(production)
module.exports = SessionManager;
// endRemoveIf(production)
