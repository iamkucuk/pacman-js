class GameCoordinator {
  constructor() {
    console.log('🚀 NEW MULTI-GAME VERSION LOADED - BUILD 2025-01-06-2100 🚀');
    this.gameUi = document.getElementById('game-ui');
    this.rowTop = document.getElementById('row-top');
    this.mazeDiv = document.getElementById('maze');
    this.mazeImg = document.getElementById('maze-img');
    this.mazeCover = document.getElementById('maze-cover');
    this.pointsDisplay = document.getElementById('points-display');
    this.highScoreDisplay = document.getElementById('high-score-display');
    this.extraLivesDisplay = document.getElementById('extra-lives');
    this.fruitDisplay = document.getElementById('fruit-display');
    this.mainMenu = document.getElementById('main-menu-container');
    this.gameStartButton = document.getElementById('game-start');
    this.pauseButton = document.getElementById('pause-button');
    this.soundButton = document.getElementById('sound-button');
    this.leftCover = document.getElementById('left-cover');
    this.rightCover = document.getElementById('right-cover');
    this.pausedText = document.getElementById('paused-text');
    this.bottomRow = document.getElementById('bottom-row');

    this.mazeArray = [
      ['XXXXXXXXXXXXXXXXXXXXXXXXXXXX'],
      ['XooooooooooooXXooooooooooooX'],
      ['XoXXXXoXXXXXoXXoXXXXXoXXXXoX'],
      ['XOXXXXoXXXXXoXXoXXXXXoXXXXOX'],
      ['XoXXXXoXXXXXoXXoXXXXXoXXXXoX'],
      ['XooooooooooooooooooooooooooX'],
      ['XoXXXXoXXoXXXXXXXXoXXoXXXXoX'],
      ['XoXXXXoXXoXXXXXXXXoXXoXXXXoX'],
      ['XooooooXXooooXXooooXXooooooX'],
      ['XXXXXXoXXXXX XX XXXXXoXXXXXX'],
      ['XXXXXXoXXXXX XX XXXXXoXXXXXX'],
      ['XXXXXXoXX          XXoXXXXXX'],
      ['XXXXXXoXX XXXXXXXX XXoXXXXXX'],
      ['XXXXXXoXX X      X XXoXXXXXX'],
      ['      o   X      X   o      '],
      ['XXXXXXoXX X      X XXoXXXXXX'],
      ['XXXXXXoXX XXXXXXXX XXoXXXXXX'],
      ['XXXXXXoXX          XXoXXXXXX'],
      ['XXXXXXoXX XXXXXXXX XXoXXXXXX'],
      ['XXXXXXoXX XXXXXXXX XXoXXXXXX'],
      ['XooooooooooooXXooooooooooooX'],
      ['XoXXXXoXXXXXoXXoXXXXXoXXXXoX'],
      ['XoXXXXoXXXXXoXXoXXXXXoXXXXoX'],
      ['XOooXXooooooo  oooooooXXooOX'],
      ['XXXoXXoXXoXXXXXXXXoXXoXXoXXX'],
      ['XXXoXXoXXoXXXXXXXXoXXoXXoXXX'],
      ['XooooooXXooooXXooooXXooooooX'],
      ['XoXXXXXXXXXXoXXoXXXXXXXXXXoX'],
      ['XoXXXXXXXXXXoXXoXXXXXXXXXXoX'],
      ['XooooooooooooooooooooooooooX'],
      ['XXXXXXXXXXXXXXXXXXXXXXXXXXXX'],
    ];

    this.maxFps = 120;
    this.tileSize = 8;
    this.scale = this.determineScale(1);
    this.scaledTileSize = this.tileSize * this.scale;
    this.firstGame = true;

    this.movementKeys = {
      // WASD
      87: 'up',
      83: 'down',
      65: 'left',
      68: 'right',

      // Arrow Keys
      38: 'up',
      40: 'down',
      37: 'left',
      39: 'right',
    };

    // Mobile touch trackers
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;

    this.fruitPoints = {
      1: 100,
      2: 300,
      3: 500,
      4: 700,
      5: 1000,
      6: 2000,
      7: 3000,
      8: 5000,
    };

    this.mazeArray.forEach((row, rowIndex) => {
      this.mazeArray[rowIndex] = row[0].split('');
    });

    // Main user ID flow event listeners
    this.setupUserIdFlow();

    this.gameStartButton.addEventListener(
      'click',
      this.startButtonClick.bind(this),
    );
    this.pauseButton.addEventListener('click', this.handlePauseKey.bind(this));
    this.soundButton.addEventListener(
      'click',
      this.soundButtonClick.bind(this),
    );

    const head = document.getElementsByTagName('head')[0];
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'build/app.css';

    link.onload = this.preloadAssets.bind(this);

    head.appendChild(link);

    // Initialize experiment system
    this.initializeExperiment();
  }

  setupUserIdFlow() {
    const confirmUserIdBtn = document.getElementById('confirm-user-id');
    const userIdInput = document.getElementById('main-user-id-input');
    const userIdError = document.getElementById('user-id-error');

    if (confirmUserIdBtn && userIdInput) {
      confirmUserIdBtn.addEventListener('click', () => this.handleUserIdConfirmation());

      userIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleUserIdConfirmation();
        }
      });

      userIdInput.addEventListener('input', () => {
        // Clear error when user starts typing
        if (userIdError) {
          userIdError.textContent = '';
        }
      });

      // Check for auto-resume after End Session
      const autoResumeUserId = localStorage.getItem('autoResumeUserId');
      if (autoResumeUserId) {
        console.log('[GameCoordinator] Auto-resuming with user ID:', autoResumeUserId);

        // Remove the flag so it doesn't auto-resume again
        localStorage.removeItem('autoResumeUserId');

        // Fill in the user ID and trigger confirmation automatically
        userIdInput.value = autoResumeUserId;

        // Trigger confirmation after a brief delay to ensure UI is ready
        setTimeout(() => {
          this.handleUserIdConfirmation();
        }, 100);
      }
    }

    // Setup session management button event listeners
    this.setupSessionManagementButtons();
  }

  setupSessionManagementButtons() {
    const resetBtn = document.getElementById('main-reset-experiment-btn');
    const deleteLastBtn = document.getElementById('main-delete-last-session-btn');
    const exportBtn = document.getElementById('main-export-data-btn');

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (this.experimentUI) {
          this.experimentUI.handleResetExperiment();
        }
      });
    }

    if (deleteLastBtn) {
      deleteLastBtn.addEventListener('click', () => {
        if (this.experimentUI) {
          this.experimentUI.handleDeleteLastSession();
        }
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        if (this.experimentUI) {
          this.experimentUI.handleExportData();
        }
      });
    }
  }

  async handleUserIdConfirmation() {
    const userIdInput = document.getElementById('main-user-id-input');
    const userIdError = document.getElementById('user-id-error');
    const userIdSection = document.getElementById('user-id-section');
    const sessionInfoSection = document.getElementById('session-info-section');

    if (!userIdInput || !userIdError || !userIdSection || !sessionInfoSection) {
      console.error('[GameCoordinator] Required UI elements not found');
      return;
    }

    try {
      const userId = userIdInput.value.trim();
      if (!userId) {
        throw new Error('Please enter a User ID');
      }

      // Initialize experiment with the user ID
      if (!this.experimentManager) {
        console.error('[GameCoordinator] Experiment manager not initialized');
        throw new Error('System not ready. Please refresh the page.');
      }

      await this.experimentManager.initializeUser(userId);

      // Check if user has completed all sessions
      const completedSessions = this.experimentManager.getCompletedSessionsCount();
      if (completedSessions >= this.experimentManager.SESSION_CONFIGS.length) {
        // Show experiment complete message
        this.showExperimentCompleteMessage();
        return;
      }

      // Get next session info WITHOUT creating the session yet
      const sessionInfo = this.experimentManager.getNextSessionInfo();

      // Update display elements
      this.updateSessionDisplay(sessionInfo);

      // Hide user ID section and show session info
      userIdSection.style.display = 'none';
      sessionInfoSection.style.display = 'block';

      // Show the PLAY button
      const gameStartButton = document.getElementById('game-start');
      if (gameStartButton) {
        gameStartButton.style.display = 'block';
      }

      // Show session management buttons
      const sessionManagement = document.getElementById('session-management');
      if (sessionManagement) {
        sessionManagement.style.display = 'block';
      }

      // Clear any errors
      userIdError.textContent = '';

      // Don't dispatch experimentSessionStarted yet - wait until PLAY is clicked

      console.log('[GameCoordinator] User ID confirmed, ready for session:', sessionInfo.sessionId);
    } catch (error) {
      console.error('[GameCoordinator] Error confirming user ID:', error);
      userIdError.textContent = error.message;
    }
  }

  updateSessionDisplay(session) {
    const displayUserId = document.getElementById('display-user-id');

    if (displayUserId) {
      displayUserId.textContent = session.userId;
    }

    // Session ID and speed config are now only shown in debug screen
    // No need to populate main menu elements
  }

  showExperimentCompleteMessage() {
    const userIdSection = document.getElementById('user-id-section');
    const sessionInfoSection = document.getElementById('session-info-section');

    if (userIdSection) {
      userIdSection.innerHTML = `
        <h3 class='experiment-title'>🎉 Experiment Complete! 🎉</h3>
        <p class='experiment-description'>User "${this.experimentManager.userId}" has completed all ${this.experimentManager.SESSION_CONFIGS.length} sessions.</p>
        <p class='experiment-description'>Thank you for participating in our research!</p>
        <div style="margin-top: 20px;">
          <button id="export-final-data" class="confirm-user-id-btn">Export Data</button>
          <button id="start-new-experiment" class="confirm-user-id-btn" style="margin-left: 10px;">New Experiment</button>
        </div>
      `;

      // Bind new button events
      const exportBtn = document.getElementById('export-final-data');
      const newExpBtn = document.getElementById('start-new-experiment');

      if (exportBtn) {
        exportBtn.addEventListener('click', () => {
          if (this.exportManager) {
            this.exportManager.exportData('json');
          }
        });
      }

      if (newExpBtn) {
        newExpBtn.addEventListener('click', () => {
          this.resetForNewExperiment();
          location.reload(); // Refresh page for clean state
        });
      }
    }

    if (sessionInfoSection) {
      sessionInfoSection.style.display = 'none';
    }
  }

  async handleResetExperiment() {
    try {
      // Show confirmation dialog
      const confirmed = confirm(
        '⚠️ Are you sure you want to reset the experiment?\n\n'
        + 'This will:\n'
        + '• Delete ALL session data\n'
        + '• Clear the user ID\n'
        + '• Remove data from both local storage and cloud database\n'
        + '• Start completely over\n\n'
        + 'This action cannot be undone!',
      );

      if (!confirmed) {
        console.log('[GameCoordinator] Reset cancelled by user');
        return;
      }

      console.log('[GameCoordinator] 🔄 Starting experiment reset...');

      // Reset experiment data
      if (this.experimentManager) {
        const resetSuccess = await this.experimentManager.resetExperiment();
        if (!resetSuccess) {
          throw new Error('Failed to reset experiment data');
        }
      }

      // Reset UI state to initial user ID input
      this.resetUIToInitialState();

      console.log('[GameCoordinator] ✅ Experiment reset completed successfully');
    } catch (error) {
      console.error('[GameCoordinator] ❌ Error during experiment reset:', error);
      alert(`Error resetting experiment: ${error.message}`);
    }
  }

  resetUIToInitialState() {
    try {
      console.log('[GameCoordinator] 🔄 Starting UI reset to initial state...');

      // First, completely remove any experiment UI interfaces
      const experimentInterface = document.getElementById('experiment-interface');
      if (experimentInterface) {
        console.log('[GameCoordinator] 🗑️ Removing experiment interface');
        experimentInterface.remove();
      }

      // Stop any running game components
      if (this.gameEngine && this.gameEngine.running) {
        console.log('[GameCoordinator] ⏹️ Stopping game engine');
        this.gameEngine.stop();
      }

      // Hide the game UI and show main menu
      const gameUI = document.getElementById('game-ui');
      const mainMenu = document.getElementById('main-menu-container');

      if (gameUI) {
        gameUI.style.display = 'none';
        console.log('[GameCoordinator] 🫥 Hidden game UI');
      }

      if (mainMenu) {
        mainMenu.style.display = 'flex';
        console.log('[GameCoordinator] 👁️ Shown main menu');
      }

      // Get UI elements
      const userIdSection = document.getElementById('user-id-section');
      const sessionInfoSection = document.getElementById('session-info-section');
      const gameStartButton = document.getElementById('game-start');

      // Reset user ID section to initial state
      if (userIdSection) {
        userIdSection.innerHTML = `
          <h3 class='experiment-title'>Pac-Man Speed Research Study</h3>
          <p class='experiment-description'>Help us understand how speed affects gameplay</p>
          <div class='user-id-input-container'>
            <label for='main-user-id-input' class='user-id-label'>Enter your User ID:</label>
            <input type='text' id='main-user-id-input' class='user-id-input' placeholder='Enter unique identifier' />
            <button id='confirm-user-id' class='confirm-user-id-btn'>Continue</button>
          </div>
          <div id='user-id-error' class='user-id-error'></div>
        `;
        userIdSection.style.display = 'block';
        console.log('[GameCoordinator] ✅ Reset user ID section');
      }

      // Hide session info section
      if (sessionInfoSection) {
        sessionInfoSection.style.display = 'none';
        console.log('[GameCoordinator] 🫥 Hidden session info section');
      }

      // Hide game start button
      if (gameStartButton) {
        gameStartButton.style.display = 'none';
        console.log('[GameCoordinator] 🫥 Hidden game start button');
      }

      // Re-setup user ID flow event listeners
      this.setupUserIdFlow();

      // Reset game state flags for fresh initialization
      this.firstGame = true;
      console.log('[GameCoordinator] 🔄 Reset firstGame flag to true');

      // Reinitialize experiment system to ensure clean state
      if (this.experimentManager) {
        // Clear references to old experiment manager
        this.experimentManager = null;
        this.sessionManager = null;
        this.progressController = null;
        this.dataManager = null;
        this.exportManager = null;
        this.visualizationDashboard = null;
        this.experimentUI = null;
        this.speedController = null;
        this.metricsCollector = null;
        console.log('[GameCoordinator] 🧹 Cleared experiment references');
      }

      // Reinitialize experiment system after short delay
      setTimeout(() => {
        this.initializeExperiment();
        console.log('[GameCoordinator] 🔄 Reinitialized experiment system');
      }, 100);

      console.log('[GameCoordinator] ✅ UI reset to initial state completed');
    } catch (error) {
      console.error('[GameCoordinator] ❌ Error during UI reset:', error);
      // Fallback: reload page
      console.log('[GameCoordinator] 🔄 UI reset failed, reloading page...');
      window.location.reload();
    }
  }

  initializeExperiment() {
    this.experimentManager = new ExperimentManager();
    this.sessionManager = new SessionManager(this.experimentManager);
    this.progressController = new ProgressController(this.experimentManager, this.sessionManager);
    this.dataManager = new DataManager(this.experimentManager, this.sessionManager);
    this.exportManager = new ExportManager(this.experimentManager, this.sessionManager, this.dataManager);
    this.visualizationDashboard = new VisualizationDashboard(this.experimentManager, this.sessionManager, this.exportManager);
    this.experimentUI = new ExperimentUI(this.experimentManager);
    this.speedController = new SpeedController();
    this.metricsCollector = new MetricsCollector(this.experimentManager);

    // Initialize SpeedController immediately if entities already exist
    if (this.pacman && this.ghosts) {
      console.log('[GameCoordinator] 🚀 Entities already exist, initializing SpeedController immediately');
      this.speedController.initialize(this);
    }

    // Set cross-references
    this.experimentManager.sessionManager = this.sessionManager;
    this.experimentManager.progressController = this.progressController;
    this.experimentManager.dataManager = this.dataManager;
    this.experimentManager.exportManager = this.exportManager;
    this.experimentManager.visualizationDashboard = this.visualizationDashboard;

    this.sessionManager.initialize();
    this.progressController.initialize();
    this.dataManager.initialize();
    this.exportManager.initialize();
    this.visualizationDashboard.initialize();
    this.experimentUI.initialize();
    this.bindExperimentEvents();
  }

  bindExperimentEvents() {
    window.addEventListener('experimentSessionStarted', () => {
      if (this.metricsCollector && !this.metricsCollector.isInitialized) {
        this.metricsCollector.initialize(this);
      }
      if (this.experimentUI && this.metricsCollector) {
        this.experimentUI.setMetricsCollector(this.metricsCollector);
      }

      window.gameCoordinator = this;

      // Expose debug functions globally
      window.debugSpeeds = () => this.speedController.debugCurrentSpeeds();
      window.testSpeeds = () => {
        console.log('🧪 MANUAL SPEED TEST - Applying slow pacman, fast ghosts');
        this.speedController.applySpeedConfiguration({
          pacmanMultiplier: 0.3,
          ghostMultiplier: 3.0,
          config: { pacman: 'slow', ghost: 'fast' },
        });
      };

      console.log('[GameCoordinator] 📡 Experiment session started, SpeedController will initialize when game entities are ready');
    });
  }

  /**
   * Recursive method which determines the largest possible scale the game's graphics can use
   * @param {Number} scale
   */
  determineScale(scale) {
    const availableScreenHeight = Math.min(
      document.documentElement.clientHeight,
      window.innerHeight || 0,
    );
    const availableScreenWidth = Math.min(
      document.documentElement.clientWidth,
      window.innerWidth || 0,
    );
    const scaledTileSize = this.tileSize * scale;

    // The original Pac-Man game leaves 5 tiles of height (3 above, 2 below) surrounding the
    // maze for the UI. See app\style\graphics\spriteSheets\references\mazeGridSystemReference.png
    // for reference.
    const mazeTileHeight = this.mazeArray.length + 5;
    const mazeTileWidth = this.mazeArray[0][0].split('').length;

    if (
      scaledTileSize * mazeTileHeight < availableScreenHeight
      && scaledTileSize * mazeTileWidth < availableScreenWidth
    ) {
      return this.determineScale(scale + 1);
    }

    return scale - 1;
  }

  /**
   * Reveals the game underneath the loading covers and starts gameplay
   */
  async startButtonClick() {
    // Check if experiment is properly initialized
    if (!this.experimentManager.userId) {
      console.warn('[GameCoordinator] Cannot start game - no user ID set');
      alert('Please enter a User ID and start an experiment session first.');
      return;
    }

    // Start the session if not already active (this creates the Supabase entry)
    if (!this.experimentManager.isExperimentActive) {
      try {
        console.log('[GameCoordinator] Starting experiment session...');
        const session = await this.experimentManager.startSession();
        console.log('[GameCoordinator] Session started:', session.sessionId);
      } catch (error) {
        console.error('[GameCoordinator] Failed to start session:', error);
        alert(`Failed to start session: ${error.message}`);
        return;
      }
    }

    // Always dispatch experiment session started event when game starts
    window.dispatchEvent(new CustomEvent('experimentSessionStarted', {
      detail: {
        sessionId: this.experimentManager.currentSession ? this.experimentManager.currentSession.sessionId : null,
        speedConfig: this.experimentManager.currentSession ? this.experimentManager.currentSession.speedConfig : null,
        completedSessions: this.experimentManager.getCompletedSessionsCount() - 1,
      },
    }));

    // Hide session management buttons during gameplay
    const sessionManagement = document.getElementById('session-management');
    if (sessionManagement) {
      sessionManagement.style.display = 'none';
    }

    this.leftCover.style.left = '-50%';
    this.rightCover.style.right = '-50%';
    this.mainMenu.style.opacity = 0;
    this.gameStartButton.disabled = true;

    setTimeout(() => {
      this.mainMenu.style.visibility = 'hidden';
    }, 1000);

    this.reset();
    if (this.firstGame) {
      this.firstGame = false;
      this.init();
    }
    this.startGameplay(true);

    // Dispatch game started event for experiment tracking
    window.dispatchEvent(new CustomEvent('gameStarted', {
      detail: {
        sessionId: (this.experimentManager.currentSession && this.experimentManager.currentSession.sessionId) ? this.experimentManager.currentSession.sessionId : null,
        speedConfig: (this.experimentManager.currentSession && this.experimentManager.currentSession.speedConfig) ? this.experimentManager.currentSession.speedConfig : null,
        timestamp: Date.now(),
      },
    }));
  }

  /**
   * Toggles the master volume for the soundManager, and saves the preference to storage
   */
  soundButtonClick() {
    const newVolume = this.soundManager.masterVolume === 1 ? 0 : 1;
    this.soundManager.setMasterVolume(newVolume);
    localStorage.setItem('volumePreference', newVolume);
    this.setSoundButtonIcon(newVolume);
  }

  /**
   * Sets the icon for the sound button
   */
  setSoundButtonIcon(newVolume) {
    this.soundButton.innerHTML = newVolume === 0 ? 'volume_off' : 'volume_up';
  }

  /**
   * Displays an error message in the event assets are unable to download
   */
  displayErrorMessage() {
    const loadingContainer = document.getElementById('loading-container');
    const errorMessage = document.getElementById('error-message');
    loadingContainer.style.opacity = 0;
    setTimeout(() => {
      loadingContainer.remove();
      errorMessage.style.opacity = 1;
      errorMessage.style.visibility = 'visible';
    }, 1500);
  }

  /**
   * Load all assets into a hidden Div to pre-load them into memory.
   * There is probably a better way to read all of these file names.
   */
  preloadAssets() {
    return new Promise((resolve) => {
      const loadingContainer = document.getElementById('loading-container');
      const loadingPacman = document.getElementById('loading-pacman');
      const loadingDotMask = document.getElementById('loading-dot-mask');

      const imgBase = 'app/style/graphics/spriteSheets/';
      const imgSources = [
        // Pacman
        `${imgBase}characters/pacman/arrow_down.svg`,
        `${imgBase}characters/pacman/arrow_left.svg`,
        `${imgBase}characters/pacman/arrow_right.svg`,
        `${imgBase}characters/pacman/arrow_up.svg`,
        `${imgBase}characters/pacman/pacman_death.svg`,
        `${imgBase}characters/pacman/pacman_error.svg`,
        `${imgBase}characters/pacman/pacman_down.svg`,
        `${imgBase}characters/pacman/pacman_left.svg`,
        `${imgBase}characters/pacman/pacman_right.svg`,
        `${imgBase}characters/pacman/pacman_up.svg`,

        // Blinky
        `${imgBase}characters/ghosts/blinky/blinky_down_angry.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_down_annoyed.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_down.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_left_angry.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_left_annoyed.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_left.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_right_angry.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_right_annoyed.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_right.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_up_angry.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_up_annoyed.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_up.svg`,

        // Clyde
        `${imgBase}characters/ghosts/clyde/clyde_down.svg`,
        `${imgBase}characters/ghosts/clyde/clyde_left.svg`,
        `${imgBase}characters/ghosts/clyde/clyde_right.svg`,
        `${imgBase}characters/ghosts/clyde/clyde_up.svg`,

        // Inky
        `${imgBase}characters/ghosts/inky/inky_down.svg`,
        `${imgBase}characters/ghosts/inky/inky_left.svg`,
        `${imgBase}characters/ghosts/inky/inky_right.svg`,
        `${imgBase}characters/ghosts/inky/inky_up.svg`,

        // Pinky
        `${imgBase}characters/ghosts/pinky/pinky_down.svg`,
        `${imgBase}characters/ghosts/pinky/pinky_left.svg`,
        `${imgBase}characters/ghosts/pinky/pinky_right.svg`,
        `${imgBase}characters/ghosts/pinky/pinky_up.svg`,

        // Ghosts Common
        `${imgBase}characters/ghosts/eyes_down.svg`,
        `${imgBase}characters/ghosts/eyes_left.svg`,
        `${imgBase}characters/ghosts/eyes_right.svg`,
        `${imgBase}characters/ghosts/eyes_up.svg`,
        `${imgBase}characters/ghosts/scared_blue.svg`,
        `${imgBase}characters/ghosts/scared_white.svg`,

        // Dots
        `${imgBase}pickups/pacdot.svg`,
        `${imgBase}pickups/powerPellet.svg`,

        // Fruit
        `${imgBase}pickups/apple.svg`,
        `${imgBase}pickups/bell.svg`,
        `${imgBase}pickups/cherry.svg`,
        `${imgBase}pickups/galaxian.svg`,
        `${imgBase}pickups/key.svg`,
        `${imgBase}pickups/melon.svg`,
        `${imgBase}pickups/orange.svg`,
        `${imgBase}pickups/strawberry.svg`,

        // Text
        `${imgBase}text/ready.svg`,

        // Points
        `${imgBase}text/100.svg`,
        `${imgBase}text/200.svg`,
        `${imgBase}text/300.svg`,
        `${imgBase}text/400.svg`,
        `${imgBase}text/500.svg`,
        `${imgBase}text/700.svg`,
        `${imgBase}text/800.svg`,
        `${imgBase}text/1000.svg`,
        `${imgBase}text/1600.svg`,
        `${imgBase}text/2000.svg`,
        `${imgBase}text/3000.svg`,
        `${imgBase}text/5000.svg`,

        // Maze
        `${imgBase}maze/maze_blue.svg`,

        // Misc
        'app/style/graphics/extra_life.svg',
      ];

      const audioBase = 'app/style/audio/';
      const audioSources = [
        `${audioBase}game_start.mp3`,
        `${audioBase}pause.mp3`,
        `${audioBase}pause_beat.mp3`,
        `${audioBase}siren_1.mp3`,
        `${audioBase}siren_2.mp3`,
        `${audioBase}siren_3.mp3`,
        `${audioBase}power_up.mp3`,
        `${audioBase}extra_life.mp3`,
        `${audioBase}eyes.mp3`,
        `${audioBase}eat_ghost.mp3`,
        `${audioBase}death.mp3`,
        `${audioBase}fruit.mp3`,
        `${audioBase}dot_1.mp3`,
        `${audioBase}dot_2.mp3`,
      ];

      const totalSources = imgSources.length + audioSources.length;
      this.remainingSources = totalSources;

      loadingPacman.style.left = '0';
      loadingDotMask.style.width = '0';

      Promise.all([
        this.createElements(imgSources, 'img', totalSources, this),
        this.createElements(audioSources, 'audio', totalSources, this),
      ])
        .then(() => {
          loadingContainer.style.opacity = 0;
          resolve();

          setTimeout(() => {
            loadingContainer.remove();
            this.mainMenu.style.opacity = 1;
            this.mainMenu.style.visibility = 'visible';
          }, 1500);
        })
        .catch(this.displayErrorMessage);
    });
  }

  /**
   * Iterates through a list of sources and updates the loading bar as the assets load in
   * @param {String[]} sources
   * @param {('img'|'audio')} type
   * @param {Number} totalSources
   * @param {Object} gameCoord
   * @returns {Promise}
   */
  createElements(sources, type, totalSources, gameCoord) {
    const loadingContainer = document.getElementById('loading-container');
    const preloadDiv = document.getElementById('preload-div');
    const loadingPacman = document.getElementById('loading-pacman');
    const containerWidth = loadingContainer.scrollWidth
      - loadingPacman.scrollWidth;
    const loadingDotMask = document.getElementById('loading-dot-mask');

    const gameCoordRef = gameCoord;

    return new Promise((resolve, reject) => {
      let loadedSources = 0;

      sources.forEach((source) => {
        const element = type === 'img' ? new Image() : new Audio();
        preloadDiv.appendChild(element);

        const elementReady = () => {
          gameCoordRef.remainingSources -= 1;
          loadedSources += 1;
          const percent = 1 - gameCoordRef.remainingSources / totalSources;
          loadingPacman.style.left = `${percent * containerWidth}px`;
          loadingDotMask.style.width = loadingPacman.style.left;

          if (loadedSources === sources.length) {
            resolve();
          }
        };

        if (type === 'img') {
          element.onload = elementReady;
          element.onerror = reject;
        } else {
          element.addEventListener('canplaythrough', elementReady);
          element.onerror = reject;
        }

        element.src = source;

        if (type === 'audio') {
          element.load();
        }
      });
    });
  }

  /**
   * Resets gameCoordinator values to their default states
   */
  reset() {
    this.activeTimers = [];
    this.points = 0;
    this.level = 1;
    this.lives = 2;
    this.extraLifeGiven = false;
    this.remainingDots = 0;
    this.allowKeyPresses = true;
    this.allowPacmanMovement = false;
    this.allowPause = false;
    this.cutscene = true;
    this.highScore = localStorage.getItem('highScore');

    if (this.firstGame) {
      setInterval(() => {
        this.collisionDetectionLoop();
      }, 500);

      this.pacman = new Pacman(
        this.scaledTileSize,
        this.mazeArray,
        new CharacterUtil(this.scaledTileSize),
      );
      this.blinky = new Ghost(
        this.scaledTileSize,
        this.mazeArray,
        this.pacman,
        'blinky',
        this.level,
        new CharacterUtil(this.scaledTileSize),
      );
      this.pinky = new Ghost(
        this.scaledTileSize,
        this.mazeArray,
        this.pacman,
        'pinky',
        this.level,
        new CharacterUtil(this.scaledTileSize),
      );
      this.inky = new Ghost(
        this.scaledTileSize,
        this.mazeArray,
        this.pacman,
        'inky',
        this.level,
        new CharacterUtil(this.scaledTileSize),
        this.blinky,
      );
      this.clyde = new Ghost(
        this.scaledTileSize,
        this.mazeArray,
        this.pacman,
        'clyde',
        this.level,
        new CharacterUtil(this.scaledTileSize),
      );
      this.fruit = new Pickup(
        'fruit',
        this.scaledTileSize,
        13.5,
        17,
        this.pacman,
        this.mazeDiv,
        100,
      );
    }

    this.entityList = [
      this.pacman,
      this.blinky,
      this.pinky,
      this.inky,
      this.clyde,
      this.fruit,
    ];

    this.ghosts = [this.blinky, this.pinky, this.inky, this.clyde];

    this.scaredGhosts = [];
    this.eyeGhosts = 0;

    // Notify that game entities are ready
    console.log('[GameCoordinator] 🎮 Game entities created! Notifying SpeedController...');
    if (this.speedController && !this.speedController.isInitialized) {
      console.log('[GameCoordinator] 🚀 Initializing SpeedController NOW with ready entities');
      this.speedController.initialize(this);
    } else if (this.speedController && this.speedController.isInitialized) {
      console.log('[GameCoordinator] 🔄 Entities recreated, storing original speeds');
      this.speedController.storeOriginalSpeeds();
    }

    if (this.firstGame) {
      this.drawMaze(this.mazeArray, this.entityList);
      this.soundManager = new SoundManager();
      this.setUiDimensions();
    } else {
      this.pacman.reset();
      this.ghosts.forEach((ghost) => {
        ghost.reset(true);
      });
      this.pickups.forEach((pickup) => {
        if (pickup.type !== 'fruit') {
          this.remainingDots += 1;
          pickup.reset();
          this.entityList.push(pickup);
        }
      });
    }

    this.pointsDisplay.innerHTML = '00';
    this.highScoreDisplay.innerHTML = this.highScore || '00';
    this.clearDisplay(this.fruitDisplay);

    const volumePreference = parseInt(
      localStorage.getItem('volumePreference') || 1,
      10,
    );
    this.setSoundButtonIcon(volumePreference);
    this.soundManager.setMasterVolume(volumePreference);
  }

  /**
   * Calls necessary setup functions to start the game
   */
  init() {
    this.registerEventListeners();
    this.registerTouchListeners();

    this.gameEngine = new GameEngine(this.maxFps, this.entityList);
    this.gameEngine.start();
  }

  /**
   * Adds HTML elements to draw on the webpage by iterating through the 2D maze array
   * @param {Array} mazeArray - 2D array representing the game board
   * @param {Array} entityList - List of entities to be used throughout the game
   */
  drawMaze(mazeArray, entityList) {
    this.pickups = [this.fruit];

    this.mazeDiv.style.height = `${this.scaledTileSize * 31}px`;
    this.mazeDiv.style.width = `${this.scaledTileSize * 28}px`;
    this.gameUi.style.width = `${this.scaledTileSize * 28}px`;
    this.bottomRow.style.minHeight = `${this.scaledTileSize * 2}px`;
    this.dotContainer = document.getElementById('dot-container');

    mazeArray.forEach((row, rowIndex) => {
      row.forEach((block, columnIndex) => {
        if (block === 'o' || block === 'O') {
          const type = block === 'o' ? 'pacdot' : 'powerPellet';
          const points = block === 'o' ? 10 : 50;
          const dot = new Pickup(
            type,
            this.scaledTileSize,
            columnIndex,
            rowIndex,
            this.pacman,
            this.dotContainer,
            points,
          );

          entityList.push(dot);
          this.pickups.push(dot);
          this.remainingDots += 1;
        }
      });
    });
  }

  setUiDimensions() {
    this.gameUi.style.fontSize = `${this.scaledTileSize}px`;
    this.rowTop.style.marginBottom = `${this.scaledTileSize}px`;
  }

  /**
   * Loop which periodically checks which pickups are nearby Pacman.
   * Pickups which are far away will not be considered for collision detection.
   */
  collisionDetectionLoop() {
    if (this.pacman.position) {
      const maxDistance = this.pacman.velocityPerMs * 750;
      const pacmanCenter = {
        x: this.pacman.position.left + this.scaledTileSize,
        y: this.pacman.position.top + this.scaledTileSize,
      };

      // Set this flag to TRUE to see how two-phase collision detection works!
      const debugging = false;

      this.pickups.forEach((pickup) => {
        pickup.checkPacmanProximity(maxDistance, pacmanCenter, debugging);
      });
    }
  }

  /**
   * Displays "Ready!" and allows Pacman to move after a brief delay
   * @param {Boolean} initialStart - Special condition for the game's beginning
   */
  startGameplay(initialStart) {
    if (initialStart) {
      this.soundManager.play('game_start');
    }

    this.scaredGhosts = [];
    this.eyeGhosts = 0;
    this.allowPacmanMovement = false;

    const left = this.scaledTileSize * 11;
    const top = this.scaledTileSize * 16.5;
    const duration = initialStart ? 4500 : 2000;
    const width = this.scaledTileSize * 6;
    const height = this.scaledTileSize * 2;

    this.displayText({ left, top }, 'ready', duration, width, height);
    this.updateExtraLivesDisplay();

    new Timer(() => {
      this.allowPause = true;
      this.cutscene = false;
      this.soundManager.setCutscene(this.cutscene);
      this.soundManager.setAmbience(this.determineSiren(this.remainingDots));

      this.allowPacmanMovement = true;
      this.pacman.moving = true;

      // Start the gameplay timer when player can actually move
      if (this.experimentManager && this.experimentManager.isExperimentActive) {
        this.experimentManager.startGameplayTimer();
      }

      this.ghosts.forEach((ghost) => {
        const ghostRef = ghost;
        ghostRef.moving = true;
      });

      this.ghostCycle('scatter');

      this.idleGhosts = [this.pinky, this.inky, this.clyde];
      this.releaseGhost();
    }, duration);
  }

  /**
   * Clears out all children nodes from a given display element
   * @param {String} display
   */
  clearDisplay(display) {
    while (display.firstChild) {
      display.removeChild(display.firstChild);
    }
  }

  /**
   * Displays extra life images equal to the number of remaining lives
   */
  updateExtraLivesDisplay() {
    this.clearDisplay(this.extraLivesDisplay);

    for (let i = 0; i < this.lives; i += 1) {
      const extraLifePic = document.createElement('img');
      extraLifePic.setAttribute('src', 'app/style/graphics/extra_life.svg');
      extraLifePic.style.height = `${this.scaledTileSize * 2}px`;
      this.extraLivesDisplay.appendChild(extraLifePic);
    }
  }

  /**
   * Displays a rolling log of the seven most-recently eaten fruit
   * @param {String} rawImageSource
   */
  updateFruitDisplay(rawImageSource) {
    const parsedSource = rawImageSource.slice(
      rawImageSource.indexOf('(') + 1,
      rawImageSource.indexOf(')'),
    );

    if (this.fruitDisplay.children.length === 7) {
      this.fruitDisplay.removeChild(this.fruitDisplay.firstChild);
    }

    const fruitPic = document.createElement('img');
    fruitPic.setAttribute('src', parsedSource);
    fruitPic.style.height = `${this.scaledTileSize * 2}px`;
    this.fruitDisplay.appendChild(fruitPic);
  }

  /**
   * Cycles the ghosts between 'chase' and 'scatter' mode
   * @param {('chase'|'scatter')} mode
   */
  ghostCycle(mode) {
    const delay = mode === 'scatter' ? 7000 : 20000;
    const nextMode = mode === 'scatter' ? 'chase' : 'scatter';

    this.ghostCycleTimer = new Timer(() => {
      this.ghosts.forEach((ghost) => {
        ghost.changeMode(nextMode);
      });

      this.ghostCycle(nextMode);
    }, delay);
  }

  /**
   * Releases a ghost from the Ghost House after a delay
   */
  releaseGhost() {
    if (this.idleGhosts.length > 0) {
      const delay = Math.max((8 - (this.level - 1) * 4) * 1000, 0);

      this.endIdleTimer = new Timer(() => {
        this.idleGhosts[0].endIdleMode();
        this.idleGhosts.shift();
      }, delay);
    }
  }

  /**
   * Register listeners for various game sequences
   */
  registerEventListeners() {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('swipe', this.handleSwipe.bind(this));
    window.addEventListener('awardPoints', this.awardPoints.bind(this));
    window.addEventListener('deathSequence', this.deathSequence.bind(this));
    window.addEventListener('dotEaten', this.dotEaten.bind(this));
    window.addEventListener('powerUp', this.powerUp.bind(this));
    window.addEventListener('eatGhost', this.eatGhost.bind(this));
    window.addEventListener('restoreGhost', this.restoreGhost.bind(this));
    window.addEventListener('addTimer', this.addTimer.bind(this));
    window.addEventListener('removeTimer', this.removeTimer.bind(this));
    window.addEventListener('releaseGhost', this.releaseGhost.bind(this));
  }

  /**
   * Register listeners for touchstart and touchend to handle mobile device swipes
   */
  registerTouchListeners() {
    document.addEventListener('touchstart', this.handleTouchStart.bind(this));
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  /**
   * Sets touch values where the user's touch begins
   * @param {Event} event
   */
  handleTouchStart(event) {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  /**
   * Sets touch values where the user's touch ends and attempts to change Pac-Man's direction
   * @param {*} event
   */
  handleTouchEnd(event) {
    this.touchEndX = event.changedTouches[0].clientX;
    this.touchEndY = event.changedTouches[0].clientY;
    const diffX = this.touchEndX - this.touchStartX;
    const diffY = this.touchEndY - this.touchStartY;
    let direction;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      direction = diffX > 0 ? 'right' : 'left';
    } else {
      direction = diffY > 0 ? 'down' : 'up';
    }

    window.dispatchEvent(new CustomEvent('swipe', {
      detail: {
        direction,
      },
    }));
  }

  /**
   * Calls Pacman's changeDirection event if certain conditions are met
   * @param {({'up'|'down'|'left'|'right'})} direction
   */
  changeDirection(direction) {
    if (this.allowKeyPresses && this.gameEngine.running) {
      this.pacman.changeDirection(direction, this.allowPacmanMovement);
    }
  }

  /**
   * Calls various class functions depending upon the pressed key
   * @param {Event} e - The keydown event to evaluate
   */
  handleKeyDown(e) {
    if (e.keyCode === 27) {
      // ESC key
      this.handlePauseKey();
    } else if (e.keyCode === 81) {
      // Q
      this.soundButtonClick();
    } else if (this.movementKeys[e.keyCode]) {
      this.changeDirection(this.movementKeys[e.keyCode]);
    }
  }

  /**
   * Calls changeDirection with the direction of the user's swipe
   * @param {Event} e - The direction of the swipe
   */
  handleSwipe(e) {
    const { direction } = e.detail;
    this.changeDirection(direction);
  }

  /**
   * Handle behavior for the pause key
   */
  handlePauseKey() {
    if (this.allowPause) {
      this.allowPause = false;

      setTimeout(() => {
        if (!this.cutscene) {
          this.allowPause = true;
        }
      }, 500);

      this.gameEngine.changePausedState(this.gameEngine.running);
      this.soundManager.play('pause');

      if (this.gameEngine.started) {
        this.soundManager.resumeAmbience();
        this.gameUi.style.filter = 'unset';
        this.pausedText.style.visibility = 'hidden';
        this.pauseButton.innerHTML = 'pause';
        this.activeTimers.forEach((timer) => {
          timer.resume();
        });

        // Resume experiment timer
        if (this.experimentManager && this.experimentManager.isExperimentActive) {
          this.experimentManager.resumeGameplayTimer();
        }
      } else {
        this.soundManager.stopAmbience();
        this.soundManager.setAmbience('pause_beat', true);
        this.gameUi.style.filter = 'blur(5px)';
        this.pausedText.style.visibility = 'visible';
        this.pauseButton.innerHTML = 'play_arrow';
        this.activeTimers.forEach((timer) => {
          timer.pause();
        });

        // Pause experiment timer
        if (this.experimentManager && this.experimentManager.isExperimentActive) {
          this.experimentManager.pauseGameplayTimer();
        }
      }
    }
  }

  /**
   * Adds points to the player's total
   * @param {({ detail: { points: Number }})} e - Contains a quantity of points to add
   */
  awardPoints(e) {
    this.points += e.detail.points;
    this.pointsDisplay.innerText = this.points;
    if (this.points > (this.highScore || 0)) {
      this.highScore = this.points;
      this.highScoreDisplay.innerText = this.points;
      localStorage.setItem('highScore', this.highScore);
    }

    if (this.points >= 10000 && !this.extraLifeGiven) {
      this.extraLifeGiven = true;
      this.soundManager.play('extra_life');
      this.lives += 1;
      this.updateExtraLivesDisplay();
    }

    if (e.detail.type === 'fruit') {
      const left = e.detail.points >= 1000
        ? this.scaledTileSize * 12.5
        : this.scaledTileSize * 13;
      const top = this.scaledTileSize * 16.5;
      const width = e.detail.points >= 1000
        ? this.scaledTileSize * 3
        : this.scaledTileSize * 2;
      const height = this.scaledTileSize * 2;

      this.displayText({ left, top }, e.detail.points, 2000, width, height);
      this.soundManager.play('fruit');
      this.updateFruitDisplay(
        this.fruit.determineImage('fruit', e.detail.points),
      );
    }
  }

  /**
   * Animates Pacman's death, subtracts a life, and resets character positions if
   * the player has remaining lives.
   */
  deathSequence() {
    this.allowPause = false;
    this.cutscene = true;
    this.soundManager.setCutscene(this.cutscene);
    this.soundManager.stopAmbience();
    this.removeTimer({ detail: { timer: this.fruitTimer } });
    this.removeTimer({ detail: { timer: this.ghostCycleTimer } });
    this.removeTimer({ detail: { timer: this.endIdleTimer } });
    this.removeTimer({ detail: { timer: this.ghostFlashTimer } });

    this.allowKeyPresses = false;
    this.pacman.moving = false;
    this.ghosts.forEach((ghost) => {
      const ghostRef = ghost;
      ghostRef.moving = false;
    });

    new Timer(() => {
      this.ghosts.forEach((ghost) => {
        const ghostRef = ghost;
        ghostRef.display = false;
      });
      this.pacman.prepDeathAnimation();
      this.soundManager.play('death');

      if (this.lives > 0) {
        this.lives -= 1;

        new Timer(() => {
          this.mazeCover.style.visibility = 'visible';
          new Timer(() => {
            this.allowKeyPresses = true;
            this.mazeCover.style.visibility = 'hidden';
            this.pacman.reset();
            this.ghosts.forEach((ghost) => {
              ghost.reset();
            });
            this.fruit.hideFruit();

            this.startGameplay();
          }, 500);
        }, 2250);
      } else {
        this.gameOver();
      }
    }, 750);
  }

  /**
   * Displays GAME OVER text and displays the menu so players can play again
   */
  gameOver() {
    localStorage.setItem('highScore', this.highScore);

    // End current game (not session) - the experiment manager will handle this
    this.endCurrentGame('game_over');

    new Timer(() => {
      this.displayText(
        {
          left: this.scaledTileSize * 9,
          top: this.scaledTileSize * 16.5,
        },
        'game_over',
        4000,
        this.scaledTileSize * 10,
        this.scaledTileSize * 2,
      );
      this.fruit.hideFruit();

      new Timer(() => {
        this.leftCover.style.left = '0';
        this.rightCover.style.right = '0';

        setTimeout(() => {
          // In multi-game sessions, restart the game instead of showing session transition
          this.restartGameInSession();
        }, 1000);
      }, 2500);
    }, 2250);
  }

  /**
   * Ends the current experiment session and handles session completion
   * (Only called when "End Session" button is pressed in multi-game sessions)
   */
  endExperimentSession() {
    this.endExperimentSessionWithReason('manual_end');
  }

  /**
   * Shows session transition UI - either next session prompt or experiment completion
   */
  showSessionTransition() {
    const completedSessions = this.experimentManager.getCompletedSessionsCount();
    const remainingSessions = this.experimentManager.getRemainingSessionsCount();

    if (remainingSessions > 0) {
      // Show next session prompt
      this.showNextSessionPrompt(completedSessions, remainingSessions);
    } else {
      // All sessions completed - show experiment completion
      this.showExperimentCompletion();
    }
  }

  /**
   * Shows prompt for starting next session
   */
  showNextSessionPrompt(completed, remaining) {
    const nextSessionId = completed + 1;
    const nextPermutation = this.experimentManager.sessionOrder[completed];
    const nextConfig = this.experimentManager.PERMUTATIONS[nextPermutation];

    // Create session transition overlay
    const transitionOverlay = document.createElement('div');
    transitionOverlay.id = 'session-transition';
    transitionOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 3000;
      font-family: monospace;
      color: white;
    `;

    transitionOverlay.innerHTML = `
      <div style="text-align: center; padding: 40px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; border: 2px solid #4CAF50;">
        <h2 style="color: #4CAF50; margin-bottom: 20px;">Session ${completed} Complete!</h2>
        <p style="margin: 15px 0;">Sessions completed: ${completed}/${this.experimentManager.SESSION_CONFIGS.length}</p>
        <p style="margin: 15px 0;">Sessions remaining: ${remaining}</p>
        <hr style="margin: 30px 0; border-color: #333;">
        <h3 style="color: #FFC107; margin-bottom: 15px;">Next Session Configuration:</h3>
        <p style="margin: 10px 0;">Session ${nextSessionId}</p>
        <p style="margin: 10px 0;">Pac-Man Speed: <strong>${nextConfig.pacman.toUpperCase()}</strong></p>
        <p style="margin: 10px 0;">Ghost Speed: <strong>${nextConfig.ghost.toUpperCase()}</strong></p>
        <div style="margin-top: 30px;">
          <button id="start-next-session" style="
            padding: 15px 30px;
            margin: 10px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            font-family: monospace;
          ">Start Session ${nextSessionId}</button>
          <button id="pause-experiment" style="
            padding: 15px 30px;
            margin: 10px;
            background: #FF9800;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            font-family: monospace;
          ">Pause Experiment</button>
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">
          Press Ctrl+D to view analytics dashboard
        </p>
      </div>
    `;

    document.body.appendChild(transitionOverlay);

    // Bind button events
    document.getElementById('start-next-session').addEventListener('click', () => {
      this.continueToNextSession();
      document.body.removeChild(transitionOverlay);
    });

    document.getElementById('pause-experiment').addEventListener('click', () => {
      document.body.removeChild(transitionOverlay);
      this.returnToMainMenuWithNewSession();
    });
  }

  /**
   * Shows experiment completion screen
   */
  showExperimentCompletion() {
    // Dispatch experiment complete event
    window.dispatchEvent(new CustomEvent('experimentComplete', {
      detail: {
        userId: this.experimentManager.userId,
        completedSessions: this.experimentManager.SESSION_CONFIGS.length,
        totalSessions: this.experimentManager.SESSION_CONFIGS.length,
        timestamp: Date.now(),
      },
    }));

    const completionOverlay = document.createElement('div');
    completionOverlay.id = 'experiment-completion';
    completionOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 3000;
      font-family: monospace;
      color: white;
    `;

    completionOverlay.innerHTML = `
      <div style="text-align: center; padding: 40px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; border: 2px solid #4CAF50;">
        <h2 style="color: #4CAF50; margin-bottom: 20px;">🎉 Experiment Complete! 🎉</h2>
        <p style="margin: 15px 0; font-size: 18px;">All ${this.experimentManager.SESSION_CONFIGS.length} sessions completed successfully!</p>
        <p style="margin: 15px 0;">User ID: <strong>${this.experimentManager.userId}</strong></p>
        <hr style="margin: 30px 0; border-color: #333;">
        <h3 style="color: #FFC107; margin-bottom: 15px;">Thank you for participating!</h3>
        <p style="margin: 10px 0;">Your data has been saved and is ready for export.</p>
        <div style="margin-top: 30px;">
          <button id="view-results" style="
            padding: 15px 30px;
            margin: 10px;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            font-family: monospace;
          ">View Results Dashboard</button>
          <button id="export-data" style="
            padding: 15px 30px;
            margin: 10px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            font-family: monospace;
          ">Export Data</button>
          <button id="new-experiment" style="
            padding: 15px 30px;
            margin: 10px;
            background: #FF9800;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            font-family: monospace;
          ">Start New Experiment</button>
        </div>
      </div>
    `;

    document.body.appendChild(completionOverlay);

    // Bind button events
    document.getElementById('view-results').addEventListener('click', () => {
      this.visualizationDashboard.generateCompleteDashboard();
      document.body.removeChild(completionOverlay);
      this.returnToMainMenu();
    });

    document.getElementById('export-data').addEventListener('click', () => {
      this.exportManager.exportData('json');
      document.body.removeChild(completionOverlay);
      this.returnToMainMenu();
    });

    document.getElementById('new-experiment').addEventListener('click', () => {
      document.body.removeChild(completionOverlay);
      this.resetForNewExperiment();
    });
  }

  /**
   * Continues to next session directly (used by session transition overlay)
   */
  async continueToNextSession() {
    try {
      const session = await this.experimentManager.startSession();

      // Update the session display
      this.updateSessionDisplay(session);

      // Show the main menu with session info already populated
      // Don't call reset() here - it should only be called when game starts
      this.mainMenu.style.opacity = 1;
      this.gameStartButton.disabled = false;
      this.mainMenu.style.visibility = 'visible';

      // Make sure session info is showing and PLAY button is visible
      const userIdSection = document.getElementById('user-id-section');
      const sessionInfoSection = document.getElementById('session-info-section');
      const gameStartButton = document.getElementById('game-start');

      if (userIdSection) userIdSection.style.display = 'none';
      if (sessionInfoSection) sessionInfoSection.style.display = 'block';
      if (gameStartButton) gameStartButton.style.display = 'block';

      // Dispatch session started event
      window.dispatchEvent(new CustomEvent('experimentSessionStarted', {
        detail: {
          sessionId: session.sessionId,
          speedConfig: session.speedConfig,
          completedSessions: this.experimentManager.getCompletedSessionsCount() - 1,
        },
      }));
    } catch (error) {
      console.error('[GameCoordinator] Failed to continue to next session:', error);
      alert(`Error starting next session: ${error.message}`);
      this.returnToMainMenuWithNewSession();
    }
  }

  /**
   * Returns to main menu but prepares for new session selection
   */
  returnToMainMenuWithNewSession() {
    this.mainMenu.style.opacity = 1;
    this.gameStartButton.disabled = false;
    this.mainMenu.style.visibility = 'visible';

    // Reset to user ID input for potential different user
    const userIdSection = document.getElementById('user-id-section');
    const sessionInfoSection = document.getElementById('session-info-section');
    const userIdInput = document.getElementById('main-user-id-input');

    if (userIdSection) userIdSection.style.display = 'block';
    if (sessionInfoSection) sessionInfoSection.style.display = 'none';
    if (userIdInput) {
      userIdInput.value = this.experimentManager.userId || '';
      userIdInput.focus();
    }
  }

  /**
   * Starts the next experiment session (legacy method for compatibility)
   */
  startNextExperimentSession() {
    this.continueToNextSession();
  }

  /**
   * Returns to main menu
   */
  returnToMainMenu() {
    this.mainMenu.style.opacity = 1;
    this.gameStartButton.disabled = false;
    this.mainMenu.style.visibility = 'visible';
  }

  /**
   * Resets everything for a new experiment with different user
   */
  resetForNewExperiment() {
    // Reset experiment manager
    this.experimentManager.userId = null;
    this.experimentManager.sessionOrder = [];
    this.experimentManager.metrics = [];
    this.experimentManager.currentSession = null;
    this.experimentManager.currentMetrics = null;
    this.experimentManager.isExperimentActive = false;

    // Clear all storage for current experiment
    localStorage.clear();

    // Return to main menu
    this.returnToMainMenu();

    // Show experiment UI for new user setup
    if (this.experimentUI) {
      this.experimentUI.showUserIdPrompt();
    }
  }

  /**
   * Handle events related to the number of remaining dots
   */
  dotEaten() {
    this.remainingDots -= 1;

    this.soundManager.playDotSound();

    if (this.remainingDots === 174 || this.remainingDots === 74) {
      this.createFruit();
    }

    if (this.remainingDots === 40 || this.remainingDots === 20) {
      this.speedUpBlinky();
    }

    if (this.remainingDots === 0) {
      this.advanceLevel();
    }
  }

  /**
   * Creates a bonus fruit for ten seconds
   */
  createFruit() {
    this.removeTimer({ detail: { timer: this.fruitTimer } });
    this.fruit.showFruit(this.fruitPoints[this.level] || 5000);
    this.fruitTimer = new Timer(() => {
      this.fruit.hideFruit();
    }, 10000);
  }

  /**
   * Speeds up Blinky and raises the background noise pitch
   */
  speedUpBlinky() {
    this.blinky.speedUp();

    if (this.scaredGhosts.length === 0 && this.eyeGhosts === 0) {
      this.soundManager.setAmbience(this.determineSiren(this.remainingDots));
    }
  }

  /**
   * Determines the correct siren ambience
   * @param {Number} remainingDots
   * @returns {String}
   */
  determineSiren(remainingDots) {
    let sirenNum;

    if (remainingDots > 40) {
      sirenNum = 1;
    } else if (remainingDots > 20) {
      sirenNum = 2;
    } else {
      sirenNum = 3;
    }

    return `siren_${sirenNum}`;
  }

  /**
   * Handles level completion - for research purposes, ends session instead of advancing level
   */
  advanceLevel() {
    this.allowPause = false;
    this.cutscene = true;
    this.soundManager.setCutscene(this.cutscene);
    this.allowKeyPresses = false;
    this.soundManager.stopAmbience();

    this.entityList.forEach((entity) => {
      const entityRef = entity;
      entityRef.moving = false;
    });

    this.removeTimer({ detail: { timer: this.fruitTimer } });
    this.removeTimer({ detail: { timer: this.ghostCycleTimer } });
    this.removeTimer({ detail: { timer: this.endIdleTimer } });
    this.removeTimer({ detail: { timer: this.ghostFlashTimer } });

    const imgBase = 'app/style//graphics/spriteSheets/maze/';

    new Timer(() => {
      this.ghosts.forEach((ghost) => {
        const ghostRef = ghost;
        ghostRef.display = false;
      });

      this.mazeImg.src = `${imgBase}maze_white.svg`;
      new Timer(() => {
        this.mazeImg.src = `${imgBase}maze_blue.svg`;
        new Timer(() => {
          this.mazeImg.src = `${imgBase}maze_white.svg`;
          new Timer(() => {
            this.mazeImg.src = `${imgBase}maze_blue.svg`;
            new Timer(() => {
              this.mazeImg.src = `${imgBase}maze_white.svg`;
              new Timer(() => {
                this.mazeImg.src = `${imgBase}maze_blue.svg`;
                new Timer(() => {
                  // Display level complete message
                  this.displayText(
                    {
                      left: this.scaledTileSize * 8,
                      top: this.scaledTileSize * 16.5,
                    },
                    'ready', // Reusing "ready" text as "level complete"
                    2000, // Changed from 3000 to 2000 for verification
                    this.scaledTileSize * 12,
                    this.scaledTileSize * 2,
                  );

                  new Timer(() => {
                    // For research purposes, end session when level is completed
                    this.levelCompleteEndSession();
                  }, 2000); // Changed from 3000 to 2000 for verification
                }, 250);
              }, 250);
            }, 250);
          }, 250);
        }, 250);
      }, 250);
    }, 2000);
  }

  /**
   * Ends session when level is completed (all dots collected)
   */
  levelCompleteEndSession() {
    console.log('[GameCoordinator] 🔄 Level complete - ending current game, NOT session');
    localStorage.setItem('highScore', this.highScore);

    // End current game (not session) with level complete reason
    this.endCurrentGame('level_complete');

    this.leftCover.style.left = '0';
    this.rightCover.style.right = '0';

    setTimeout(() => {
      // In multi-game sessions, restart the game instead of showing session transition
      console.log('[GameCoordinator] 🎮 Restarting game within same session');
      this.restartGameInSession();
    }, 1000);
  }

  /**
   * End current game and dispatch game ended event for multi-game sessions
   */
  endCurrentGame(reason) {
    console.log('[GameCoordinator] 🏁 Ending current game with reason:', reason);
    if (this.experimentManager.isExperimentActive) {
      // Dispatch game ended event with reason
      window.dispatchEvent(new CustomEvent('gameEnded', {
        detail: {
          sessionId: (this.experimentManager.currentSession && this.experimentManager.currentSession.sessionId) ? this.experimentManager.currentSession.sessionId : null,
          finalScore: this.points,
          gameTime: Date.now() - this.gameStartTime,
          reason, // 'level_complete' or 'game_over'
          timestamp: Date.now(),
        },
      }));
    }
  }

  /**
   * Restart the game within the current session (for multi-game sessions)
   */
  restartGameInSession() {
    console.log('[GameCoordinator] 🎮 Restarting game within session - NOT advancing to next session');
    // Reset game state but keep session active
    this.reset();
    this.startGameplay(true);

    // Show the game again
    this.leftCover.style.left = '-50%';
    this.rightCover.style.right = '-50%';

    // Dispatch game started event for the new game
    window.dispatchEvent(new CustomEvent('gameStarted', {
      detail: {
        sessionId: (this.experimentManager.currentSession && this.experimentManager.currentSession.sessionId) ? this.experimentManager.currentSession.sessionId : null,
        speedConfig: (this.experimentManager.currentSession && this.experimentManager.currentSession.speedConfig) ? this.experimentManager.currentSession.speedConfig : null,
        timestamp: Date.now(),
      },
    }));
  }

  /**
   * Ends the current experiment session (called when "End Session" button pressed)
   */
  endExperimentSessionWithReason(reason) {
    if (this.experimentManager.isExperimentActive) {
      // End current game if active
      if (this.experimentManager.currentSession && this.experimentManager.currentSession.currentGame) {
        this.endCurrentGame(reason);
      }

      // End the session in experiment manager with final score
      this.experimentManager.blockSessionEnd = true; // Allow session end
      this.experimentManager.endSession(this.points);

      // Dispatch session ended event for other components
      console.log('[GameCoordinator] 🚨 WOULD dispatch experimentSessionEnded event, but BLOCKING for debug');
      // window.dispatchEvent(new CustomEvent('experimentSessionEnded', {
      //   detail: {
      //     sessionId: (this.experimentManager.currentSession && this.experimentManager.currentSession.sessionId) ? this.experimentManager.currentSession.sessionId : 'unknown',
      //     completedSessions: this.experimentManager.getCompletedSessionsCount(),
      //     reason,
      //   },
      // }));

      // Show session transition UI only when session actually ends
      this.showSessionTransition();
    }
  }

  /**
   * Flashes ghosts blue and white to indicate the end of the powerup
   * @param {Number} flashes - Total number of elapsed flashes
   * @param {Number} maxFlashes - Total flashes to show
   */
  flashGhosts(flashes, maxFlashes) {
    if (flashes === maxFlashes) {
      this.scaredGhosts.forEach((ghost) => {
        ghost.endScared();
      });
      this.scaredGhosts = [];
      if (this.eyeGhosts === 0) {
        this.soundManager.setAmbience(this.determineSiren(this.remainingDots));
      }
    } else if (this.scaredGhosts.length > 0) {
      this.scaredGhosts.forEach((ghost) => {
        ghost.toggleScaredColor();
      });

      this.ghostFlashTimer = new Timer(() => {
        this.flashGhosts(flashes + 1, maxFlashes);
      }, 250);
    }
  }

  /**
   * Upon eating a power pellet, sets the ghosts to 'scared' mode
   */
  powerUp() {
    if (this.remainingDots !== 0) {
      this.soundManager.setAmbience('power_up');
    }

    this.removeTimer({ detail: { timer: this.ghostFlashTimer } });

    this.ghostCombo = 0;
    this.scaredGhosts = [];

    this.ghosts.forEach((ghost) => {
      if (ghost.mode !== 'eyes') {
        this.scaredGhosts.push(ghost);
      }
    });

    this.scaredGhosts.forEach((ghost) => {
      ghost.becomeScared();
    });

    const powerDuration = Math.max((7 - this.level) * 1000, 0);
    this.ghostFlashTimer = new Timer(() => {
      this.flashGhosts(0, 9);
    }, powerDuration);
  }

  /**
   * Determines the quantity of points to give based on the current combo
   */
  determineComboPoints() {
    return 100 * (2 ** this.ghostCombo);
  }

  /**
   * Upon eating a ghost, award points and temporarily pause movement
   * @param {CustomEvent} e - Contains a target ghost object
   */
  eatGhost(e) {
    const pauseDuration = 1000;
    const { position, measurement } = e.detail.ghost;

    this.pauseTimer({ detail: { timer: this.ghostFlashTimer } });
    this.pauseTimer({ detail: { timer: this.ghostCycleTimer } });
    this.pauseTimer({ detail: { timer: this.fruitTimer } });
    this.soundManager.play('eat_ghost');

    this.scaredGhosts = this.scaredGhosts.filter(
      ghost => ghost.name !== e.detail.ghost.name,
    );
    this.eyeGhosts += 1;

    this.ghostCombo += 1;
    const comboPoints = this.determineComboPoints();
    window.dispatchEvent(
      new CustomEvent('awardPoints', {
        detail: {
          points: comboPoints,
        },
      }),
    );
    this.displayText(position, comboPoints, pauseDuration, measurement);

    this.allowPacmanMovement = false;
    this.pacman.display = false;
    this.pacman.moving = false;

    // Pause experiment timer during ghost eating pause
    if (this.experimentManager && this.experimentManager.isExperimentActive) {
      this.experimentManager.pauseGameplayTimer();
    }
    e.detail.ghost.display = false;
    e.detail.ghost.moving = false;

    this.ghosts.forEach((ghost) => {
      const ghostRef = ghost;
      ghostRef.animate = false;
      ghostRef.pause(true);
      ghostRef.allowCollision = false;
    });

    new Timer(() => {
      this.soundManager.setAmbience('eyes');

      this.resumeTimer({ detail: { timer: this.ghostFlashTimer } });
      this.resumeTimer({ detail: { timer: this.ghostCycleTimer } });
      this.resumeTimer({ detail: { timer: this.fruitTimer } });
      this.allowPacmanMovement = true;
      this.pacman.display = true;
      this.pacman.moving = true;

      // Resume experiment timer after ghost eating pause
      if (this.experimentManager && this.experimentManager.isExperimentActive) {
        this.experimentManager.resumeGameplayTimer();
      }
      e.detail.ghost.display = true;
      e.detail.ghost.moving = true;
      this.ghosts.forEach((ghost) => {
        const ghostRef = ghost;
        ghostRef.animate = true;
        ghostRef.pause(false);
        ghostRef.allowCollision = true;
      });
    }, pauseDuration);
  }

  /**
   * Decrements the count of "eye" ghosts and updates the ambience
   */
  restoreGhost() {
    this.eyeGhosts -= 1;

    if (this.eyeGhosts === 0) {
      const sound = this.scaredGhosts.length > 0
        ? 'power_up'
        : this.determineSiren(this.remainingDots);
      this.soundManager.setAmbience(sound);
    }
  }

  /**
   * Creates a temporary div to display points on screen
   * @param {({ left: number, top: number })} position - CSS coordinates to display the points at
   * @param {Number} amount - Amount of points to display
   * @param {Number} duration - Milliseconds to display the points before disappearing
   * @param {Number} width - Image width in pixels
   * @param {Number} height - Image height in pixels
   */
  displayText(position, amount, duration, width, height) {
    const pointsDiv = document.createElement('div');

    pointsDiv.style.position = 'absolute';
    pointsDiv.style.backgroundSize = `${width}px`;
    pointsDiv.style.backgroundImage = 'url(app/style/graphics/'
        + `spriteSheets/text/${amount}.svg`;
    pointsDiv.style.width = `${width}px`;
    pointsDiv.style.height = `${height || width}px`;
    pointsDiv.style.top = `${position.top}px`;
    pointsDiv.style.left = `${position.left}px`;
    pointsDiv.style.zIndex = 2;

    this.mazeDiv.appendChild(pointsDiv);

    new Timer(() => {
      this.mazeDiv.removeChild(pointsDiv);
    }, duration);
  }

  /**
   * Pushes a Timer to the activeTimers array
   * @param {({ detail: { timer: Object }})} e
   */
  addTimer(e) {
    this.activeTimers.push(e.detail.timer);
  }

  /**
   * Checks if a Timer with a matching ID exists
   * @param {({ detail: { timer: Object }})} e
   * @returns {Boolean}
   */
  timerExists(e) {
    return !!(e.detail.timer || {}).timerId;
  }

  /**
   * Pauses a timer
   * @param {({ detail: { timer: Object }})} e
   */
  pauseTimer(e) {
    if (this.timerExists(e)) {
      e.detail.timer.pause(true);
    }
  }

  /**
   * Resumes a timer
   * @param {({ detail: { timer: Object }})} e
   */
  resumeTimer(e) {
    if (this.timerExists(e)) {
      e.detail.timer.resume(true);
    }
  }

  /**
   * Removes a Timer from activeTimers
   * @param {({ detail: { timer: Object }})} e
   */
  removeTimer(e) {
    if (this.timerExists(e)) {
      window.clearTimeout(e.detail.timer.timerId);
      this.activeTimers = this.activeTimers.filter(
        timer => timer.timerId !== e.detail.timer.timerId,
      );
    }
  }
}

// removeIf(production)
module.exports = GameCoordinator;
// endRemoveIf(production)
