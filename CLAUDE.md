# CLAUDE.md - Pac-Man Research Project Guidelines

## Project Overview
This is a research project to investigate how different speed configurations affect gameplay in Pac-Man. We are tracking player metrics across 9 different speed permutations (3 ghost speeds × 3 Pac-Man speeds) with randomized session ordering.

## Core Requirements

### 1. Experiment Variables
- **Independent Variables**: 
  - Ghost speeds: Slow, Normal, Fast
  - Pac-Man speeds: Slow, Normal, Fast
- **Dependent Variables** (metrics to track):
  - Number of ghosts eaten per round
  - Number of pellets/meals eaten per round
  - Successful/unsuccessful turns (define criteria)
  - Number of deaths
  - Timestamps for all events

Each session consists one permutation (ghost and pac-man)

### 2. User Management
- Each player must enter a unique user ID
- Sessions must be randomized but consistent per user
- All data must be associated with user ID and session number
- Session ID should be also shown.
- Number of sessions user completed should be shown as x/9, x is the number of sessions completed.
- Session ID is also shown.

## Development Guidelines

### Testing Requirements
- Write tests FIRST (TDD approach)
- Maintain 100% code coverage for new code
- Test all 9 speed permutations
- Include edge cases (e.g., simultaneous events)

## Implementation Priorities

### Phase 1: Foundation (Do First)
1. Create experiment file structure
2. Implement user ID system
3. Set up data storage (recommend JSON format)
4. Create speed configuration system

### Phase 2: Core Metrics
1. Implement metrics tracking:
   ```javascript
   const metrics = {
     userId: string,
     sessionId: number,
     speedConfig: { ghost: string, pacman: string },
     timestamp: Date,
     events: [
       { type: 'ghostEaten', time: number, ghostId: string },
       { type: 'pelletEaten', time: number, position: {x, y} },
       { type: 'death', time: number, cause: string },
       { type: 'turnComplete', time: number, success: boolean }
     ],
     summary: {
       totalGhostsEaten: number,
       totalPelletsEaten: number,
       totalDeaths: number,
       successfulTurns: number,
       totalTurns: number,
       gameTime: number
     }
   };
   ```

### Phase 3: Session Management
1. Implement session randomization. 
2. Create session progression system
3. Add session UI indicators
4. Ensure data persistence between sessions

### Phase 4: Data Export
1. Create data export functionality (CSV/JSON)
2. Add data visualization (optional)
3. Implement backup system

## Speed Configuration Guidelines

```javascript
const SPEED_CONFIGS = {
  pacman: {
    slow: 0.3,    // Very slow - 30% of normal speed
    normal: 1.0,  // Baseline
    fast: 2.5     // Very fast - 250% of normal speed
  },
  ghost: {
    slow: 0.2,    // Very slow - 20% of normal speed  
    normal: 1.0,  // Baseline
    fast: 3.0     // Very fast - 300% of normal speed
  }
};
```

## Common Pitfalls to Avoid

1. **Don't modify core game logic directly** - Use event listeners and observers
2. **Don't store data only in memory** - Save frequently to prevent data loss
3. **Don't hardcode speed values** - Use the config system
4. **Don't forget edge cases** - What happens if user refreshes mid-game?
5. **Don't skip validation** - Verify user IDs and session integrity

## Debugging Tips

1. Use extensive console logging during development:
   ```javascript
   console.log('[METRICS]', 'Ghost eaten:', ghostId, 'at', timestamp);
   ```

2. Create debug mode flag:
   ```javascript
   const DEBUG = true;
   if (DEBUG) {
     // Show speed indicators
     // Display session info
     // Log all events
   }
   ```

3. Test individual components in isolation

## Performance Considerations

1. Throttle metric saves (every 5 seconds or on significant events)
2. Use requestAnimationFrame for smooth speed changes
3. Optimize event listeners to prevent memory leaks
4. Consider using Web Workers for data processing

Always provide:
1. Current file structure
2. Specific error messages
3. What you've already tried
4. Which of the 9 permutations you're testing
5. Any relevant code snippets

Prefer asking Claude to:
1. Write tests first
2. Explain the approach before coding
3. Consider edge cases
4. Validate against requirements
5. Suggest performance optimizations

# Document What Works

Update your docs and README.AI.md and README.md as you progress and extensively.

## Change Logging Requirements

**MANDATORY**: With each modification to the codebase, you MUST log changes in this file. This maintains a complete development history and helps track the evolution of the experimental platform.

