class ExportManager {
  constructor(experimentManager, sessionManager, dataManager) {
    this.experimentManager = experimentManager;
    this.sessionManager = sessionManager;
    this.dataManager = dataManager;
    this.exportFormats = ['json', 'csv', 'xlsx', 'spss', 'r', 'python'];
    this.anonymization = {
      enabled: false,
      hashSalt: null,
      fieldMasking: {},
    };
    this.isInitialized = false;
    this.DEBUG = true;
  }

  initialize() {
    if (this.isInitialized) return;

    this.setupAnonymization();
    this.bindEvents();
    this.isInitialized = true;

    if (this.DEBUG) {
      console.log('[ExportManager] Initialized with formats:', this.exportFormats);
    }
  }

  bindEvents() {
    window.addEventListener('experimentComplete', () => {
      this.generateCompletionReport();
    });

    window.addEventListener('exportRequested', (e) => {
      this.handleExportRequest(e.detail);
    });
  }

  setupAnonymization() {
    this.anonymization.hashSalt = this.generateSalt();
    this.anonymization.fieldMasking = {
      userId: { enabled: false, method: 'hash' },
      deviceInfo: { enabled: false, method: 'remove' },
      browserInfo: { enabled: false, method: 'generalize' },
      timestamps: { enabled: false, method: 'relative' },
    };
  }

  generateSalt() {
    return Math.random().toString(36).substring(2, 15)
           + Math.random().toString(36).substring(2, 15);
  }

