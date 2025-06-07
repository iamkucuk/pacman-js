# Supabase Integration for Pac-Man Research Project

## Overview

The Pac-Man research project now includes full Supabase integration for collecting and analyzing research data. This provides a robust, cloud-based database solution that automatically collects participant data while maintaining backward compatibility with localStorage.

## Database Schema

The Supabase database consists of four main tables:

### 1. Users Table
- **Purpose**: Store participant information and session ordering
- **Columns**:
  - `id` (UUID): Primary key
  - `user_id` (TEXT): Unique participant identifier
  - `session_order` (JSONB): Randomized order of 9 sessions
  - `created_at`, `updated_at`: Timestamps

### 2. Sessions Table
- **Purpose**: Store session metadata for each gameplay session
- **Columns**:
  - `id` (UUID): Primary key
  - `user_id` (TEXT): Links to users table
  - `session_id` (INT): Session number (1-9)
  - `session_type` (INT): Session type for research analysis (1-9)
  - `permutation_id` (INT): Speed configuration ID (0-8)
  - `pacman_speed`, `ghost_speed` (TEXT): Speed settings
  - `status` (TEXT): 'active', 'completed', or 'abandoned'
  - `started_at`, `completed_at`: Session timing
  - `total_game_time` (INT): Total gameplay time in milliseconds
  - `resumed` (BOOLEAN): Whether session was resumed

### 3. Session Summaries Table
- **Purpose**: Store aggregated metrics for each session
- **Columns**:
  - `session_id` (UUID): Links to sessions table
  - `total_ghosts_eaten`, `total_pellets_eaten`: Consumption metrics
  - `total_pacdots_eaten`, `total_power_pellets_eaten`, `total_fruits_eaten`: Detailed consumption
  - `total_deaths`: Death count
  - `successful_turns`, `total_turns`: Navigation metrics

### 4. Events Table
- **Purpose**: Store detailed event logs during gameplay
- **Columns**:
  - `session_id` (UUID): Links to sessions table
  - `event_type` (TEXT): Type of event (ghostEaten, pelletEaten, death, turnComplete)
  - `event_time` (INT): Milliseconds from session start
  - `event_data` (JSONB): Additional event-specific data

## Features

### Automatic Data Collection
- **Real-time event logging**: Every game action is automatically logged to Supabase
- **Session management**: Sessions are created, tracked, and completed automatically
- **Dual storage**: Data is saved to both Supabase and localStorage for reliability
- **Fallback support**: If Supabase is unavailable, the system falls back to localStorage

### Data Export Options
1. **CSV Export**: Continues to work as before, generates CSV files for individual users
2. **Supabase JSON Export**: New feature to export comprehensive user data from Supabase
3. **Research Data Access**: Methods to query aggregated data across all participants

### Research Analytics
- **Cross-participant analysis**: Query data across multiple users
- **Speed configuration filtering**: Filter by specific Pac-Man or ghost speeds
- **Session type analysis**: Analyze performance by session type (1-9)
- **Real-time health monitoring**: Check database status and participant counts

## Usage

### For Participants (No Changes Required)
The integration is completely transparent to participants. They continue to:
1. Enter their User ID
2. Play through 9 sessions as before
3. Data is automatically collected and stored

### For Researchers

#### Accessing Individual User Data
```javascript
// Get comprehensive user data from Supabase
const userData = await experimentManager.exportSupabaseData();

// Test Supabase connection
const isConnected = await experimentManager.testSupabaseConnection();

// Get database health stats
const stats = await experimentManager.getSupabaseHealthStats();
```

#### Querying Research Data
```javascript
// Get all completed sessions
const allData = await experimentManager.getResearchData({
  status: 'completed'
});

// Filter by specific speed configurations
const fastPacmanData = await experimentManager.getResearchData({
  pacmanSpeed: 'fast'
});

// Filter by session type
const sessionType1Data = await experimentManager.getResearchData({
  sessionType: 1
});
```

#### Direct Supabase Access
You can also access Supabase directly using the project credentials:
- **Project URL**: `https://kozbxghtgtnoldywzdmg.supabase.co`
- **Database**: Available via Supabase dashboard
- **Tables**: `users`, `sessions`, `session_summaries`, `events`

## Data Analysis Examples