### Change Log Format

Add entries at the bottom of this file using the following format:

```markdown
## CHANGE LOG

### [YYYY-MM-DD] - Change Description
**Files Modified:** 
- `path/to/file1.js` - Description of changes
- `path/to/file2.js` - Description of changes

**Type:** [Bug Fix | Feature | Enhancement | Refactor | Documentation]

**Severity:** [Critical | High | Medium | Low]

**Description:**
Brief description of what was changed and why.

**Impact:**
- How this affects the experiment functionality
- Any performance implications
- Testing implications

**Related Issues:**
- Links to any related bugs or requirements
- Test failures this addresses

**Testing:**
- New tests added
- Existing tests modified
- Manual testing performed

---
```

### Change Categories

- **Bug Fix**: Resolving identified issues or test failures
- **Feature**: Adding new experimental capabilities
- **Enhancement**: Improving existing functionality
- **Refactor**: Code organization without functional changes
- **Documentation**: Updates to docs, comments, or README files

### Logging Rules

1. **Every code change must be logged** - No exceptions
2. **Log immediately after making changes** - Don't batch multiple changes
3. **Be specific about file locations** - Include line numbers for significant changes
4. **Include impact assessment** - How does this affect the experiment?
5. **Reference any tests** - What testing was done to verify the change?
6. **Cross-reference issues** - Link to any bugs or requirements addressed

### Example Entry

```markdown
### [2024-06-06] - Fixed CustomEvent Constructor Issue
**Files Modified:** 
- `app/scripts/experiment/experimentUI.js:165` - Added CustomEvent polyfill for test environment
- `app/tests/experimentUI.test.js:12-20` - Added proper global mocking setup

**Type:** Bug Fix

**Severity:** Critical

**Description:**
Fixed TypeError where CustomEvent constructor was not available in Node.js test environment, causing experiment UI tests to fail.

**Impact:**
- Resolves critical test failures in experiment UI
- Enables proper event dispatching in both browser and test environments
- No performance impact on production code

**Related Issues:**
- Addresses test failure: "TypeError: window.CustomEvent is not a constructor"
- Related to npm test blocking git push operations

**Testing:**
- Added CustomEvent mock in test setup
- Verified experimentUI.test.js now passes
- Confirmed browser functionality unchanged

---
```

This change logging system will help maintain code quality, track the evolution of experimental features, and provide valuable context for future development work.

## CHANGE LOG

### [2024-06-06] - Added Mandatory Change Logging Requirements
**Files Modified:** 
- `CLAUDE.md:150-239` - Added comprehensive change logging requirements and guidelines

**Type:** Documentation

**Severity:** Medium

**Description:**
Added mandatory change logging requirements to ensure all codebase modifications are properly documented. This includes detailed format specifications, change categories, logging rules, and example entries.

**Impact:**
- Establishes systematic tracking of all code changes
- Improves code maintainability and development history
- Provides clear guidelines for future contributors
- No functional impact on experimental platform

**Related Issues:**
- Addresses need for better change tracking identified in repository analysis
- Supports requirement for comprehensive documentation

**Testing:**
- No testing required (documentation only)
- Verified format renders correctly in markdown

---

### [2025-01-06] - Reorganized User ID Input Flow in Main Menu
**Files Modified:** 
- `index.html:33-62` - Added user ID input section and session info to main menu
- `app/style/scss/mainPage.scss:205-389` - Created styled user ID interface with Pac-Man theme
- `app/scripts/core/gameCoordinator.js:96-300` - Added user ID flow handling and session transitions
- `app/scripts/experiment/experimentUI.js:28-122` - Converted to minimal debug-only interface
- `build/app.css` - Compiled CSS with new styles
- `build/app.js` - Compiled JavaScript with new functionality

**Type:** Feature

**Severity:** Medium

**Description:**
Moved user ID collection from floating interface to main menu for better UX. Users now enter their ID before seeing the PLAY button, creating a cleaner research experiment workflow.

**Impact:**
- Improved user experience flow - ID input comes before game button
- Better visual integration with Pac-Man theme
- Cleaner main menu interface without conflicting UI elements
- Session information prominently displayed after confirmation
- Mobile responsive design for new elements
- Debug interface moved to top-right corner

**Related Issues:**
- User requested ID input before PLAY button appears
- Addresses UX flow issues with overlapping interfaces