  exportData(format = 'json', options = {}) {
    try {
      const exportOptions = {
        includeRawEvents: true,
        includeSummary: true,
        includeAnalytics: true,
        includeDeviceInfo: true,
        anonymize: false,
        compression: false,
        ...options,
      };

      const rawData = this.gatherExportData(exportOptions);
      const processedData = this.processDataForExport(rawData, exportOptions);

      let exportContent;
      let filename;
      let mimeType;

      switch (format.toLowerCase()) {
        case 'json':
          { const result = this.exportAsJSON(processedData, exportOptions);
            exportContent = result.content;
            filename = result.filename;
            mimeType = result.mimeType; }
          break;
        case 'csv':
          { const result = this.exportAsCSV(processedData, exportOptions);
            exportContent = result.content;
            filename = result.filename;
            mimeType = result.mimeType; }
          break;
        case 'xlsx':
          { const result = this.exportAsExcel(processedData, exportOptions);
            exportContent = result.content;
            filename = result.filename;
            mimeType = result.mimeType; }
          break;
        case 'spss':
          { const result = this.exportAsSPSS(processedData, exportOptions);
            exportContent = result.content;
            filename = result.filename;
            mimeType = result.mimeType; }
          break;
        case 'r':
          { const result = this.exportAsR(processedData, exportOptions);
            exportContent = result.content;
            filename = result.filename;
            mimeType = result.mimeType; }
          break;
        case 'python':
          { const result = this.exportAsPython(processedData, exportOptions);
            exportContent = result.content;
            filename = result.filename;
            mimeType = result.mimeType; }
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      this.downloadFile(filename, exportContent, mimeType);
      this.logExport(format, exportOptions, exportContent.length);

      return {
        success: true,
        format,
        filename,
        size: exportContent.length,
      };
    } catch (error) {
      console.error('[ExportManager] Export failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  gatherExportData(options) {
    const data = {
      metadata: this.generateMetadata(),
      experiment: {
        userId: this.experimentManager.userId,
        sessionOrder: this.experimentManager.sessionOrder,
        speedConfigurations: this.experimentManager.PERMUTATIONS,
        completedSessions: this.experimentManager.getCompletedSessionsCount(),
        totalSessions: this.experimentManager.SESSION_CONFIGS.length,
      },
      sessions: this.experimentManager.metrics,
      analytics: this.sessionManager.getSessionAnalytics(),
      systemInfo: {
        deviceInfo: options.includeDeviceInfo ? this.getDeviceInfo() : null,
        browserInfo: options.includeDeviceInfo ? this.getBrowserInfo() : null,
        exportTimestamp: new Date().toISOString(),
      },
    };

    if (options.includeRawEvents) {
      data.rawEvents = this.extractAllEvents();
    }

    if (options.includeAnalytics) {
      data.statisticalSummary = this.generateStatisticalSummary();
      data.performanceMetrics = this.generatePerformanceMetrics();
    }

    return data;
  }

  processDataForExport(data, options) {
    let processedData = JSON.parse(JSON.stringify(data)); // Deep clone

    if (options.anonymize) {
      processedData = this.anonymizeData(processedData);
    }

    if (options.compression) {
      processedData = this.compressData(processedData);
    }

    return processedData;
  }

  generateMetadata() {
    return {
      experimentName: 'Pac-Man Speed Configuration Research',
      version: '1.0.0',
      description: 'Research study investigating effects of speed configurations on gameplay',
      exportDate: new Date().toISOString(),
      dataStructure: {
        sessions: 'Array of session objects with metrics and events',
        events: 'Individual game events with timestamps and context',
        analytics: 'Aggregated statistics and performance metrics',
        configurations: 'Speed permutations used in the experiment',
      },
      variables: {
        independent: ['pacman_speed', 'ghost_speed'],
        dependent: ['ghosts_eaten', 'pellets_eaten', 'deaths', 'successful_turns', 'turn_accuracy'],
      },
    };
  }

  extractAllEvents() {
    const allEvents = [];

    this.experimentManager.metrics.forEach((session) => {
      if (session.events) {
        session.events.forEach((event) => {
          allEvents.push({
            ...event,
            sessionId: session.sessionId,
            speedConfig: session.speedConfig,
            permutationId: session.permutationId,
          });
        });
      }
    });

    return allEvents.sort((a, b) => a.timestamp - b.timestamp);
  }

  generateStatisticalSummary() {
    const sessions = this.experimentManager.metrics;
    if (sessions.length === 0) return null;

    const summary = {
      sessions: {
        total: sessions.length,
        completed: sessions.filter(s => s.summary).length,
      },
      performance: this.calculatePerformanceStats(sessions),
      speedAnalysis: this.analyzeSpeedEffects(sessions),
      turnAnalysis: this.analyzeTurnPerformance(sessions),
      timeAnalysis: this.analyzeTimeMetrics(sessions),
    };

    return summary;
  }

  calculatePerformanceStats(sessions) {
    const metrics = ['totalGhostsEaten', 'totalPelletsEaten', 'totalDeaths', 'successfulTurns', 'totalTurns'];
    const stats = {};

    metrics.forEach((metric) => {
      const values = sessions
        .filter(s => s.summary && s.summary[metric] !== undefined)
        .map(s => s.summary[metric]);

      if (values.length > 0) {
        stats[metric] = {
          mean: this.calculateMean(values),
          median: this.calculateMedian(values),
          std: this.calculateStandardDeviation(values),
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length,
        };
      }
    });

    // Calculate turn accuracy
    const accuracyValues = sessions
      .filter(s => s.summary && s.summary.totalTurns > 0)
      .map(s => s.summary.successfulTurns / s.summary.totalTurns);

    if (accuracyValues.length > 0) {
      stats.turnAccuracy = {
        mean: this.calculateMean(accuracyValues),
        median: this.calculateMedian(accuracyValues),
        std: this.calculateStandardDeviation(accuracyValues),
        min: Math.min(...accuracyValues),
        max: Math.max(...accuracyValues),
        count: accuracyValues.length,
      };
    }

    return stats;
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
            avgGhostsEaten: this.calculateMean(group.map(s => s.totalGhostsEaten || 0)),
            avgPelletsEaten: this.calculateMean(group.map(s => s.totalPelletsEaten || 0)),
            avgDeaths: this.calculateMean(group.map(s => s.totalDeaths || 0)),
            avgTurnAccuracy: this.calculateMean(group.map(s => (s.totalTurns > 0 ? s.successfulTurns / s.totalTurns : 0))),
          };
        }
      });
    });

    return analysis;
  }

  analyzeTurnPerformance(sessions) {
    const allEvents = this.extractAllEvents();
    const turnEvents = allEvents.filter(e => e.type === 'turnComplete');

    if (turnEvents.length === 0) return null;

    const successfulTurns = turnEvents.filter(e => e.success);
    const failedTurns = turnEvents.filter(e => !e.success);

    return {
      totalTurns: turnEvents.length,
      successfulTurns: successfulTurns.length,
      failedTurns: failedTurns.length,
      successRate: successfulTurns.length / turnEvents.length,
      avgDuration: {
        successful: this.calculateMean(successfulTurns.map(e => e.duration || 0)),
        failed: this.calculateMean(failedTurns.map(e => e.duration || 0)),
      },
    };
  }

  analyzeTimeMetrics(sessions) {
    const gameTimes = sessions
      .filter(s => s.summary && s.summary.gameTime)
      .map(s => s.summary.gameTime);

    if (gameTimes.length === 0) return null;

    return {
      totalPlayTime: gameTimes.reduce((sum, time) => sum + time, 0),
      avgSessionDuration: this.calculateMean(gameTimes),
      medianSessionDuration: this.calculateMedian(gameTimes),
      shortestSession: Math.min(...gameTimes),
      longestSession: Math.max(...gameTimes),
    };
  }

  exportAsJSON(data, options) {
    const content = JSON.stringify(data, null, options.minify ? 0 : 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const suffix = options.anonymize ? '_anonymized' : '';

    return {
      content,
      filename: `pacman_experiment_${this.experimentManager.userId}${suffix}_${timestamp}.json`,
      mimeType: 'application/json',
    };
  }

  exportAsCSV(data, options) {
    const csvSections = [];

    // Session summary CSV
    if (data.sessions && data.sessions.length > 0) {
      const sessionHeaders = [
        'sessionId', 'userId', 'permutationId', 'pacmanSpeed', 'ghostSpeed',
        'totalGhostsEaten', 'totalPelletsEaten', 'totalDeaths',
        'successfulTurns', 'totalTurns', 'turnAccuracy', 'gameTime',
      ];

      const sessionRows = data.sessions.map(session => [
        session.sessionId,
        session.userId,
        session.permutationId,
        (session.speedConfig && session.speedConfig.pacman) ? session.speedConfig.pacman : '',
        (session.speedConfig && session.speedConfig.ghost) ? session.speedConfig.ghost : '',
        (session.summary && session.summary.totalGhostsEaten) ? session.summary.totalGhostsEaten : 0,
        (session.summary && session.summary.totalPelletsEaten) ? session.summary.totalPelletsEaten : 0,
        (session.summary && session.summary.totalDeaths) ? session.summary.totalDeaths : 0,
        (session.summary && session.summary.successfulTurns) ? session.summary.successfulTurns : 0,
        (session.summary && session.summary.totalTurns) ? session.summary.totalTurns : 0,
        (session.summary && session.summary.totalTurns && session.summary.totalTurns > 0) ? session.summary.successfulTurns / session.summary.totalTurns : 0,
        (session.summary && session.summary.gameTime) ? session.summary.gameTime : 0,
      ]);

      csvSections.push('# Session Summary');
      csvSections.push(sessionHeaders.join(','));
      csvSections.push(...sessionRows.map(row => row.join(',')));
      csvSections.push('');
    }

    // Events CSV
    if (data.rawEvents && data.rawEvents.length > 0) {
      const eventHeaders = [
        'sessionId', 'eventType', 'timestamp', 'time', 'pacmanSpeed', 'ghostSpeed',
      ];

      const eventRows = data.rawEvents.map(event => [
        event.sessionId,
        event.type,
        event.timestamp,
        event.time,
        (event.speedConfig && event.speedConfig.pacman) ? event.speedConfig.pacman : '',
        (event.speedConfig && event.speedConfig.ghost) ? event.speedConfig.ghost : '',
      ]);

      csvSections.push('# Raw Events');
      csvSections.push(eventHeaders.join(','));
      csvSections.push(...eventRows.map(row => row.join(',')));
    }

    const content = csvSections.join('\n');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const suffix = options.anonymize ? '_anonymized' : '';

    return {
      content,
      filename: `pacman_experiment_${this.experimentManager.userId}${suffix}_${timestamp}.csv`,
      mimeType: 'text/csv',
    };
  }

  exportAsExcel(data, options) {
    // Generate XLSX-compatible CSV with multiple sheets info
    const content = this.generateExcelCompatibleFormat(data);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const suffix = options.anonymize ? '_anonymized' : '';

    return {
      content,
      filename: `pacman_experiment_${this.experimentManager.userId}${suffix}_${timestamp}.xlsx.csv`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  exportAsSPSS(data, options) {
    const spssScript = this.generateSPSSScript(data);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const suffix = options.anonymize ? '_anonymized' : '';

    return {
      content: spssScript,
      filename: `pacman_experiment_${this.experimentManager.userId}${suffix}_${timestamp}.sps`,
      mimeType: 'text/plain',
    };
  }

  exportAsR(data, options) {
    const rScript = this.generateRScript(data);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const suffix = options.anonymize ? '_anonymized' : '';

    return {
      content: rScript,
      filename: `pacman_experiment_${this.experimentManager.userId}${suffix}_${timestamp}.R`,
      mimeType: 'text/plain',
    };
  }

  exportAsPython(data, options) {
    const pythonScript = this.generatePythonScript(data);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const suffix = options.anonymize ? '_anonymized' : '';

    return {
      content: pythonScript,
      filename: `pacman_experiment_${this.experimentManager.userId}${suffix}_${timestamp}.py`,
      mimeType: 'text/plain',
    };
  }

  generateSPSSScript(data) {
    return `* SPSS Syntax for Pac-Man Speed Configuration Research
* Generated: ${new Date().toISOString()}
* User: ${this.experimentManager.userId}

* Import data
GET DATA
  /TYPE=TXT
  /FILE='pacman_experiment_data.csv'
  /DELCASE=LINE
  /DELIMITERS=","
  /QUALIFIER='"'
  /ARRANGEMENT=DELIMITED
  /FIRSTCASE=2
  /VARIABLES=
    sessionId F3.0
    userId A20
    permutationId F2.0
    pacmanSpeed A10
    ghostSpeed A10
    totalGhostsEaten F5.0
    totalPelletsEaten F6.0
    totalDeaths F4.0
    successfulTurns F5.0
    totalTurns F5.0
    turnAccuracy F8.4
    gameTime F10.0.

* Define value labels
VALUE LABELS pacmanSpeed
  'slow' 'Slow Speed'
  'normal' 'Normal Speed'
  'fast' 'Fast Speed'.

VALUE LABELS ghostSpeed
  'slow' 'Slow Speed'
  'normal' 'Normal Speed'
  'fast' 'Fast Speed'.

* Basic descriptive statistics
DESCRIPTIVES VARIABLES=totalGhostsEaten totalPelletsEaten totalDeaths turnAccuracy gameTime
  /STATISTICS=MEAN STDDEV MIN MAX.

* ANOVA for speed effects
UNIANOVA totalGhostsEaten BY pacmanSpeed ghostSpeed
  /METHOD=SSTYPE(3)
  /INTERCEPT=INCLUDE
  /PRINT=ETASQ DESCRIPTIVE
  /CRITERIA=ALPHA(.05)
  /DESIGN=pacmanSpeed ghostSpeed pacmanSpeed*ghostSpeed.

UNIANOVA turnAccuracy BY pacmanSpeed ghostSpeed
  /METHOD=SSTYPE(3)
  /INTERCEPT=INCLUDE
  /PRINT=ETASQ DESCRIPTIVE
  /CRITERIA=ALPHA(.05)
  /DESIGN=pacmanSpeed ghostSpeed pacmanSpeed*ghostSpeed.

* Correlation analysis
CORRELATIONS
  /VARIABLES=totalGhostsEaten totalPelletsEaten totalDeaths turnAccuracy gameTime
  /PRINT=TWOTAIL NOSIG
  /MISSING=PAIRWISE.

EXECUTE.`;
  }

  generateRScript(data) {
    return `# R Analysis Script for Pac-Man Speed Configuration Research
# Generated: ${new Date().toISOString()}
# User: ${this.experimentManager.userId}

# Load required libraries
library(tidyverse)
library(ggplot2)
library(dplyr)
library(car)
library(psych)

# Import data
data <- read.csv("pacman_experiment_data.csv", stringsAsFactors = TRUE)

# Basic data exploration
cat("Data Structure:\\n")
str(data)

cat("\\nDescriptive Statistics:\\n")
describe(data[c("totalGhostsEaten", "totalPelletsEaten", "totalDeaths", "turnAccuracy", "gameTime")])

# Speed configuration analysis
cat("\\nSpeed Configuration Summary:\\n")
data %>% 
  group_by(pacmanSpeed, ghostSpeed) %>%
  summarise(
    n = n(),
    mean_ghosts = mean(totalGhostsEaten, na.rm = TRUE),
    mean_pellets = mean(totalPelletsEaten, na.rm = TRUE),
    mean_accuracy = mean(turnAccuracy, na.rm = TRUE),
    .groups = 'drop'
  )

# ANOVA for ghosts eaten
ghosts_anova <- aov(totalGhostsEaten ~ pacmanSpeed * ghostSpeed, data = data)
cat("\\nGhosts Eaten ANOVA:\\n")
summary(ghosts_anova)

# ANOVA for turn accuracy
accuracy_anova <- aov(turnAccuracy ~ pacmanSpeed * ghostSpeed, data = data)
cat("\\nTurn Accuracy ANOVA:\\n")
summary(accuracy_anova)

# Visualization
# Performance by Pac-Man speed
p1 <- ggplot(data, aes(x = pacmanSpeed, y = totalGhostsEaten, fill = pacmanSpeed)) +
  geom_boxplot() +
  labs(title = "Ghosts Eaten by Pac-Man Speed",
       x = "Pac-Man Speed", y = "Total Ghosts Eaten") +
  theme_minimal()

# Performance by Ghost speed  
p2 <- ggplot(data, aes(x = ghostSpeed, y = turnAccuracy, fill = ghostSpeed)) +
  geom_boxplot() +
  labs(title = "Turn Accuracy by Ghost Speed",
       x = "Ghost Speed", y = "Turn Accuracy") +
  theme_minimal()

# Interaction plot
p3 <- ggplot(data, aes(x = pacmanSpeed, y = totalGhostsEaten, color = ghostSpeed)) +
  geom_point(position = position_jitter(width = 0.2)) +
  stat_summary(fun = mean, geom = "line", aes(group = ghostSpeed)) +
  labs(title = "Speed Configuration Interaction Effect",
       x = "Pac-Man Speed", y = "Total Ghosts Eaten",
       color = "Ghost Speed") +
  theme_minimal()

# Display plots
print(p1)
print(p2)
print(p3)

# Correlation matrix
cat("\\nCorrelation Matrix:\\n")
cor_matrix <- cor(data[c("totalGhostsEaten", "totalPelletsEaten", "totalDeaths", "turnAccuracy", "gameTime")], 
                  use = "complete.obs")
print(cor_matrix)

# Save results
write.csv(data, "processed_pacman_data.csv", row.names = FALSE)
cat("\\nAnalysis complete. Results saved to processed_pacman_data.csv\\n")`;
  }

  generatePythonScript(data) {
    return `# Python Analysis Script for Pac-Man Speed Configuration Research
# Generated: ${new Date().toISOString()}
# User: ${this.experimentManager.userId}

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
from scipy.stats import f_oneway
import warnings
warnings.filterwarnings('ignore')

# Load data
data = pd.read_csv('pacman_experiment_data.csv')

print("Data Structure:")
print(data.info())
print("\\nFirst few rows:")
print(data.head())

# Descriptive statistics
print("\\nDescriptive Statistics:")
numeric_cols = ['totalGhostsEaten', 'totalPelletsEaten', 'totalDeaths', 'turnAccuracy', 'gameTime']
print(data[numeric_cols].describe())

# Group analysis by speed configurations
print("\\nSpeed Configuration Analysis:")
speed_analysis = data.groupby(['pacmanSpeed', 'ghostSpeed'])[numeric_cols].agg(['mean', 'std', 'count'])
print(speed_analysis)

# Statistical tests
print("\\nStatistical Analysis:")

# ANOVA for ghosts eaten by Pac-Man speed
pacman_groups = [group['totalGhostsEaten'].values for name, group in data.groupby('pacmanSpeed')]
f_stat, p_value = f_oneway(*pacman_groups)
print(f"Pac-Man Speed Effect on Ghosts Eaten: F={f_stat:.3f}, p={p_value:.3f}")

# ANOVA for turn accuracy by ghost speed
ghost_groups = [group['turnAccuracy'].values for name, group in data.groupby('ghostSpeed')]
f_stat, p_value = f_oneway(*ghost_groups)
print(f"Ghost Speed Effect on Turn Accuracy: F={f_stat:.3f}, p={p_value:.3f}")

# Correlation analysis
print("\\nCorrelation Matrix:")
correlation_matrix = data[numeric_cols].corr()
print(correlation_matrix)

# Visualizations
plt.style.use('seaborn')
fig, axes = plt.subplots(2, 2, figsize=(15, 12))

# Ghosts eaten by Pac-Man speed
sns.boxplot(data=data, x='pacmanSpeed', y='totalGhostsEaten', ax=axes[0,0])
axes[0,0].set_title('Ghosts Eaten by Pac-Man Speed')

# Turn accuracy by ghost speed
sns.boxplot(data=data, x='ghostSpeed', y='turnAccuracy', ax=axes[0,1])
axes[0,1].set_title('Turn Accuracy by Ghost Speed')

# Heatmap of speed combinations
pivot_data = data.pivot_table(values='totalGhostsEaten', index='pacmanSpeed', columns='ghostSpeed', aggfunc='mean')
sns.heatmap(pivot_data, annot=True, fmt='.1f', ax=axes[1,0])
axes[1,0].set_title('Mean Ghosts Eaten by Speed Configuration')

# Correlation heatmap
sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', center=0, ax=axes[1,1])
axes[1,1].set_title('Correlation Matrix')

plt.tight_layout()
plt.savefig('pacman_analysis_plots.png', dpi=300, bbox_inches='tight')
plt.show()

# Advanced analysis
print("\\nAdvanced Analysis:")

# Two-way ANOVA using statsmodels
try:
    import statsmodels.api as sm
    from statsmodels.formula.api import ols
    
    model = ols('totalGhostsEaten ~ C(pacmanSpeed) + C(ghostSpeed) + C(pacmanSpeed):C(ghostSpeed)', data=data).fit()
    anova_table = sm.stats.anova_lm(model, typ=2)
    print("Two-way ANOVA Results:")
    print(anova_table)
except ImportError:
    print("statsmodels not available for advanced ANOVA")

# Export processed data
data.to_csv('processed_pacman_data.csv', index=False)
print("\\nAnalysis complete. Results saved to processed_pacman_data.csv")
print("Plots saved to pacman_analysis_plots.png")`;
  }

  // Utility functions for statistical calculations
  calculateMean(values) {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  calculateMedian(values) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  calculateStandardDeviation(values) {
    if (values.length <= 1) return 0;
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = this.calculateMean(squaredDiffs);
    return Math.sqrt(variance);
  }

  generateExcelCompatibleFormat(data) {
    // Simple Excel-compatible format
    const { content } = this.exportAsCSV(data, {});
    return content;
  }

  anonymizeData(data) {
    const anonymized = JSON.parse(JSON.stringify(data));

    if (this.anonymization.fieldMasking.userId.enabled) {
      anonymized.experiment.userId = this.hashValue(anonymized.experiment.userId);
      if (anonymized.sessions) {
        anonymized.sessions.forEach((session) => {
          session.userId = this.hashValue(session.userId);
        });
      }
    }

    if (this.anonymization.fieldMasking.deviceInfo.enabled) {
      delete anonymized.systemInfo.deviceInfo;
    }

    if (this.anonymization.fieldMasking.timestamps.enabled) {
      // Convert to relative timestamps
      this.convertToRelativeTimestamps(anonymized);
    }

    return anonymized;
  }

  hashValue(value) {
    // Simple hash function for anonymization
    let hash = 0;
    const str = value + this.anonymization.hashSalt;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash &= hash;
    }
    return `user_${Math.abs(hash).toString(36)}`;
  }

  convertToRelativeTimestamps(data) {
    // Convert absolute timestamps to relative (first event = 0)
    if (data.rawEvents && data.rawEvents.length > 0) {
      const baseTime = data.rawEvents[0].timestamp;
      data.rawEvents.forEach((event) => {
        event.relativeTimestamp = event.timestamp - baseTime;
        delete event.timestamp;
      });
    }
  }

  compressData(data) {
    // Simple data compression by removing unnecessary fields
    const compressed = JSON.parse(JSON.stringify(data));

    // Remove verbose debug information
    if (compressed.sessions) {
      compressed.sessions.forEach((session) => {
        if (session.events) {
          session.events.forEach((event) => {
            delete event.pacmanPosition;
            delete event.pacmanGridPosition;
          });
        }
      });
    }

    return compressed;
  }

  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    };
  }

  getBrowserInfo() {
    return {
      url: window.location.href,
      referrer: document.referrer,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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

  logExport(format, options, size) {
    if (this.DEBUG) {
      console.log('[ExportManager] Export completed:', {
        format,
        size: `${Math.round(size / 1024)}KB`,
        options,
        timestamp: new Date().toISOString(),
      });
    }
  }

  generatePerformanceMetrics() {
    return {
      exportCapabilities: this.exportFormats,
      anonymizationEnabled: this.anonymization.enabled,
      dataIntegrity: this.validateDataIntegrity(),
      completeness: this.assessDataCompleteness(),
    };
  }

  validateDataIntegrity() {
    const sessions = this.experimentManager.metrics;
    const issues = [];

    sessions.forEach((session) => {
      if (!session.userId) issues.push(`Session ${session.sessionId} missing userId`);
      if (!session.speedConfig) issues.push(`Session ${session.sessionId} missing speedConfig`);
      if (!session.summary) issues.push(`Session ${session.sessionId} missing summary`);
    });

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  assessDataCompleteness() {
    const totalSessions = this.experimentManager.SESSION_CONFIGS.length;
    const completedSessions = this.experimentManager.getCompletedSessionsCount();

    return {
      sessionCompleteness: completedSessions / totalSessions,
      hasAllSpeedConfigurations: this.checkAllSpeedConfigurations(),
      dataQualityScore: this.calculateDataQualityScore(),
    };
  }

  checkAllSpeedConfigurations() {
    const sessions = this.experimentManager.metrics;
    const configCombinations = new Set();

    sessions.forEach((session) => {
      if (session.speedConfig) {
        configCombinations.add(`${session.speedConfig.pacman}-${session.speedConfig.ghost}`);
      }
    });

    return configCombinations.size === this.experimentManager.SESSION_CONFIGS.length;
  }

  calculateDataQualityScore() {
    const sessions = this.experimentManager.metrics;
    let score = 0;
    let maxScore = 0;

    sessions.forEach((session) => {
      maxScore += 5; // Max points per session

      if (session.summary) score += 1;
      if (session.events && session.events.length > 0) score += 1;
      if (session.speedConfig) score += 1;
      if (session.summary && session.summary.gameTime > 0) score += 1;
      if (session.events && session.events.length > 10) score += 1; // Meaningful activity
    });

    return maxScore > 0 ? score / maxScore : 0;
  }

  enableAnonymization(fieldConfig = {}) {
    this.anonymization.enabled = true;
    this.anonymization.fieldMasking = {
      ...this.anonymization.fieldMasking,
      ...fieldConfig,
    };

    if (this.DEBUG) {
      console.log('[ExportManager] Anonymization enabled:', this.anonymization.fieldMasking);
    }
  }

  disableAnonymization() {
    this.anonymization.enabled = false;

    if (this.DEBUG) {
      console.log('[ExportManager] Anonymization disabled');
    }
  }

  handleExportRequest(detail) {
    const { format, options } = detail;
    return this.exportData(format, options);
  }

  generateCompletionReport() {
    const report = {
      experimentCompleted: true,
      completionTime: new Date().toISOString(),
      totalSessions: this.experimentManager.getCompletedSessionsCount(),
      dataQuality: this.assessDataCompleteness(),
      analytics: this.generateStatisticalSummary(),
      exportRecommendations: this.getExportRecommendations(),
    };

    if (this.DEBUG) {
      console.log('[ExportManager] Experiment completion report:', report);
    }

    return report;
  }

  getExportRecommendations() {
    return {
      recommendedFormats: ['json', 'csv', 'r'],
      statisticalAnalysis: 'Use R or Python scripts for comprehensive analysis',
      dataSharing: 'Enable anonymization for public data sharing',
      archival: 'Export to JSON for long-term data preservation',
    };
  }

  getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      supportedFormats: this.exportFormats,
      anonymizationConfig: this.anonymization,
      dataIntegrity: this.validateDataIntegrity(),
      completeness: this.assessDataCompleteness(),
    };
  }
}

// removeIf(production)
module.exports = ExportManager;
// endRemoveIf(production)
