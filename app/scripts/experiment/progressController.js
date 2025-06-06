class ProgressController {
  constructor(experimentManager, sessionManager) {
    this.experimentManager = experimentManager;
    this.sessionManager = sessionManager;
    this.progressState = {
      currentPhase: 'pre_session',
      allowedActions: ['start_session'],
      restrictions: [],
      warnings: []
    };
    this.validationRules = [];
    this.isInitialized = false;
    this.DEBUG = true;
  }

  initialize() {
    if (this.isInitialized) return;
    
    this.setupValidationRules();
    this.bindEvents();
    this.isInitialized = true;
    
    if (this.DEBUG) {
      console.log('[ProgressController] Initialized');
    }
  }

  setupValidationRules() {
    this.validationRules = [
      {
        name: 'session_order_integrity',
        check: () => this.validateSessionOrder(),
        severity: 'error'
      },
      {
        name: 'user_data_consistency',
        check: () => this.validateUserDataConsistency(),
        severity: 'error'
      },
      {
        name: 'session_completion_rate',
        check: () => this.validateSessionCompletionRate(),
        severity: 'warning'
      },
      {
        name: 'session_duration_bounds',
        check: () => this.validateSessionDuration(),
        severity: 'warning'
      },
      {
        name: 'metrics_data_quality',
        check: () => this.validateMetricsQuality(),
        severity: 'warning'
      }
    ];
  }

  bindEvents() {
    window.addEventListener('experimentSessionStarted', () => {
      this.handleSessionStart();
    });

    window.addEventListener('experimentSessionEnded', () => {
      this.handleSessionEnd();
    });

    window.addEventListener('sessionIdle', (e) => {
      this.handleSessionIdle(e.detail);
    });

    window.addEventListener('sessionTimeout', (e) => {
      this.handleSessionTimeout(e.detail);
    });
  }

  handleSessionStart() {
    this.progressState.currentPhase = 'in_session';
    this.progressState.allowedActions = ['end_session', 'pause_session'];
    this.progressState.restrictions = ['start_new_session', 'change_user'];
    
    const validation = this.runValidation();
    if (validation.hasErrors) {
      this.progressState.warnings.push('Session started with validation errors');
    }
    
    if (this.DEBUG) {
      console.log('[ProgressController] Session started, phase:', this.progressState.currentPhase);
    }
  }

  handleSessionEnd() {
    const completedSessions = this.experimentManager.getCompletedSessionsCount();
    
    if (completedSessions >= 9) {
      this.progressState.currentPhase = 'experiment_complete';
      this.progressState.allowedActions = ['export_data', 'reset_experiment'];
      this.progressState.restrictions = ['start_session'];
    } else {
      this.progressState.currentPhase = 'between_sessions';
      this.progressState.allowedActions = ['start_next_session', 'export_partial_data'];
      this.progressState.restrictions = [];
    }
    
    this.progressState.warnings = [];
    
    if (this.DEBUG) {
      console.log('[ProgressController] Session ended, phase:', this.progressState.currentPhase);
    }
  }

  handleSessionIdle(detail) {
    this.progressState.warnings.push({
      type: 'idle_session',
      message: `Session idle for ${Math.round(detail.idleTime / 1000)} seconds`,
      timestamp: Date.now()
    });
    
    if (this.DEBUG) {
      console.log('[ProgressController] Session idle detected');
    }
  }

  handleSessionTimeout(detail) {
    this.progressState.warnings.push({
      type: 'session_timeout',
      message: `Session exceeded maximum duration (${Math.round(detail.sessionTime / 1000)} seconds)`,
      timestamp: Date.now()
    });
    
    // Force end session
    this.forceEndSession('timeout');
    
    if (this.DEBUG) {
      console.log('[ProgressController] Session timeout, forcing end');
    }
  }

  forceEndSession(reason) {
    this.progressState.restrictions.push(`forced_end_${reason}`);
    
    // Trigger session end
    window.dispatchEvent(new CustomEvent('forceEndSession', {
      detail: { reason }
    }));
  }

  canPerformAction(action) {
    const allowed = this.progressState.allowedActions.includes(action);
    const restricted = this.progressState.restrictions.includes(action);
    
    return allowed && !restricted;
  }

  validateAction(action, context = {}) {
    const validation = {
      allowed: this.canPerformAction(action),
      errors: [],
      warnings: []
    };
    
    switch (action) {
      case 'start_session':
        this.validateStartSession(validation, context);
        break;
      case 'end_session':
        this.validateEndSession(validation, context);
        break;
      case 'export_data':
        this.validateExportData(validation, context);
        break;
      case 'reset_experiment':
        this.validateResetExperiment(validation, context);
        break;
    }
    
    return validation;
  }

  validateStartSession(validation, context) {
    const completedSessions = this.experimentManager.getCompletedSessionsCount();
    
    if (completedSessions >= 9) {
      validation.errors.push('All sessions already completed');
      validation.allowed = false;
    }
    
    if (this.progressState.currentPhase === 'in_session') {
      validation.errors.push('Session already in progress');
      validation.allowed = false;
    }
    
    if (!this.experimentManager.userId) {
      validation.errors.push('User ID not set');
      validation.allowed = false;
    }
    
    // Check for incomplete session state
    const savedState = this.sessionManager.loadSessionState();
    if (savedState) {
      validation.warnings.push('Previous session state found - will resume');
    }
  }

  validateEndSession(validation, context) {
    if (this.progressState.currentPhase !== 'in_session') {
      validation.errors.push('No active session to end');
      validation.allowed = false;
    }
    
    const currentMetrics = this.experimentManager.currentMetrics;
    if (currentMetrics && currentMetrics.events.length === 0) {
      validation.warnings.push('Ending session with no recorded events');
    }
  }

  validateExportData(validation, context) {
    const completedSessions = this.experimentManager.getCompletedSessionsCount();
    
    if (completedSessions === 0) {
      validation.errors.push('No completed sessions to export');
      validation.allowed = false;
    }
    
    if (!this.testLocalStorage()) {
      validation.warnings.push('Local storage not available - export may be incomplete');
    }
  }

  validateResetExperiment(validation, context) {
    if (this.progressState.currentPhase === 'in_session') {
      validation.errors.push('Cannot reset during active session');
      validation.allowed = false;
    }
    
    const completedSessions = this.experimentManager.getCompletedSessionsCount();
    if (completedSessions > 0) {
      validation.warnings.push(`Resetting will lose ${completedSessions} completed sessions`);
    }
  }

  runValidation() {
    const results = {
      passed: [],
      warnings: [],
      errors: [],
      hasErrors: false,
      hasWarnings: false
    };
    
    this.validationRules.forEach(rule => {
      try {
        const result = rule.check();
        
        if (result.valid) {
          results.passed.push(rule.name);
        } else {
          if (rule.severity === 'error') {
            results.errors.push({
              rule: rule.name,
              message: result.message,
              data: result.data
            });
            results.hasErrors = true;
          } else {
            results.warnings.push({
              rule: rule.name,
              message: result.message,
              data: result.data
            });
            results.hasWarnings = true;
          }
        }
      } catch (error) {
        results.errors.push({
          rule: rule.name,
          message: `Validation rule failed: ${error.message}`,
          data: { error: error.toString() }
        });
        results.hasErrors = true;
      }
    });
    
    return results;
  }

  validateSessionOrder() {
    const sessionOrder = this.experimentManager.sessionOrder;
    const completedSessions = this.experimentManager.getCompletedSessionsCount();
    
    if (sessionOrder.length !== 9) {
      return {
        valid: false,
        message: `Invalid session order length: ${sessionOrder.length}, expected 9`,
        data: { sessionOrder }
      };
    }
    
    const uniqueIds = new Set(sessionOrder);
    if (uniqueIds.size !== 9) {
      return {
        valid: false,
        message: 'Session order contains duplicate permutation IDs',
        data: { sessionOrder, duplicates: sessionOrder.length - uniqueIds.size }
      };
    }
    
    const validIds = sessionOrder.every(id => id >= 0 && id <= 8);
    if (!validIds) {
      return {
        valid: false,
        message: 'Session order contains invalid permutation IDs',
        data: { sessionOrder }
      };
    }
    
    return { valid: true };
  }

  validateUserDataConsistency() {
    const userId = this.experimentManager.userId;
    const metrics = this.experimentManager.metrics;
    
    if (!userId) {
      return {
        valid: false,
        message: 'No user ID set',
        data: {}
      };
    }
    
    const userIdMismatch = metrics.some(metric => metric.userId !== userId);
    if (userIdMismatch) {
      return {
        valid: false,
        message: 'User ID mismatch in metrics data',
        data: { userId, metricsCount: metrics.length }
      };
    }
    
    const sessionIdGaps = this.checkSessionIdSequence(metrics);
    if (sessionIdGaps.length > 0) {
      return {
        valid: false,
        message: 'Session ID sequence has gaps',
        data: { gaps: sessionIdGaps }
      };
    }
    
    return { valid: true };
  }

  checkSessionIdSequence(metrics) {
    const sessionIds = metrics.map(m => m.sessionId).sort((a, b) => a - b);
    const gaps = [];
    
    for (let i = 1; i <= sessionIds.length; i++) {
      if (!sessionIds.includes(i)) {
        gaps.push(i);
      }
    }
    
    return gaps;
  }

  validateSessionCompletionRate() {
    const analytics = this.sessionManager.getSessionAnalytics();
    const completionRate = analytics.totalSessions > 0 
      ? analytics.completedSessions / analytics.totalSessions 
      : 1;
    
    if (completionRate < 0.8) {
      return {
        valid: false,
        message: `Low session completion rate: ${Math.round(completionRate * 100)}%`,
        data: analytics
      };
    }
    
    return { valid: true };
  }

  validateSessionDuration() {
    const analytics = this.sessionManager.getSessionAnalytics();
    const avgDuration = analytics.averageDuration;
    
    // Expect sessions to be between 2-25 minutes
    const minDuration = 2 * 60 * 1000;
    const maxDuration = 25 * 60 * 1000;
    
    if (avgDuration < minDuration) {
      return {
        valid: false,
        message: `Average session duration too short: ${Math.round(avgDuration / 1000)}s`,
        data: { avgDuration, minExpected: minDuration }
      };
    }
    
    if (avgDuration > maxDuration) {
      return {
        valid: false,
        message: `Average session duration too long: ${Math.round(avgDuration / 1000)}s`,
        data: { avgDuration, maxExpected: maxDuration }
      };
    }
    
    return { valid: true };
  }

  validateMetricsQuality() {
    const currentMetrics = this.experimentManager.currentMetrics;
    if (!currentMetrics) {
      return { valid: true }; // No current session
    }
    
    const events = currentMetrics.events;
    const summary = currentMetrics.summary;
    
    // Check for reasonable event counts
    if (events.length === 0 && Date.now() - this.sessionManager.sessionStartTime > 60000) {
      return {
        valid: false,
        message: 'No events recorded after 1 minute of gameplay',
        data: { eventCount: events.length, sessionTime: Date.now() - this.sessionManager.sessionStartTime }
      };
    }
    
    // Check for data consistency between events and summary
    const eventCounts = this.countEventTypes(events);
    
    if (Math.abs(eventCounts.ghostEaten - summary.totalGhostsEaten) > 0) {
      return {
        valid: false,
        message: 'Ghost eaten count mismatch between events and summary',
        data: { events: eventCounts.ghostEaten, summary: summary.totalGhostsEaten }
      };
    }
    
    return { valid: true };
  }

  countEventTypes(events) {
    return events.reduce((counts, event) => {
      counts[event.type] = (counts[event.type] || 0) + 1;
      return counts;
    }, {});
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

  getProgressSummary() {
    const validation = this.runValidation();
    const completedSessions = this.experimentManager.getCompletedSessionsCount();
    const analytics = this.sessionManager.getSessionAnalytics();
    
    return {
      phase: this.progressState.currentPhase,
      progress: `${completedSessions}/9`,
      progressPercent: Math.round((completedSessions / 9) * 100),
      allowedActions: this.progressState.allowedActions,
      restrictions: this.progressState.restrictions,
      warnings: this.progressState.warnings,
      validation,
      analytics: {
        completionRate: analytics.totalSessions > 0 
          ? Math.round((analytics.completedSessions / analytics.totalSessions) * 100) 
          : 100,
        averageDuration: Math.round(analytics.averageDuration / 1000),
        totalEvents: analytics.totalEvents
      }
    };
  }

  getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      progressState: this.progressState,
      validationRules: this.validationRules.map(r => r.name),
      summary: this.getProgressSummary()
    };
  }
}

// removeIf(production)
module.exports = ProgressController;
// endRemoveIf(production)