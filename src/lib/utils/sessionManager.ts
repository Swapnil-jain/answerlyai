interface ConversationContext {
  sentPrompts: Set<string>;
  sentFAQs: Set<string>;
  workflowState: {
    currentNode?: string;
    visitedNodes: Set<string>;
  };
  lastQueryTimestamp: number;
  messageCount: number;  // Track messages in session
}

interface SessionCache {
  [sessionId: string]: ConversationContext;
}

const SESSION_TTL = 1000 * 60 * 15; // Reduced to 15 minutes
const MAX_SESSIONS_PER_USER = 3;     // Reduced from 5
const MAX_MESSAGES_PER_SESSION = 30; // Reduced from 50
const MAX_HISTORY_LENGTH = 3;        // New constant
const sessionCache: SessionCache = {};
const userSessions: { [userId: string]: Set<string> } = {};

export class SessionManager {
  private static generateSessionId(userId: string): string {
    return `${userId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  private static cleanSessions() {
    const now = Date.now();
    Object.entries(sessionCache).forEach(([sessionId, context]) => {
      if (now - context.lastQueryTimestamp > SESSION_TTL) {
        this.clearSession(sessionId);
      }
    });
  }

  private static enforceUserSessionLimit(userId: string) {
    const userSessionIds = userSessions[userId] || new Set();
    if (userSessionIds.size >= MAX_SESSIONS_PER_USER) {
      // Remove oldest session
      const oldestSessionId = Array.from(userSessionIds)[0];
      this.clearSession(oldestSessionId);
    }
  }

  static initSession(userId: string): string {
    this.cleanSessions();
    this.enforceUserSessionLimit(userId);

    const sessionId = this.generateSessionId(userId);
    
    sessionCache[sessionId] = {
      sentPrompts: new Set(),
      sentFAQs: new Set(),
      workflowState: {
        visitedNodes: new Set()
      },
      lastQueryTimestamp: Date.now(),
      messageCount: 0
    };

    // Track session for user
    if (!userSessions[userId]) {
      userSessions[userId] = new Set();
    }
    userSessions[userId].add(sessionId);

    return sessionId;
  }

  static updateContext(
    sessionId: string,
    promptTypes: string[],
    faqIds: string[],
    currentNode?: string
  ): boolean {
    const context = sessionCache[sessionId];
    if (!context) return false;

    // Compress history by limiting size
    if (context.messageCount > MAX_HISTORY_LENGTH) {
      context.sentPrompts = new Set(Array.from(context.sentPrompts).slice(-MAX_HISTORY_LENGTH));
      context.sentFAQs = new Set(Array.from(context.sentFAQs).slice(-MAX_HISTORY_LENGTH));
    }

    // Check message limit
    if (context.messageCount >= MAX_MESSAGES_PER_SESSION) {
      throw new Error('Session message limit reached. Please start a new session.');
    }

    // Update sent prompts
    promptTypes.forEach(type => context.sentPrompts.add(type));
    
    // Update sent FAQs
    faqIds.forEach(id => context.sentFAQs.add(id));
    
    // Update workflow state
    if (currentNode) {
      context.workflowState.currentNode = currentNode;
      context.workflowState.visitedNodes.add(currentNode);
    }

    context.lastQueryTimestamp = Date.now();
    context.messageCount++;

    return true;
  }

  static getRequiredContext(
    sessionId: string,
    promptTypes: string[],
    faqIds: string[]
  ): { 
    newPromptTypes: string[], 
    newFAQs: string[],
    workflowState: any 
  } {
    const context = sessionCache[sessionId];
    if (!context) {
      return { 
        newPromptTypes: promptTypes, 
        newFAQs: faqIds,
        workflowState: { visitedNodes: new Set() }
      };
    }

    // Check session expiry
    if (Date.now() - context.lastQueryTimestamp > SESSION_TTL) {
      this.clearSession(sessionId);
      return {
        newPromptTypes: promptTypes,
        newFAQs: faqIds,
        workflowState: { visitedNodes: new Set() }
      };
    }

    // Only return prompt types not sent before
    const newPromptTypes = promptTypes.filter(
      type => !context.sentPrompts.has(type)
    );

    // Only return FAQs not sent before
    const newFAQs = faqIds.filter(
      id => !context.sentFAQs.has(id)
    );

    return {
      newPromptTypes,
      newFAQs,
      workflowState: context.workflowState
    };
  }

  static clearSession(sessionId: string) {
    const context = sessionCache[sessionId];
    if (context) {
      // Remove from user sessions
      Object.entries(userSessions).forEach(([userId, sessions]) => {
        if (sessions.has(sessionId)) {
          sessions.delete(sessionId);
          if (sessions.size === 0) {
            delete userSessions[userId];
          }
        }
      });
      
      // Clear from session cache
      delete sessionCache[sessionId];
    }
  }

  // New utility methods
  static getActiveSessionCount(userId: string): number {
    return userSessions[userId]?.size || 0;
  }

  static getSessionMessageCount(sessionId: string): number {
    return sessionCache[sessionId]?.messageCount || 0;
  }
} 