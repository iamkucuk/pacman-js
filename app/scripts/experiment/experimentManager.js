class ExperimentManager {
  constructor() {
    this.SPEED_CONFIGS = {
      pacman: {
        slow: 0.3, // Very slow - 30% of normal speed
        normal: 1.0, // Normal baseline
        fast: 2.5, // Very fast - 250% of normal speed
      },
      ghost: {
        slow: 0.2, // Very slow - 20% of normal speed
        normal: 1.0, // Normal baseline
        fast: 3.0, // Very fast - 300% of normal speed
      },
    };

    this.PERMUTATIONS = this.generatePermutations();
    this.currentSession = null;
    this.userId = null;
    this.sessionOrder = [];
    this.metrics = [];
    this.currentMetrics = null;
    this.gameStartTime = null;
    this.isExperimentActive = false;

    // Supabase integration
    this.supabaseManager = null;
    this.useSupabase = true; // Enable Supabase by default
    this.supabaseInitializing = false;
    this.supabaseInitialized = false;
    this.dataLoadedFromSupabase = false; // Track if we successfully loaded from Supabase

    // Database migration detection - clear localStorage if database changed
    this.checkDatabaseMigration();
    this.initializeSupabase();

    // Set up game event listeners for multi-game sessions
    this.setupGameEventListeners();
  }

  checkDatabaseMigration() {
    // Expected database identifier for current deployment
    const currentDatabaseId = 'kozbxghtgtnoldywzdmg';
    const storageKey = 'experiment_database_id';

    try {
      const storedDatabaseId = localStorage.getItem(storageKey);

      if (storedDatabaseId && storedDatabaseId !== currentDatabaseId) {
        console.log('[ExperimentManager] 🔄 Database migration detected!');
        console.log('[ExperimentManager] Old database:', storedDatabaseId);
        console.log('[ExperimentManager] New database:', currentDatabaseId);
        console.log('[ExperimentManager] 🧹 Clearing localStorage for fresh start...');

        // Clear all experiment-related data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('experiment_')) {
            keysToRemove.push(key);
          }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('[ExperimentManager] ✅ Cleared', keysToRemove.length, 'localStorage items');
      }

      // Update stored database ID
      localStorage.setItem(storageKey, currentDatabaseId);
    } catch (error) {
      console.warn('[ExperimentManager] Database migration check failed:', error);
    }
  }

  async initializeSupabase() {
    if (this.supabaseInitializing) {
      console.log('[ExperimentManager] ⏳ Supabase already initializing, waiting...');
      return;
    }

    this.supabaseInitializing = true;

    try {
      console.log('[ExperimentManager] 🔍 Checking SupabaseDataManager availability...');
      console.log('[ExperimentManager] typeof SupabaseDataManager:', typeof SupabaseDataManager);

      if (typeof SupabaseDataManager !== 'undefined') {
        console.log('[ExperimentManager] ✨ Creating SupabaseDataManager instance...');
        this.supabaseManager = new SupabaseDataManager();

        console.log('[ExperimentManager] 🚀 Initializing Supabase connection...');
        const initialized = await this.supabaseManager.initialize();

        if (initialized) {
          console.log('[ExperimentManager] 🚀 Supabase integration enabled');
          console.log('[ExperimentManager] Supabase URL:', this.supabaseManager.supabaseUrl);
          this.supabaseInitialized = true;
        } else {
          console.warn('[ExperimentManager] Supabase init failed, using localStorage');
          this.useSupabase = false;
        }
      } else {
        console.warn('[ExperimentManager] SupabaseDataManager not found, using localStorage');
        this.useSupabase = false;
      }
    } catch (error) {
      console.error('[ExperimentManager] Supabase initialization error:', error);
      console.error('[ExperimentManager] Error stack:', error.stack);
      this.useSupabase = false;
    } finally {
      this.supabaseInitializing = false;
    }
  }

  async waitForSupabaseInitialization() {
    if (this.supabaseInitialized) return true;
    if (!this.useSupabase) return false;

    // Wait up to 10 seconds for initialization
    const timeout = 10000;
    const startTime = Date.now();

    while (this.supabaseInitializing && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return this.supabaseInitialized;
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
          ghost: ghostSpeed,
        });
      }
    }
    return permutations;
  }

  getNextSessionInfo() {
    if (!this.userId) {
      throw new Error('User ID must be set before getting session info');
    }

    const completedSessions = this.getCompletedSessionsCount();
    if (completedSessions >= 9) {
      return null; // All sessions completed
    }

    const permutationId = this.sessionOrder[completedSessions];
    if (permutationId === undefined) {
      throw new Error('Session order not properly initialized');
    }

    const config = this.PERMUTATIONS[permutationId];
    if (!config) {
      throw new Error(`Invalid permutation ID: ${permutationId}`);
    }

    return {
      userId: this.userId,
      sessionId: completedSessions + 1,
      permutationId,
      speedConfig: config,
      completedSessions,
    };
  }

  async initializeUser(userId) {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    this.userId = userId.trim();

    // Wait for Supabase initialization if it's enabled
    console.log('[ExperimentManager] 🔄 Waiting for Supabase initialization...');
    await this.waitForSupabaseInitialization();

    if (this.useSupabase && this.supabaseManager && this.supabaseInitialized) {
      try {
        console.log('[ExperimentManager] 🗃️ Loading user data from Supabase...');
        const supabaseSuccess = await this.loadUserDataFromSupabase();
        if (!supabaseSuccess) {
          console.log('[ExperimentManager] 📂 Supabase returned no data, checking localStorage...');
          this.loadUserData();
        }
      } catch (error) {
        console.error('[ExperimentManager] Supabase user init failed:', error);
        // Fallback to localStorage only if Supabase completely failed
        console.log('[ExperimentManager] 📂 Falling back to localStorage...');
        this.loadUserData();
      }
    } else {
      console.log('[ExperimentManager] 📂 Using localStorage for user data...');
      this.loadUserData();
    }

    if (this.sessionOrder.length === 0) {
      this.sessionOrder = this.generateRandomizedOrder();
      await this.saveUserData();
    }
  }

  async loadUserDataFromSupabase() {
    if (!this.supabaseManager) return false;

    try {
      const userData = await this.supabaseManager.getUserData(this.userId);
      if (userData) {
        this.sessionOrder = userData.sessionOrder || [];
        // Create metrics array based on completed sessions count
        // Each completed session adds one entry to maintain compatibility
        this.metrics = new Array(userData.completedSessionsCount).fill(null).map(() => ({}));
        console.log('[ExperimentManager] 📖 User data loaded from Supabase');
        console.log('[ExperimentManager] 📊 Completed sessions:', userData.completedSessionsCount);
        console.log('[ExperimentManager] 📋 Session order:', this.sessionOrder);
        console.log('[ExperimentManager] 📋 Created metrics array:', this.metrics);
        console.log('[ExperimentManager] 📋 Metrics array length:', this.metrics.length);
        this.dataLoadedFromSupabase = true; // Mark that we successfully loaded from Supabase
        return true;
      }
      // Initialize new user in Supabase
      await this.supabaseManager.initializeUser(this.userId, []);
      this.sessionOrder = [];
      this.metrics = [];
      return true;
    } catch (error) {
      console.error('[ExperimentManager] Error loading from Supabase:', error);
      return false;
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

  async startSession() {
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

    // Debug logging to help identify the issue
    console.log('[ExperimentManager] Debug - sessionOrder:', this.sessionOrder);
    console.log('[ExperimentManager] Debug - completedSessions:', completedSessions);
    console.log('[ExperimentManager] Debug - metrics array:', this.metrics);
    console.log('[ExperimentManager] Debug - metrics.length:', this.metrics.length);

    const permutationId = this.sessionOrder[completedSessions];
    console.log('[ExperimentManager] Debug - permutationId:', permutationId);

    if (permutationId === undefined) {
      throw new Error('Session order not properly initialized. Please refresh and try again.');
    }

    const config = this.PERMUTATIONS[permutationId];
    console.log('[ExperimentManager] Debug - config:', config);

    if (!config) {
      throw new Error(`Invalid permutation ID: ${permutationId}`);
    }

    this.currentSession = {
      userId: this.userId,
      sessionId: completedSessions + 1,
      permutationId,
      speedConfig: config,
      timestamp: new Date(),
      events: [],
      games: [], // Array to store individual game statistics
      currentGame: null, // Current game being played
      summary: {
        // Session-level aggregated statistics
        totalGamesPlayed: 0,
        aggregatedStats: {
          ghostsEaten: { mean: 0, std: 0, max: 0, min: 0, values: [] },
          pelletsEaten: { mean: 0, std: 0, max: 0, min: 0, values: [] },
          deaths: { mean: 0, std: 0, max: 0, min: 0, values: [] },
          successfulTurns: { mean: 0, std: 0, max: 0, min: 0, values: [] },
          totalTurns: { mean: 0, std: 0, max: 0, min: 0, values: [] },
          gameTime: { mean: 0, std: 0, max: 0, min: 0, values: [] },
          finalScore: { mean: 0, std: 0, max: 0, min: 0, values: [] }
        },
        // Legacy totals for backward compatibility
        totalGhostsEaten: 0,
        totalPelletsEaten: 0,
        totalDeaths: 0,
        successfulTurns: 0,
        totalTurns: 0,
        gameTime: 0,
      },
      resumed: false,
      startTime: Date.now(),
    };

    this.currentMetrics = this.currentSession;
    this.gameStartTime = null; // Will be set when gameplay actually starts
    this.gameplayStarted = false;
    this.gameplayPausedTime = 0; // Total time paused
    this.lastPauseStart = null;
    this.isExperimentActive = true;

    // Create session in Supabase
    if (this.useSupabase && this.supabaseManager) {
      try {
        await this.supabaseManager.createSession(this.currentSession);
        console.log('[ExperimentManager] 📊 Session created in Supabase');
      } catch (error) {
        console.error('[ExperimentManager] Failed to create Supabase session:', error);
      }
    }

    console.log('[ExperimentManager] 🎯 About to apply speed configuration:', config);
    this.applySpeedConfiguration(config);
    this.saveCurrentSession();

    return this.currentSession;
  }

  canResumeSession(savedState) {
    const age = Date.now() - (savedState.lastSaved || savedState.startTime || 0);
    const maxAge = 60 * 60 * 1000; // 1 hour

    // Check if this saved session matches the expected next session
    const expectedSessionId = this.getCompletedSessionsCount() + 1;
    const sessionMatches = savedState.sessionId === expectedSessionId;

    console.log('[ExperimentManager] Resume session check:');
    console.log('- Saved session ID:', savedState.sessionId);
    console.log('- Expected session ID:', expectedSessionId);
    console.log('- Session matches:', sessionMatches);
    console.log('- Age check passed:', age < maxAge);

    return age < maxAge
           && savedState.userId === this.userId
           && savedState.sessionId > 0
           && savedState.sessionId <= 9
           && sessionMatches; // Only resume if it's the correct session
  }

  resumeSession(savedState) {
    console.log('[ExperimentManager] Resuming previous session:', savedState.sessionId);

    this.currentSession = {
      ...savedState,
      resumed: true,
      resumeTime: Date.now(),
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
        config,
      },
    });

    window.dispatchEvent(event);
    console.log('[ExperimentManager] ✅ Speed config event dispatched');

    // Also try direct application via gameCoordinator if available
    if (window.gameCoordinator && window.gameCoordinator.speedController && window.gameCoordinator.speedController.isInitialized) {
      console.log('[ExperimentManager] 🔄 Applying speeds directly as backup');
      window.gameCoordinator.speedController.applySpeedConfiguration({
        pacmanMultiplier,
        ghostMultiplier,
        config,
      });
    }
  }

  async logEvent(type, data = {}) {
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
        userId: this.userId,
        data,
      };

      this.currentMetrics.events.push(event);
      this.updateSummary(type, data);
      this.saveCurrentSession();

      // Log to Supabase
      if (this.useSupabase && this.supabaseManager) {
        try {
          console.log('[ExperimentManager] 📝 Logging event to Supabase:', type, data);
          const success = await this.supabaseManager.logEvent(event);
          if (success) {
            console.log('[ExperimentManager] ✅ Event logged to Supabase successfully');
          } else {
            console.warn('[ExperimentManager] ⚠️ Event logging to Supabase returned false');
          }
        } catch (error) {
          console.error('[ExperimentManager] ❌ Failed to log event to Supabase:', error);
        }
      } else {
        console.log('[ExperimentManager] 📋 Skipping Supabase event log - useSupabase:', this.useSupabase, 'supabaseManager:', !!this.supabaseManager);
      }

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

    const { summary } = this.currentMetrics;

    // Update session-level legacy totals
    switch (type) {
      case 'ghostEaten':
        summary.totalGhostsEaten++;
        this.updateCurrentGameStats('ghostsEaten');
        break;
      case 'pelletEaten':
        summary.totalPelletsEaten++;
        this.updateCurrentGameStats('pelletsEaten');
        break;
      case 'death':
        summary.totalDeaths++;
        this.updateCurrentGameStats('deaths');
        break;
      case 'turnComplete':
        summary.totalTurns++;
        this.updateCurrentGameStats('totalTurns');
        if (data.success) {
          summary.successfulTurns++;
          this.updateCurrentGameStats('successfulTurns');
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

    console.log(`[ExperimentManager] ▶️ Gameplay timer resumed (paused for ${pauseDuration}ms)`);
  }

  getGameplayTime() {
    if (!this.gameStartTime) return 0;

    const currentTime = Date.now();
    let totalTime = currentTime - this.gameStartTime;

    // Subtract total paused time
    totalTime -= this.gameplayPausedTime;

    // If currently paused, subtract current pause duration
    if (this.lastPauseStart) {
      totalTime -= (currentTime - this.lastPauseStart);
    }

    return Math.max(0, totalTime);
  }

  async endSession(finalScore = 0) {
    console.log('[ExperimentManager] 🚨 OLD endSession() called - this should NOT happen in multi-game sessions!');
    console.trace('[ExperimentManager] Call stack for endSession:');
    
    // BLOCK session ending during individual games - only allow when explicitly requested
    if (this.currentSession && this.currentSession.games && this.blockSessionEnd !== true) {
      console.log('[ExperimentManager] 🚫 BLOCKING automatic session end - this is a multi-game session');
      console.log('[ExperimentManager] 🎮 Current games:', this.currentSession.games.length);
      console.log('[ExperimentManager] 🔴 To end session, use "End Session" button');
      return; // Don't end session automatically
    }
    
    if (!this.isExperimentActive || !this.currentMetrics) {
      console.log('[ExperimentManager] 🚫 Early return from endSession - isActive:', this.isExperimentActive, 'hasMetrics:', !!this.currentMetrics);
      return;
    }

    // Ensure timer is properly stopped and calculate final time
    if (this.lastPauseStart) {
      this.resumeGameplayTimer(); // Close any open pause
    }

    this.currentMetrics.summary.gameTime = this.getGameplayTime();
    this.currentMetrics.summary.finalScore = finalScore;
    this.metrics.push(this.currentMetrics);

    // Complete session in Supabase
    if (this.useSupabase && this.supabaseManager) {
      try {
        // Update session summary with final metrics
        await this.supabaseManager.updateSessionSummary({
          totalGhostsEaten: this.currentMetrics.summary.totalGhostsEaten,
          totalPelletsEaten: this.currentMetrics.summary.totalPelletsEaten,
          totalPacdotsEaten: this.getDetailedCount('pacdot'),
          totalPowerPelletsEaten: this.getDetailedCount('powerPellet'),
          totalFruitsEaten: this.getDetailedCount('fruit'),
          totalDeaths: this.currentMetrics.summary.totalDeaths,
          successfulTurns: this.currentMetrics.summary.successfulTurns,
          totalTurns: this.currentMetrics.summary.totalTurns,
          finalScore,
        });

        // Mark session as completed with final score
        await this.supabaseManager.completeSession(this.currentMetrics.summary.gameTime, finalScore);

        // Update score statistics for all user sessions
        await this.supabaseManager.updateScoreStatistics(this.userId);

        console.log('[ExperimentManager] ✅ Session completed in Supabase');
      } catch (error) {
        console.error('[ExperimentManager] Failed to complete Supabase session:', error);
      }
    }

    // Save to CSV after session completion
    // this.saveSessionToCSV(this.currentMetrics); // Disabled - CSV export not needed after each session

    await this.saveUserData();
    this.clearCurrentSession();

    this.isExperimentActive = false;
    this.currentMetrics = null;
    this.gameStartTime = null;
    this.gameplayStarted = false;
    this.gameplayPausedTime = 0;
    this.lastPauseStart = null;
  }

  getDetailedCount(eventType) {
    if (!this.currentMetrics || !this.currentMetrics.events) return 0;
    return this.currentMetrics.events.filter(event => event.type === 'pelletEaten' && event.data && event.data.type === eventType).length;
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
      speedConfig: this.currentSession.speedConfig,
    };
  }

  async saveUserData() {
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
        version: '1.0',
      };

      const serialized = JSON.stringify(userData);
      if (serialized.length > 5000000) { // 5MB limit
        console.warn('[ExperimentManager] User data too large, truncating old sessions');
        userData.metrics = userData.metrics.slice(-5); // Keep only last 5 sessions
      }

      // Save to localStorage for backward compatibility
      localStorage.setItem(`experiment_${this.userId}`, JSON.stringify(userData));

      // Update session order in Supabase
      if (this.useSupabase && this.supabaseManager) {
        try {
          await this.supabaseManager.updateUserSessionOrder(this.userId, this.sessionOrder);
        } catch (error) {
          console.error('[ExperimentManager] Failed to update Supabase session order:', error);
        }
      }

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

    // Don't override Supabase data if we successfully loaded from there
    if (this.dataLoadedFromSupabase) {
      console.log('[ExperimentManager] Skipping localStorage - already loaded from Supabase');
      return true;
    }

    try {
      const stored = localStorage.getItem(`experiment_${this.userId}`);
      if (stored) {
        const userData = JSON.parse(stored);

        if (this.validateUserData(userData)) {
          this.sessionOrder = userData.sessionOrder || [];
          this.metrics = userData.metrics || [];
          return true;
        }
        console.warn('[ExperimentManager] Invalid user data format, resetting');
        this.resetUserData();
        return false;
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
      totalSessions: this.metrics.length,
    };

    if (format === 'csv') {
      return this.convertToCSV(exportData);
    }

    return JSON.stringify(exportData, null, 2);
  }

  convertToCSV(data) {
    const headers = [
      'userId', 'sessionId', 'sessionType', 'permutationId', 'pacmanSpeed', 'ghostSpeed',
      'totalGhostsEaten', 'totalPelletsEaten', 'totalDeaths',
      'successfulTurns', 'totalTurns', 'gameTime', 'timestamp',
    ];

    const rows = data.metrics.map(session => [
      session.userId,
      session.sessionId,
      session.permutationId + 1, // Session type (1-9)
      session.permutationId,
      session.speedConfig.pacman,
      session.speedConfig.ghost,
      session.summary.totalGhostsEaten,
      session.summary.totalPelletsEaten,
      session.summary.totalDeaths,
      session.summary.successfulTurns,
      session.summary.totalTurns,
      session.summary.gameTime,
      session.timestamp,
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  saveSessionToCSV(sessionData) {
    if (!sessionData || !this.userId) {
      console.warn('[ExperimentManager] Cannot save session to CSV - missing data');
      return false;
    }

    try {
      const csvData = this.convertSessionToCSVRow(sessionData);
      const filename = `pacman_experiment_${this.userId}.csv`;

      // Check if this is the first session for this user
      const existingCSV = localStorage.getItem(`csv_${this.userId}`);
      let fullCSV;

      if (!existingCSV) {
        // First session - include headers
        const headers = [
          'userId', 'sessionId', 'sessionType', 'permutationId', 'pacmanSpeed', 'ghostSpeed',
          'totalGhostsEaten', 'totalPelletsEaten', 'totalDeaths',
          'successfulTurns', 'totalTurns', 'gameTime', 'timestamp',
        ];
        fullCSV = `${headers.join(',')}\n${csvData}`;
      } else {
        // Append to existing CSV
        fullCSV = `${existingCSV}\n${csvData}`;
      }

      // Save to localStorage for persistence
      localStorage.setItem(`csv_${this.userId}`, fullCSV);

      // Also trigger download
      this.downloadCSV(fullCSV, filename);

      console.log('[ExperimentManager] Session saved to CSV:', filename);
      return true;
    } catch (error) {
      console.error('[ExperimentManager] Error saving session to CSV:', error);
      return false;
    }
  }

  convertSessionToCSVRow(session) {
    return [
      session.userId,
      session.sessionId,
      session.permutationId + 1, // Session type (1-9)
      session.permutationId,
      session.speedConfig.pacman,
      session.speedConfig.ghost,
      session.summary.totalGhostsEaten,
      session.summary.totalPelletsEaten,
      session.summary.totalDeaths,
      session.summary.successfulTurns,
      session.summary.totalTurns,
      session.summary.gameTime,
      session.timestamp,
    ].join(',');
  }

  downloadCSV(csvContent, filename) {
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log('[ExperimentManager] CSV file downloaded:', filename);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[ExperimentManager] Error downloading CSV:', error);
      return false;
    }
  }

  exportUserCSV() {
    if (!this.userId) {
      console.warn('[ExperimentManager] Cannot export CSV - no user ID');
      return false;
    }

    const csvData = localStorage.getItem(`csv_${this.userId}`);
    if (!csvData) {
      console.warn('[ExperimentManager] No CSV data found for user:', this.userId);
      return false;
    }

    const filename = `pacman_experiment_${this.userId}_complete.csv`;
    return this.downloadCSV(csvData, filename);
  }

  /**
   * Export user data from Supabase for research analysis
   */
  async exportSupabaseData() {
    if (!this.useSupabase || !this.supabaseManager) {
      console.warn('[ExperimentManager] Supabase not available');
      return null;
    }

    try {
      const data = await this.supabaseManager.exportUserData(this.userId);
      if (data) {
        const filename = `pacman_supabase_${this.userId}_${new Date().toISOString().split('T')[0]}.json`;
        this.downloadJSON(JSON.stringify(data, null, 2), filename);
        console.log('[ExperimentManager] ✅ Supabase data exported:', filename);
        return data;
      }
      return null;
    } catch (error) {
      console.error('[ExperimentManager] Error exporting Supabase data:', error);
      return null;
    }
  }

  /**
   * Get aggregated research data (for researchers)
   */
  async getResearchData(filters = {}) {
    if (!this.useSupabase || !this.supabaseManager) {
      console.warn('[ExperimentManager] Supabase not available');
      return null;
    }

    try {
      return await this.supabaseManager.getResearchData(filters);
    } catch (error) {
      console.error('[ExperimentManager] Error getting research data:', error);
      return null;
    }
  }

  /**
   * Download JSON data
   */
  downloadJSON(jsonContent, filename) {
    try {
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[ExperimentManager] Error downloading JSON:', error);
      return false;
    }
  }

  /**
   * Test Supabase connection
   */
  async testSupabaseConnection() {
    if (!this.useSupabase || !this.supabaseManager) {
      return false;
    }

    try {
      return await this.supabaseManager.testConnection();
    } catch (error) {
      console.error('[ExperimentManager] Supabase connection test failed:', error);
      return false;
    }
  }

  /**
   * Get database health statistics
   */
  async getSupabaseHealthStats() {
    if (!this.useSupabase || !this.supabaseManager) {
      return null;
    }

    try {
      return await this.supabaseManager.getHealthStats();
    } catch (error) {
      console.error('[ExperimentManager] Error getting health stats:', error);
      return null;
    }
  }

  /**
   * Reset all experiment data (localStorage and Supabase)
   */
  async resetExperiment() {
    try {
      console.log('[ExperimentManager] 🔄 Starting experiment reset...');

      // Get current user ID before reset
      const userIdToDelete = this.userId;

      // Stop any current session
      if (this.isExperimentActive) {
        this.isExperimentActive = false;
        this.currentSession = null;
        this.currentMetrics = null;
        this.gameStartTime = null;
        console.log('[ExperimentManager] ⏹️ Stopped current session');
      }

      // Clear localStorage data
      try {
        localStorage.removeItem('pacman-experiment-user-id');
        localStorage.removeItem(`pacman-experiment-${userIdToDelete}`);
        console.log('[ExperimentManager] ✅ Cleared localStorage data');
      } catch (error) {
        console.warn('[ExperimentManager] ⚠️ Error clearing localStorage:', error);
      }

      // Clear Supabase data if available and user exists
      if (userIdToDelete && this.useSupabase && this.supabaseManager) {
        try {
          console.log('[ExperimentManager] 🗑️ Deleting Supabase data for user:', userIdToDelete);
          const supabaseResult = await this.supabaseManager.deleteUserData(userIdToDelete);
          if (supabaseResult && supabaseResult.success) {
            console.log('[ExperimentManager] ✅ Supabase data deleted successfully:', supabaseResult.message);
          } else {
            console.warn('[ExperimentManager] ⚠️ Supabase deletion failed:', (supabaseResult && supabaseResult.message) ? supabaseResult.message : 'Unknown error');
            // Don't throw error here - continue with reset even if Supabase fails
          }
        } catch (error) {
          console.warn('[ExperimentManager] ⚠️ Error deleting Supabase data:', error);
          // Don't throw error here - continue with reset even if Supabase fails
        }
      }

      // Reset instance variables
      this.userId = null;
      this.sessionOrder = [];
      this.metrics = [];
      this.currentSession = null;
      this.currentMetrics = null;
      this.gameStartTime = null;
      this.isExperimentActive = false;
      this.dataLoadedFromSupabase = false;

      console.log('[ExperimentManager] 🎉 Experiment reset completed successfully');
      return true;
    } catch (error) {
      console.error('[ExperimentManager] ❌ Error during experiment reset:', error);
      return false;
    }
  }

  /**
   * Delete the last session's data from Supabase and localStorage
   */
  async deleteLastSession() {
    try {
      console.log('[ExperimentManager] 🗑️ Starting deletion of last session...');

      if (!this.userId) {
        throw new Error('No user ID available');
      }

      // Delete from Supabase if available
      let supabaseResult = null;
      if (this.useSupabase && this.supabaseManager) {
        try {
          console.log('[ExperimentManager] 🗑️ Deleting last session from Supabase for user:', this.userId);
          supabaseResult = await this.supabaseManager.deleteLastSession(this.userId);
          if (supabaseResult.success) {
            console.log('[ExperimentManager] ✅ Supabase last session deleted:', supabaseResult.message);
          } else {
            console.warn('[ExperimentManager] ⚠️ Supabase deletion failed:', supabaseResult.message);
          }
        } catch (error) {
          console.warn('[ExperimentManager] ⚠️ Error deleting from Supabase:', error);
        }
      }

      // Remove last session from localStorage metrics
      if (this.metrics && this.metrics.length > 0) {
        const removedSession = this.metrics.pop();
        console.log('[ExperimentManager] ✅ Removed last session from localStorage metrics');

        // Update localStorage
        try {
          const storageKey = `pacman-experiment-${this.userId}`;
          const userData = {
            userId: this.userId,
            sessionOrder: this.sessionOrder,
            metrics: this.metrics,
            lastUpdated: new Date().toISOString(),
          };
          localStorage.setItem(storageKey, JSON.stringify(userData));
          console.log('[ExperimentManager] ✅ Updated localStorage after session deletion');
        } catch (error) {
          console.warn('[ExperimentManager] ⚠️ Error updating localStorage:', error);
        }
      }

      const message = supabaseResult ? supabaseResult.message : 'Last session removed from local data';
      console.log('[ExperimentManager] 🎉 Last session deletion completed:', message);

      return {
        success: true,
        message,
        supabaseResult,
      };
    } catch (error) {
      console.error('[ExperimentManager] ❌ Error during last session deletion:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Start a new game within the current session
   */
  startNewGame() {
    if (!this.currentSession) {
      console.error('[ExperimentManager] Cannot start game - no active session');
      return null;
    }

    // Finalize previous game if it exists
    if (this.currentSession.currentGame) {
      this.finalizeCurrentGame();
    }

    // Create new game instance
    this.currentSession.currentGame = {
      gameId: this.currentSession.games.length + 1,
      startTime: Date.now(),
      endTime: null,
      gameTime: 0,
      finalScore: 0,
      stats: {
        ghostsEaten: 0,
        pelletsEaten: 0,
        deaths: 0,
        successfulTurns: 0,
        totalTurns: 0,
      },
      events: [],
      endReason: null, // 'game_over', 'level_complete', or 'manual_end'
    };

    console.log('[ExperimentManager] 🎮 Started new game:', this.currentSession.currentGame.gameId);
    return this.currentSession.currentGame;
  }

  /**
   * End the current game with reason (game_over, level_complete, manual_end)
   */
  endCurrentGame(reason = 'manual_end', finalScore = 0) {
    if (!this.currentSession || !this.currentSession.currentGame) {
      console.warn('[ExperimentManager] No active game to end');
      return null;
    }

    const game = this.currentSession.currentGame;
    game.endTime = Date.now();
    game.gameTime = game.endTime - game.startTime;
    game.finalScore = finalScore;
    game.endReason = reason;

    // Move to completed games
    this.currentSession.games.push({ ...game });
    this.currentSession.currentGame = null;

    // Update session statistics
    this.updateSessionAggregatedStats();

    console.log('[ExperimentManager] 🏁 Game ended:', game.gameId, 'Reason:', reason, 'Score:', finalScore);
    
    // Save game data to Supabase
    this.saveGameDataToSupabase(game);
    
    // Save session data
    this.saveCurrentSession();

    return game;
  }

  /**
   * Finalize current game without ending it (for cleanup)
   */
  finalizeCurrentGame() {
    if (!this.currentSession || !this.currentSession.currentGame) {
      return;
    }

    const game = this.currentSession.currentGame;
    game.endTime = Date.now();
    game.gameTime = game.endTime - game.startTime;
    game.endReason = 'finalized';

    // Move to completed games
    this.currentSession.games.push({ ...game });
    this.currentSession.currentGame = null;

    console.log('[ExperimentManager] 📋 Game finalized:', game.gameId);
  }

  /**
   * Update aggregated statistics for the session
   */
  updateSessionAggregatedStats() {
    if (!this.currentSession || !this.currentSession.games.length) {
      return;
    }

    const games = this.currentSession.games;
    const stats = this.currentSession.summary.aggregatedStats;

    // Update each metric
    Object.keys(stats).forEach(metric => {
      let values;
      
      if (metric === 'finalScore') {
        values = games.map(game => game.finalScore || 0);
      } else {
        values = games.map(game => game.stats[metric] || 0);
      }

      stats[metric].values = values;
      stats[metric].mean = this.calculateMean(values);
      stats[metric].std = this.calculateStandardDeviation(values);
      stats[metric].max = Math.max(...values);
      stats[metric].min = Math.min(...values);
    });

    // Update session totals
    this.currentSession.summary.totalGamesPlayed = games.length;
    this.currentSession.summary.totalGhostsEaten = games.reduce((sum, game) => sum + (game.stats.ghostsEaten || 0), 0);
    this.currentSession.summary.totalPelletsEaten = games.reduce((sum, game) => sum + (game.stats.pelletsEaten || 0), 0);
    this.currentSession.summary.totalDeaths = games.reduce((sum, game) => sum + (game.stats.deaths || 0), 0);
    this.currentSession.summary.successfulTurns = games.reduce((sum, game) => sum + (game.stats.successfulTurns || 0), 0);
    this.currentSession.summary.totalTurns = games.reduce((sum, game) => sum + (game.stats.totalTurns || 0), 0);
    this.currentSession.summary.gameTime = games.reduce((sum, game) => sum + (game.gameTime || 0), 0);

    console.log('[ExperimentManager] 📊 Updated session aggregated stats');
    
    // Update Supabase with aggregated stats
    this.saveAggregatedStatsToSupabase();
  }

  /**
   * Save individual game data to Supabase
   */
  async saveGameDataToSupabase(gameData) {
    if (!this.useSupabase || !this.supabaseManager || !this.currentSession) {
      return;
    }

    try {
      // Get the current session ID from Supabase
      const sessionData = await this.supabaseManager.getSessionData(
        this.currentSession.userId,
        this.currentSession.sessionId
      );
      
      if (sessionData && sessionData.length > 0) {
        const supabaseSessionId = sessionData[0].id;
        await this.supabaseManager.saveGameData(gameData, supabaseSessionId);
        console.log('[ExperimentManager] ✅ Game data saved to Supabase');
      } else {
        console.warn('[ExperimentManager] ⚠️ Could not find session in Supabase for game data');
      }
    } catch (error) {
      console.error('[ExperimentManager] ❌ Failed to save game data to Supabase:', error);
    }
  }

  /**
   * Save aggregated session statistics to Supabase
   */
  async saveAggregatedStatsToSupabase() {
    if (!this.useSupabase || !this.supabaseManager || !this.currentSession) {
      return;
    }

    try {
      // Get the current session ID from Supabase
      const sessionData = await this.supabaseManager.getSessionData(
        this.currentSession.userId,
        this.currentSession.sessionId
      );
      
      if (sessionData && sessionData.length > 0) {
        const supabaseSessionId = sessionData[0].id;
        await this.supabaseManager.updateSessionAggregatedSummary(
          supabaseSessionId,
          this.currentSession.summary.aggregatedStats,
          this.currentSession.summary.totalGamesPlayed
        );
        console.log('[ExperimentManager] ✅ Aggregated stats saved to Supabase');
      } else {
        console.warn('[ExperimentManager] ⚠️ Could not find session in Supabase for aggregated stats');
      }
    } catch (error) {
      console.error('[ExperimentManager] ❌ Failed to save aggregated stats to Supabase:', error);
    }
  }

  /**
   * Calculate mean of an array of numbers
   */
  calculateMean(values) {
    if (!values || !values.length) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate standard deviation of an array of numbers
   */
  calculateStandardDeviation(values) {
    if (!values || values.length < 2) return 0;
    
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = this.calculateMean(squaredDiffs);
    
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Set up event listeners for game start/end events
   */
  setupGameEventListeners() {
    // Listen for game start events
    window.addEventListener('gameStarted', (event) => {
      console.log('[ExperimentManager] 🎮 Game started event received');
      this.startNewGame();
    });

    // Listen for game end events 
    window.addEventListener('gameEnded', (event) => {
      const { reason, finalScore } = event.detail || {};
      console.log('[ExperimentManager] 🏁 Game ended event received:', reason, 'Score:', finalScore);
      this.endCurrentGame(reason, finalScore);
    });
  }

  /**
   * Get current game statistics
   */
  getCurrentGameStats() {
    if (!this.currentSession || !this.currentSession.currentGame) {
      return null;
    }
    return this.currentSession.currentGame.stats;
  }

  /**
   * Update current game statistics (called by metrics collector)
   */
  updateCurrentGameStats(statName, increment = 1) {
    if (!this.currentSession || !this.currentSession.currentGame) {
      console.warn('[ExperimentManager] Cannot update game stats - no active game');
      return;
    }

    const stats = this.currentSession.currentGame.stats;
    if (stats.hasOwnProperty(statName)) {
      stats[statName] += increment;
      console.log('[ExperimentManager] 📈 Updated game stat:', statName, '=', stats[statName]);
    } else {
      console.warn('[ExperimentManager] Unknown stat name:', statName);
    }
  }

  getDebugInfo() {
    return {
      userId: this.userId,
      currentSession: (this.currentSession && this.currentSession.sessionId) || null,
      completedSessions: this.getCompletedSessionsCount(),
      remainingSessions: this.getRemainingSessionsCount(),
      sessionOrder: this.sessionOrder,
      isExperimentActive: this.isExperimentActive,
      supabaseEnabled: this.useSupabase,
      supabaseInitialized: this.supabaseManager ? this.supabaseManager.isInitialized : false,
    };
  }
}

// removeIf(production)
module.exports = ExperimentManager;
// endRemoveIf(production)