### Session Performance by Speed Configuration
```sql
SELECT 
  pacman_speed,
  ghost_speed,
  AVG(ss.total_ghosts_eaten) as avg_ghosts,
  AVG(ss.total_deaths) as avg_deaths,
  AVG(s.total_game_time) as avg_time
FROM sessions s
JOIN session_summaries ss ON s.id = ss.session_id
WHERE s.status = 'completed'
GROUP BY pacman_speed, ghost_speed;
```

### Event Analysis
```sql
SELECT 
  event_type,
  COUNT(*) as event_count,
  AVG(event_time) as avg_time_to_event
FROM events
GROUP BY event_type;
```

### Participant Progress
```sql
SELECT 
  user_id,
  COUNT(*) as completed_sessions,
  MIN(started_at) as first_session,
  MAX(completed_at) as last_session
FROM sessions
WHERE status = 'completed'
GROUP BY user_id;
```

## Configuration

### Enabling/Disabling Supabase
The system automatically detects Supabase availability. To manually control:

```javascript
// Disable Supabase (use localStorage only)
experimentManager.useSupabase = false;

// Check current status
console.log('Supabase enabled:', experimentManager.useSupabase);
console.log('Supabase initialized:', experimentManager.supabaseManager?.isInitialized);
```

### Fallback Behavior
If Supabase is unavailable:
1. The system automatically falls back to localStorage
2. All existing functionality continues to work
3. CSV exports still function normally
4. Console warnings indicate fallback mode

## Security and Privacy

### Data Protection
- **Anonymous by design**: Only user-provided IDs are stored, no personal information
- **Secure transmission**: All data is transmitted over HTTPS
- **Access control**: Database access is controlled via Supabase Row Level Security (can be configured)

### GDPR Compliance
- **Data minimization**: Only necessary gameplay data is collected
- **User control**: Participants can request data deletion (contact researcher)
- **Transparency**: This document serves as data collection notice

## Troubleshooting

### Common Issues

1. **Supabase Connection Failed**
   - Check internet connection
   - Verify Supabase project is active
   - System will fallback to localStorage automatically

2. **Missing Data in Supabase**
   - Check console for error messages
   - Verify user completed sessions (status = 'completed')
   - Data might be in localStorage if Supabase was unavailable

3. **Performance Issues**
   - Supabase operations are asynchronous and shouldn't affect gameplay
   - If issues persist, Supabase can be disabled manually

### Debug Information
Access debug information via:
```javascript
const debug = experimentManager.getDebugInfo();
console.log('Debug info:', debug);
```

This includes:
- Current user and session status
- Supabase connection status
- Session progress information

## Benefits of Supabase Integration

### For Researchers
1. **Real-time data collection**: No need to manually collect CSV files
2. **Comprehensive analytics**: Query data across all participants
3. **Data reliability**: Cloud storage with automatic backups
4. **Scalability**: Handle hundreds of participants easily
5. **Advanced queries**: Use SQL for complex data analysis

### For Participants
1. **Seamless experience**: No changes to gameplay
2. **Data safety**: Multiple storage locations prevent data loss
3. **Privacy protection**: Only gameplay data is collected

### For Developers
1. **Modern infrastructure**: Cloud-based, scalable database
2. **Easy maintenance**: Managed database service
3. **Development tools**: Supabase dashboard for data inspection
4. **Backup compatibility**: localStorage fallback ensures reliability

## Data Export Formats

### CSV Format (Existing)
- Individual user files
- One row per session
- Compatible with Excel/SPSS/R

### JSON Format (New)
- Comprehensive user data
- Includes detailed event logs
- Structured for programmatic analysis

### Direct Database Access
- SQL queries via Supabase dashboard
- REST API access for custom tools
- Real-time data monitoring

## Next Steps

1. **Monitor data collection**: Check Supabase dashboard regularly
2. **Analyze pilot data**: Use the provided SQL examples
3. **Scale up**: The system is ready for full research deployment
4. **Export final dataset**: Use research data export functions when study is complete

## Support

For technical issues or questions about the Supabase integration:
1. Check console logs for error messages
2. Review this documentation
3. Test with the debug methods provided
4. Contact the development team with specific error messages

---

**Project**: Pac-Man Speed Research Study  
**Database**: Supabase (kozbxghtgtnoldywzdmg)  
**Integration Date**: June 2025  
**Version**: 1.0