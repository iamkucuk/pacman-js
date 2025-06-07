/**
 * Supabase Data Manager for Pac-Man Research Project
 * Handles all database operations for collecting research data
 */

class SupabaseDataManager {
  constructor() {
    this.supabaseUrl = 'https://kozbxghtgtnoldywzdmg.supabase.co';
    this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvemJ4Z2h0Z3Rub2xkeXd6ZG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMDYzODMsImV4cCI6MjA2NDg4MjM4M30.CEaWBTEWM_oj0vtgyQSHWRoLzZ98mYIGuhEtjeGNaC4';
    this.supabase = null;
    this.isInitialized = false;
    this.currentSessionId = null;
  }

  async initialize() {
    try {
      // Load Supabase client from CDN if not already loaded
      if (typeof window.supabase === 'undefined') {
        await this.loadSupabaseClient();
      }

      this.supabase = window.supabase.createClient(
        this.supabaseUrl,
        this.supabaseKey
      );

      this.isInitialized = true;
      console.log('[SupabaseDataManager] ✅ Initialized successfully');
      return true;
    } catch (error) {
      console.error('[SupabaseDataManager] ❌ Initialization failed:', error);
      return false;
    }
  }

  async loadSupabaseClient() {
    return new Promise((resolve, reject) => {
      if (typeof window.supabase !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.onload = () => {
        console.log('[SupabaseDataManager] 📦 Supabase client loaded');
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Supabase client'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize or get existing user in the database
   */
  async initializeUser(userId, sessionOrder = []) {
    if (!this.isInitialized) {
      throw new Error('SupabaseDataManager not initialized');
    }

    try {
      // Check if user exists
      const { data: existingUser, error: selectError } = await this.supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned", which is expected for new users
        throw selectError;
      }

      if (existingUser) {
        console.log('[SupabaseDataManager] 👤 User exists:', userId);
        return existingUser;
      }

      // Create new user
      const { data: newUser, error: insertError } = await this.supabase
        .from('users')
        .insert([
          {
            user_id: userId,
            session_order: sessionOrder,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      console.log('[SupabaseDataManager] ✨ New user created:', userId);
      return newUser;
    } catch (error) {
      console.error('[SupabaseDataManager] Error initializing user:', error);
      throw error;
    }
  }

  /**
   * Update user's session order
   */
  async updateUserSessionOrder(userId, sessionOrder) {
    if (!this.isInitialized) return false;

    try {
      const { error } = await this.supabase
        .from('users')
        .update({ session_order: sessionOrder })
        .eq('user_id', userId);

      if (error) throw error;

      console.log('[SupabaseDataManager] 📝 Session order updated for:', userId);
      return true;
    } catch (error) {
      console.error('[SupabaseDataManager] Error updating session order:', 
        error);
      return false;
    }
  }

  /**
   * Create a new session
   */
  async createSession(sessionData) {
    if (!this.isInitialized) {
      throw new Error('SupabaseDataManager not initialized');
    }

    try {
      const { data: session, error } = await this.supabase
        .from('sessions')
        .insert([
          {
            user_id: sessionData.userId,
            session_id: sessionData.sessionId,
            session_type: sessionData.permutationId + 1, // 1-9
            permutation_id: sessionData.permutationId,
            pacman_speed: sessionData.speedConfig.pacman,
            ghost_speed: sessionData.speedConfig.ghost,
            resumed: sessionData.resumed || false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      this.currentSessionId = session.id;
      console.log('[SupabaseDataManager] 🎮 Session created:', session.id);

      // Create initial session summary
      await this.createSessionSummary(session.id, sessionData.userId);

      return session;
    } catch (error) {
      console.error('[SupabaseDataManager] Error creating session:', error);
      throw error;
    }
  }

  /**
   * Create session summary record
   */
  async createSessionSummary(sessionId, userId) {
    try {
      const { data: summary, error } = await this.supabase
        .from('session_summaries')
        .insert([
          {
            session_id: sessionId,
            user_id: userId,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      console.log('[SupabaseDataManager] 📊 Session summary created');
      return summary;
    } catch (error) {
      console.error('[SupabaseDataManager] Error creating session summary:', 
        error);
      throw error;
    }
  }

  /**
   * Log an event during gameplay
   */
  async logEvent(eventData) {
    if (!this.isInitialized || !this.currentSessionId) return false;

    try {
      const { error } = await this.supabase
        .from('events')
        .insert([
          {
            session_id: this.currentSessionId,
            user_id: eventData.userId,
            event_type: eventData.type,
            event_time: eventData.time,
            event_data: eventData.data || {},
          },
        ]);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('[SupabaseDataManager] Error logging event:', error);
      return false;
    }
  }

  /**
   * Update session summary with aggregated metrics
   */
  async updateSessionSummary(summaryData) {
    if (!this.isInitialized || !this.currentSessionId) return false;

    try {
      const { error } = await this.supabase
        .from('session_summaries')
        .update({
          total_ghosts_eaten: summaryData.totalGhostsEaten,
          total_pellets_eaten: summaryData.totalPelletsEaten,
          total_pacdots_eaten: summaryData.totalPacdotsEaten || 0,
          total_power_pellets_eaten: summaryData.totalPowerPelletsEaten || 0,
          total_fruits_eaten: summaryData.totalFruitsEaten || 0,
          total_deaths: summaryData.totalDeaths,
          successful_turns: summaryData.successfulTurns,
          total_turns: summaryData.totalTurns,
        })
        .eq('session_id', this.currentSessionId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('[SupabaseDataManager] Error updating session summary:', 
        error);
      return false;
    }
  }

  /**
   * Complete a session
   */
  async completeSession(gameTime) {
    if (!this.isInitialized || !this.currentSessionId) return false;

    try {
      const { error } = await this.supabase
        .from('sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          total_game_time: gameTime,
        })
        .eq('id', this.currentSessionId);

      if (error) throw error;

      console.log('[SupabaseDataManager] ✅ Session completed:', 
        this.currentSessionId);
      this.currentSessionId = null;
      return true;
    } catch (error) {
      console.error('[SupabaseDataManager] Error completing session:', error);
      return false;
    }
  }

  /**
   * Get user's session data for local compatibility
   */
  async getUserData(userId) {
    if (!this.isInitialized) return null;

    try {
      // Get user with session order
      const { data: user, error: userError } = await this.supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (userError) throw userError;

      // Get completed sessions count
      const { data: completedSessions, error: sessionsError } = await this
        .supabase
        .from('sessions')
        .select('session_id')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (sessionsError) throw sessionsError;

      return {
        userId,
        sessionOrder: user.session_order,
        completedSessionsCount: completedSessions.length,
      };
    } catch (error) {
      console.error('[SupabaseDataManager] Error getting user data:', error);
      return null;
    }
  }

  /**
   * Export all user data for research analysis
   */
  async exportUserData(userId) {
    if (!this.isInitialized) return null;

    try {
      // Get all sessions with summaries
      const { data: sessions, error } = await this.supabase
        .from('sessions')
        .select(`
          *,
          session_summaries (*),
          events (*)
        `)
        .eq('user_id', userId)
        .order('session_id');

      if (error) throw error;

      return {
        userId,
        sessions,
        exportTimestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[SupabaseDataManager] Error exporting data:', error);
      return null;
    }
  }

  /**
   * Get aggregated research data (for researchers)
   */
  async getResearchData(filters = {}) {
    if (!this.isInitialized) return null;

    try {
      let query = this.supabase
        .from('sessions')
        .select(`
          *,
          session_summaries (*),
          users!inner (user_id)
        `);

      // Apply filters
      if (filters.sessionType) {
        query = query.eq('session_type', filters.sessionType);
      }
      if (filters.pacmanSpeed) {
        query = query.eq('pacman_speed', filters.pacmanSpeed);
      }
      if (filters.ghostSpeed) {
        query = query.eq('ghost_speed', filters.ghostSpeed);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('[SupabaseDataManager] Error getting research data:', 
        error);
      return null;
    }
  }

  /**
   * Check connection status
   */
  async testConnection() {
    if (!this.isInitialized) return false;

    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('[SupabaseDataManager] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get database health stats
   */
  async getHealthStats() {
    if (!this.isInitialized) return null;

    try {
      const [usersResult, sessionsResult, eventsResult] = await Promise.all([
        this.supabase.from('users').select('count'),
        this.supabase.from('sessions').select('count'),
        this.supabase.from('events').select('count'),
      ]);

      return {
        totalUsers: usersResult.data?.[0]?.count || 0,
        totalSessions: sessionsResult.data?.[0]?.count || 0,
        totalEvents: eventsResult.data?.[0]?.count || 0,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[SupabaseDataManager] Error getting health stats:', 
        error);
      return null;
    }
  }

  /**
   * Delete all user data from database (for experiment reset)
   */
  async deleteUserData(userId) {
    if (!this.isInitialized) {
      console.error('[SupabaseDataManager] Cannot delete user data - not initialized');
      return false;
    }

    try {
      console.log('[SupabaseDataManager] 🗑️ Starting deletion of user data:', userId);

      // First, verify the user exists
      const { data: userCheck, error: userCheckError } = await this.supabase
        .from('users')
        .select('user_id')
        .eq('user_id', userId);

      if (userCheckError) {
        console.error('[SupabaseDataManager] Error checking user existence:', userCheckError);
        throw userCheckError;
      }

      if (!userCheck || userCheck.length === 0) {
        console.log('[SupabaseDataManager] ℹ️ No user found with ID:', userId);
        return { success: true, message: 'No user data found to delete' };
      }

      console.log('[SupabaseDataManager] ✅ User exists, proceeding with deletion');

      // Get all session IDs for this user first
      const { data: sessions, error: sessionError } = await this.supabase
        .from('sessions')
        .select('id, session_id')
        .eq('user_id', userId);

      if (sessionError) {
        console.error('[SupabaseDataManager] Error fetching sessions:', sessionError);
        throw sessionError;
      }

      const sessionIds = sessions.map(session => session.id);
      console.log('[SupabaseDataManager] Found sessions to delete:', sessions);

      // Delete in order: events -> session_summaries -> sessions -> users
      if (sessionIds.length > 0) {
        // Delete events
        console.log('[SupabaseDataManager] 🗑️ Deleting events for sessions:', sessionIds);
        const { data: deletedEvents, error: eventsError } = await this.supabase
          .from('events')
          .delete()
          .in('session_id', sessionIds)
          .select();

        if (eventsError) {
          console.error('[SupabaseDataManager] Error deleting events:', eventsError);
          throw eventsError;
        }
        console.log('[SupabaseDataManager] ✅ Deleted events:', deletedEvents?.length || 0);

        // Delete session summaries
        console.log('[SupabaseDataManager] 🗑️ Deleting session summaries for sessions:', sessionIds);
        const { data: deletedSummaries, error: summariesError } = await this.supabase
          .from('session_summaries')
          .delete()
          .in('session_id', sessionIds)
          .select();

        if (summariesError) {
          console.error('[SupabaseDataManager] Error deleting session summaries:', summariesError);
          throw summariesError;
        }
        console.log('[SupabaseDataManager] ✅ Deleted session summaries:', deletedSummaries?.length || 0);

        // Delete sessions
        console.log('[SupabaseDataManager] 🗑️ Deleting sessions for user:', userId);
        const { data: deletedSessions, error: sessionsError } = await this.supabase
          .from('sessions')
          .delete()
          .eq('user_id', userId)
          .select();

        if (sessionsError) {
          console.error('[SupabaseDataManager] Error deleting sessions:', sessionsError);
          throw sessionsError;
        }
        console.log('[SupabaseDataManager] ✅ Deleted sessions:', deletedSessions?.length || 0);
      } else {
        console.log('[SupabaseDataManager] ℹ️ No sessions found for user:', userId);
      }

      // Delete user record
      console.log('[SupabaseDataManager] 🗑️ Deleting user record:', userId);
      const { data: deletedUser, error: userError } = await this.supabase
        .from('users')
        .delete()
        .eq('user_id', userId)
        .select();

      if (userError) {
        console.error('[SupabaseDataManager] Error deleting user record:', userError);
        throw userError;
      }
      console.log('[SupabaseDataManager] ✅ Deleted user record:', deletedUser);

      // Reset current session ID if it belongs to this user
      this.currentSessionId = null;

      // Verify deletion by checking if any data remains
      const { data: remainingSessions } = await this.supabase
        .from('sessions')
        .select('id')
        .eq('user_id', userId);

      const { data: remainingUser } = await this.supabase
        .from('users')
        .select('user_id')
        .eq('user_id', userId);

      if (remainingSessions?.length > 0 || remainingUser?.length > 0) {
        console.error('[SupabaseDataManager] ⚠️ Deletion verification failed - data still exists!');
        console.error('Remaining sessions:', remainingSessions);
        console.error('Remaining user:', remainingUser);
        return { success: false, message: 'Deletion verification failed - data still exists' };
      }

      console.log('[SupabaseDataManager] 🎉 Successfully deleted all data for user:', userId);
      console.log('[SupabaseDataManager] ✅ Deletion verified - no data remains');
      return { success: true, message: 'All user data successfully deleted' };
    } catch (error) {
      console.error('[SupabaseDataManager] ❌ Error deleting user data:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Delete the last (most recent) session's data for a user
   */
  async deleteLastSession(userId) {
    if (!this.isInitialized) return false;

    try {
      console.log('[SupabaseDataManager] 🗑️ Starting deletion of last session for user:', userId);

      // Get the most recent session for this user
      const { data: lastSession, error: sessionError } = await this.supabase
        .from('sessions')
        .select('id, session_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (sessionError) {
        if (sessionError.code === 'PGRST116') {
          console.log('[SupabaseDataManager] ℹ️ No sessions found for user:', userId);
          return { success: true, message: 'No sessions found to delete' };
        }
        throw sessionError;
      }

      console.log('[SupabaseDataManager] Found last session to delete:', lastSession);

      // Delete in order: events -> session_summaries -> sessions
      // Delete events for this session
      const { error: eventsError } = await this.supabase
        .from('events')
        .delete()
        .eq('session_id', lastSession.id);

      if (eventsError) throw eventsError;
      console.log('[SupabaseDataManager] ✅ Deleted events for session:', lastSession.id);

      // Delete session summary for this session
      const { error: summaryError } = await this.supabase
        .from('session_summaries')
        .delete()
        .eq('session_id', lastSession.id);

      if (summaryError) throw summaryError;
      console.log('[SupabaseDataManager] ✅ Deleted session summary for session:', lastSession.id);

      // Delete the session record
      const { error: sessionDeleteError } = await this.supabase
        .from('sessions')
        .delete()
        .eq('id', lastSession.id);

      if (sessionDeleteError) throw sessionDeleteError;
      console.log('[SupabaseDataManager] ✅ Deleted session record:', lastSession.id);

      // Reset current session ID if it matches the deleted session
      if (this.currentSessionId === lastSession.id) {
        this.currentSessionId = null;
      }

      console.log('[SupabaseDataManager] 🎉 Successfully deleted last session:', lastSession.session_id);
      return { 
        success: true, 
        message: `Deleted session ${lastSession.session_id}`,
        deletedSessionId: lastSession.session_id 
      };
    } catch (error) {
      console.error('[SupabaseDataManager] ❌ Error deleting last session:', error);
      return { success: false, message: error.message };
    }
  }
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SupabaseDataManager;
} else {
  window.SupabaseDataManager = SupabaseDataManager;
}