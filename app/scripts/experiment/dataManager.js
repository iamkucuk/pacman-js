class DataManager {
  constructor(experimentManager, sessionManager) {
    this.experimentManager = experimentManager;
    this.sessionManager = sessionManager;
    this.backupInterval = null;
    this.compressionEnabled = true;
    this.maxStorageSize = 50 * 1024 * 1024; // 50MB
    this.isInitialized = false;
    this.DEBUG = true;
  }

  initialize() {
    if (this.isInitialized) return;
    
    this.setupAutoBackup();
    this.checkStorageHealth();
    this.bindEvents();
    this.isInitialized = true;
    
    if (this.DEBUG) {
      console.log('[DataManager] Initialized with auto-backup');
    }
  }

  bindEvents() {
    window.addEventListener('experimentSessionStarted', () => {
      this.createSessionBackup();
    });

    window.addEventListener('experimentSessionEnded', () => {
      this.createSessionBackup();
      this.cleanupOldBackups();
    });

    window.addEventListener('beforeunload', () => {
      this.createEmergencyBackup();
    });

    // Backup on significant events
    window.addEventListener('awardPoints', () => {
      this.deferredBackup();
    });

    window.addEventListener('deathSequence', () => {
      this.createEventBackup('death');
    });
  }

  setupAutoBackup() {
    // Create backup every 2 minutes during active session
    this.backupInterval = setInterval(() => {
      if (this.experimentManager.isExperimentActive) {
        this.createPeriodicBackup();
      }
    }, 2 * 60 * 1000);
  }

  createSessionBackup() {
    try {
      const backupData = this.gatherSessionData();
      const compressed = this.compressData(backupData);
      
      const backupKey = `session_backup_${this.experimentManager.userId}_${Date.now()}`;
      localStorage.setItem(backupKey, compressed);
      
      this.logBackup('session', backupKey, backupData);
      return true;
    } catch (error) {
      console.error('[DataManager] Session backup failed:', error);
      return false;
    }
  }

  createPeriodicBackup() {
    try {
      const backupData = this.gatherLiveData();
      const compressed = this.compressData(backupData);
      
      const backupKey = `periodic_backup_${this.experimentManager.userId}`;
      localStorage.setItem(backupKey, compressed);
      
      if (this.DEBUG) {
        console.log('[DataManager] Periodic backup created');
      }
      return true;
    } catch (error) {
      console.error('[DataManager] Periodic backup failed:', error);
      return false;
    }
  }

  createEventBackup(eventType) {
    try {
      const backupData = {
        type: 'event_backup',
        eventType,
        timestamp: Date.now(),
        currentSession: this.experimentManager.currentSession,
        recentEvents: this.getRecentEvents(10)
      };
      
      const compressed = this.compressData(backupData);
      const backupKey = `event_backup_${eventType}_${this.experimentManager.userId}_${Date.now()}`;
      
      localStorage.setItem(backupKey, compressed);
      this.logBackup('event', backupKey, backupData);
      return true;
    } catch (error) {
      console.error('[DataManager] Event backup failed:', error);
      return false;
    }
  }

  createEmergencyBackup() {
    try {
      const backupData = {
        type: 'emergency_backup',
        timestamp: Date.now(),
        reason: 'page_unload',
        ...this.gatherCriticalData()
      };
      
      const compressed = this.compressData(backupData);
      localStorage.setItem(`emergency_backup_${this.experimentManager.userId}`, compressed);
      
      if (this.DEBUG) {
        console.log('[DataManager] Emergency backup created');
      }
      return true;
    } catch (error) {
      console.error('[DataManager] Emergency backup failed:', error);
      return false;
    }
  }

  deferredBackup() {
    // Debounced backup for frequent events
    if (this.deferredBackupTimeout) {
      clearTimeout(this.deferredBackupTimeout);
    }
    
    this.deferredBackupTimeout = setTimeout(() => {
      this.createPeriodicBackup();
    }, 5000);
  }

  gatherSessionData() {
    return {
      type: 'session_backup',
      timestamp: Date.now(),
      userId: this.experimentManager.userId,
      sessionOrder: this.experimentManager.sessionOrder,
      metrics: this.experimentManager.metrics,
      currentSession: this.experimentManager.currentSession,
      sessionHistory: this.sessionManager.sessionHistory,
      analytics: this.sessionManager.getSessionAnalytics()
    };
  }

  gatherLiveData() {
    return {
      type: 'live_backup',
      timestamp: Date.now(),
      userId: this.experimentManager.userId,
      currentSession: this.experimentManager.currentSession,
      recentEvents: this.getRecentEvents(20),
      sessionState: this.sessionManager.currentSessionData
    };
  }

  gatherCriticalData() {
    return {
      userId: this.experimentManager.userId,
      currentSession: this.experimentManager.currentSession,
      completedSessions: this.experimentManager.getCompletedSessionsCount(),
      sessionOrder: this.experimentManager.sessionOrder,
      lastEvents: this.getRecentEvents(5)
    };
  }

  getRecentEvents(count) {
    if (!this.experimentManager.currentSession || !this.experimentManager.currentSession.events) {
      return [];
    }
    
    const events = this.experimentManager.currentSession.events;
    return events.slice(-count);
  }

  compressData(data) {
    if (!this.compressionEnabled) {
      return JSON.stringify(data);
    }
    
    try {
      // Simple compression: remove whitespace and compress common patterns
      const json = JSON.stringify(data);
      const compressed = json
        .replace(/\s+/g, ' ')
        .replace(/","/g, '","')
        .replace(/":"/g, '":"');
      
      return btoa(compressed); // Base64 encode
    } catch (error) {
      console.warn('[DataManager] Compression failed, using raw JSON');
      return JSON.stringify(data);
    }
  }

  decompressData(compressed) {
    try {
      // Try base64 decode first
      const decoded = atob(compressed);
      return JSON.parse(decoded);
    } catch (error) {
      // Fallback to direct JSON parse
      try {
        return JSON.parse(compressed);
      } catch (parseError) {
        console.error('[DataManager] Decompression failed:', parseError);
        return null;
      }
    }
  }

  recoverFromBackup(backupType = 'latest') {
    try {
      const backups = this.listBackups();
      
      if (backups.length === 0) {
        console.warn('[DataManager] No backups found for recovery');
        return null;
      }
      
      let targetBackup;
      
      switch (backupType) {
        case 'latest':
          targetBackup = backups[backups.length - 1];
          break;
        case 'session':
          targetBackup = backups.find(b => b.type === 'session');
          break;
        case 'emergency':
          targetBackup = backups.find(b => b.type === 'emergency');
          break;
        default:
          targetBackup = backups.find(b => b.key === backupType);
      }
      
      if (!targetBackup) {
        console.warn('[DataManager] Backup type not found:', backupType);
        return null;
      }
      
      const backupData = this.loadBackup(targetBackup.key);
      if (backupData) {
        this.restoreFromBackupData(backupData);
        console.log('[DataManager] Successfully recovered from backup:', targetBackup.key);
        return backupData;
      }
      
      return null;
    } catch (error) {
      console.error('[DataManager] Recovery failed:', error);
      return null;
    }
  }

  restoreFromBackupData(backupData) {
    if (backupData.userId && backupData.userId !== this.experimentManager.userId) {
      console.warn('[DataManager] Backup user ID mismatch');
      return false;
    }
    
    // Restore session order
    if (backupData.sessionOrder) {
      this.experimentManager.sessionOrder = backupData.sessionOrder;
    }
    
    // Restore metrics
    if (backupData.metrics) {
      this.experimentManager.metrics = backupData.metrics;
    }
    
    // Restore current session if valid
    if (backupData.currentSession && this.isValidSession(backupData.currentSession)) {
      this.experimentManager.currentSession = backupData.currentSession;
      this.experimentManager.currentMetrics = backupData.currentSession;
    }
    
    // Save restored data
    this.experimentManager.saveUserData();
    this.experimentManager.saveCurrentSession();
    
    return true;
  }

  isValidSession(session) {
    return session && 
           session.userId && 
           session.sessionId && 
           session.speedConfig && 
           Array.isArray(session.events);
  }

  loadBackup(backupKey) {
    try {
      const compressed = localStorage.getItem(backupKey);
      if (!compressed) {
        return null;
      }
      
      return this.decompressData(compressed);
    } catch (error) {
      console.error('[DataManager] Failed to load backup:', backupKey, error);
      return null;
    }
  }

  listBackups() {
    const backups = [];
    const userId = this.experimentManager.userId;
    
    if (!userId) return backups;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && key.includes(`backup_${userId}`)) {
        const timestamp = this.extractTimestampFromKey(key);
        const type = this.extractTypeFromKey(key);
        
        backups.push({
          key,
          timestamp,
          type,
          age: Date.now() - timestamp
        });
      }
    }
    
    return backups.sort((a, b) => a.timestamp - b.timestamp);
  }

  extractTimestampFromKey(key) {
    const match = key.match(/_(\d+)$/);
    return match ? parseInt(match[1]) : 0;
  }

  extractTypeFromKey(key) {
    if (key.includes('session_backup')) return 'session';
    if (key.includes('periodic_backup')) return 'periodic';
    if (key.includes('event_backup')) return 'event';
    if (key.includes('emergency_backup')) return 'emergency';
    return 'unknown';
  }

  cleanupOldBackups() {
    try {
      const backups = this.listBackups();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      const maxBackups = 50;
      
      // Remove old backups
      const oldBackups = backups.filter(b => b.age > maxAge);
      oldBackups.forEach(backup => {
        localStorage.removeItem(backup.key);
      });
      
      // Keep only latest backups if too many
      const remainingBackups = backups.filter(b => b.age <= maxAge);
      if (remainingBackups.length > maxBackups) {
        const toRemove = remainingBackups
          .slice(0, remainingBackups.length - maxBackups);
        
        toRemove.forEach(backup => {
          localStorage.removeItem(backup.key);
        });
      }
      
      if (this.DEBUG && (oldBackups.length > 0 || remainingBackups.length > maxBackups)) {
        console.log('[DataManager] Cleaned up old backups:', oldBackups.length);
      }
      
      return true;
    } catch (error) {
      console.error('[DataManager] Cleanup failed:', error);
      return false;
    }
  }

  checkStorageHealth() {
    try {
      const usage = this.calculateStorageUsage();
      const health = this.assessStorageHealth(usage);
      
      if (health.status === 'critical') {
        console.warn('[DataManager] Storage critical, forcing cleanup');
        this.emergencyCleanup();
      } else if (health.status === 'warning') {
        console.warn('[DataManager] Storage warning, running cleanup');
        this.cleanupOldBackups();
      }
      
      if (this.DEBUG) {
        console.log('[DataManager] Storage health:', health);
      }
      
      return health;
    } catch (error) {
      console.error('[DataManager] Storage health check failed:', error);
      return { status: 'error', usage: 0, available: 0 };
    }
  }

  calculateStorageUsage() {
    let totalSize = 0;
    let experimentSize = 0;
    const userId = this.experimentManager.userId;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      const size = (key.length + value.length) * 2; // Rough estimate in bytes
      
      totalSize += size;
      
      if (key && userId && key.includes(userId)) {
        experimentSize += size;
      }
    }
    
    return {
      total: totalSize,
      experiment: experimentSize,
      available: this.maxStorageSize - totalSize
    };
  }

  assessStorageHealth(usage) {
    const utilizationPercent = (usage.total / this.maxStorageSize) * 100;
    
    let status;
    if (utilizationPercent > 90) {
      status = 'critical';
    } else if (utilizationPercent > 70) {
      status = 'warning';
    } else {
      status = 'healthy';
    }
    
    return {
      status,
      usage: usage.total,
      available: usage.available,
      utilizationPercent: Math.round(utilizationPercent),
      experimentUsage: usage.experiment
    };
  }

  emergencyCleanup() {
    try {
      // Remove all old backups first
      const backups = this.listBackups();
      const oldBackups = backups.filter(b => b.age > 24 * 60 * 60 * 1000); // 1 day
      
      oldBackups.forEach(backup => {
        localStorage.removeItem(backup.key);
      });
      
      // Remove periodic backups
      const periodicBackups = backups.filter(b => b.type === 'periodic');
      periodicBackups.forEach(backup => {
        localStorage.removeItem(backup.key);
      });
      
      console.log('[DataManager] Emergency cleanup completed');
      return true;
    } catch (error) {
      console.error('[DataManager] Emergency cleanup failed:', error);
      return false;
    }
  }

  logBackup(type, key, data) {
    if (this.DEBUG) {
      console.log(`[DataManager] ${type} backup created:`, {
        key,
        size: JSON.stringify(data).length,
        events: (data.currentSession && data.currentSession.events) ? data.currentSession.events.length : 0
      });
    }
  }

  exportAllData() {
    const allData = {
      userData: this.gatherSessionData(),
      backups: this.listBackups().map(b => ({
        ...b,
        data: this.loadBackup(b.key)
      })),
      storageHealth: this.checkStorageHealth(),
      exportTimestamp: new Date().toISOString()
    };
    
    return allData;
  }

  getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      compressionEnabled: this.compressionEnabled,
      backupCount: this.listBackups().length,
      storageHealth: this.checkStorageHealth(),
      maxStorageSize: this.maxStorageSize
    };
  }

  destroy() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
    
    if (this.deferredBackupTimeout) {
      clearTimeout(this.deferredBackupTimeout);
      this.deferredBackupTimeout = null;
    }
    
    this.isInitialized = false;
  }
}

// removeIf(production)
module.exports = DataManager;
// endRemoveIf(production)