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
    slow: 0.5,    // 70% of normal speed
    normal: 1.0,   // baseline
    fast: 1.5     // 130% of normal speed
  },
  ghost: {
    slow: 0.5,
    normal: 1.0,
    fast: 1.5
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