**Testing:**
- Manual testing of user ID input and validation
- Session transition flow verified
- Mobile responsive design tested
- Integration with existing experiment system confirmed

---

### [2025-01-06] - Implemented Session Data CSV Export System
**Files Modified:** 
- `app/scripts/experiment/experimentManager.js:333-631` - Added CSV export functionality and session data saving
- `app/scripts/experiment/experimentUI.js:226-244` - Updated export handling to use new CSV system

**Type:** Feature

**Severity:** High

**Description:**
Implemented comprehensive CSV export system that automatically saves each completed session to user-specific CSV files. Added session type tracking (1-9) based on speed permutations and automatic file download after each session.

**Impact:**
- Each session completion now automatically generates and downloads a CSV file for the user
- Session data includes all required metrics: userId, sessionId, sessionType (1-9), permutationId, speeds, and performance stats
- CSV files are incrementally built - each session adds one row to the user's file
- Manual export functionality available through experiment UI
- Data persistence in localStorage for session continuity
- Session type correctly maps permutationId + 1 for easier research analysis

**Related Issues:**
- User request for automatic CSV saving after each session
- Need for session type identification (1-9 range)
- Requirement for individual user CSV files with cumulative data

**Testing:**
- Created and ran comprehensive CSV functionality tests
- Verified session type calculation (permutationId + 1)
- Tested CSV row generation with all required fields
- Confirmed headers match expected format
- Validated automatic download and localStorage persistence

---

### [2025-01-06] - Implemented Comprehensive Supabase Integration for Research Data Collection
**Files Modified:** 
- `app/scripts/experiment/supabaseDataManager.js` - Created new Supabase data manager class
- `app/scripts/experiment/experimentManager.js:1-50` - Added Supabase initialization and integration
- `app/scripts/experiment/experimentManager.js:70-114` - Updated user initialization for Supabase
- `app/scripts/experiment/experimentManager.js:130-191` - Enhanced session creation with Supabase logging
- `app/scripts/experiment/experimentManager.js:256-294` - Updated event logging for dual storage
- `app/scripts/experiment/experimentManager.js:411-464` - Enhanced session completion with Supabase updates
- `app/scripts/experiment/experimentManager.js:485-523` - Updated data saving for Supabase integration
- `app/scripts/experiment/experimentManager.js:750-861` - Added research data export and analysis methods
- `SUPABASE_INTEGRATION.md` - Created comprehensive integration documentation
- `test_supabase.html` - Created test interface for Supabase functionality

**Type:** Feature

**Severity:** High

**Description:**
Implemented complete Supabase cloud database integration for research data collection while maintaining backward compatibility with localStorage. This provides researchers with real-time data collection, advanced analytics capabilities, and scalable cloud storage.

**Impact:**
- **Research Enhancement**: Real-time cloud data collection across all participants
- **Data Reliability**: Dual storage (Supabase + localStorage) prevents data loss
- **Analytics Power**: SQL-based querying and cross-participant analysis
- **Scalability**: Cloud infrastructure supports hundreds of participants
- **Automatic Fallback**: System continues working if Supabase is unavailable
- **Researcher Tools**: New methods for data export and health monitoring
- **Privacy Compliant**: Anonymous data collection with GDPR considerations

**Database Schema:**
- `users` table: Participant information and session ordering
- `sessions` table: Session metadata with speed configurations
- `session_summaries` table: Aggregated performance metrics
- `events` table: Detailed event logs during gameplay

**New Features:**
- Automatic real-time event logging to cloud database
- Research data export in JSON format with comprehensive event logs
- Cross-participant data analysis with filtering capabilities
- Database health monitoring and connection testing
- Transparent integration - no changes required for participants
- Advanced SQL-based analytics for researchers

**Research Benefits:**
- No manual CSV collection required - data flows to cloud automatically
- Query performance across different speed configurations
- Real-time monitoring of experiment progress
- Backup and recovery through cloud infrastructure
- Advanced statistical analysis capabilities through SQL

**Related Issues:**
- User request for cloud-based data collection system
- Need for real-time research data analysis capabilities
- Requirement for scalable participant management
- Research team need for centralized data access

**Testing:**
- Created comprehensive test suite in `test_supabase.html`
- Verified user creation, session flow, and event logging
- Tested fallback behavior when Supabase unavailable
- Confirmed backward compatibility with existing localStorage system
- Validated data integrity across both storage systems

---
