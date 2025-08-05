import { DatabaseService } from '../services/database';
import { RAGService } from '../services/rag';
import { storage } from './storage';
import { AIInteraction, Session, Memory, ActionItem } from '../types';

export class MigrationService {
  private db: DatabaseService;
  private rag: RAGService;

  constructor(db: DatabaseService, rag: RAGService) {
    this.db = db;
    this.rag = rag;
  }

  /**
   * Migrate all localStorage data to the database
   */
  async migrateAllData(userId: string): Promise<{
    interactions: number;
    sessions: number;
    memories: number;
    actionItems: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let interactions = 0;
    let sessions = 0;
    let memories = 0;
    let actionItems = 0;

    try {
      // Migrate interactions
      const interactionCount = await this.migrateInteractions(userId);
      interactions = interactionCount;

      // Migrate sessions
      const sessionCount = await this.migrateSessions(userId);
      sessions = sessionCount;

      // Migrate memories
      const memoryCount = await this.migrateMemories(userId);
      memories = memoryCount;

      // Migrate action items
      const actionItemCount = await this.migrateActionItems(userId);
      actionItems = actionItemCount;

    } catch (error) {
      errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      interactions,
      sessions,
      memories,
      actionItems,
      errors
    };
  }

  /**
   * Migrate AI interactions from localStorage
   */
  private async migrateInteractions(userId: string): Promise<number> {
    const interactions = storage.getInteractions();
    let count = 0;

    for (const interaction of interactions) {
      try {
        await this.db.createAiInteraction({
          user_id: userId,
          prompt: interaction.prompt,
          response: interaction.response,
          platform: interaction.platform,
          model: interaction.model,
          timestamp: interaction.timestamp,
          tags: interaction.tags,
          summary: interaction.summary,
          embedding: interaction.embedding,
          tokens_used: 0 // Will be calculated if needed
        });
        count++;
      } catch (error) {
        console.error(`Failed to migrate interaction ${interaction.id}:`, error);
      }
    }

    return count;
  }

  /**
   * Migrate sessions from localStorage
   */
  private async migrateSessions(userId: string): Promise<number> {
    const sessions = storage.getSessions();
    let count = 0;

    for (const session of sessions) {
      try {
        await this.db.createSession({
          user_id: userId,
          title: session.title,
          platform: session.platform,
          start_time: new Date(session.startTime).toISOString(),
          end_time: session.endTime ? new Date(session.endTime).toISOString() : undefined,
          summary: session.summary,
          themes: session.themes,
          total_interactions: session.totalInteractions
        });
        count++;
      } catch (error) {
        console.error(`Failed to migrate session ${session.id}:`, error);
      }
    }

    return count;
  }

  /**
   * Migrate memories from localStorage and create embeddings
   */
  private async migrateMemories(userId: string): Promise<number> {
    const memories = storage.getMemories();
    let count = 0;

    // Prepare memory data for batch creation
    const memoryData = memories.map(memory => ({
      content: memory.content,
      sourceType: memory.source as 'task' | 'note' | 'chat' | 'interaction' | 'summary' | 'manual',
      sourceId: memory.sourceId,
      tags: memory.tags
    }));

    try {
      const createdMemories = await this.rag.createMemoriesFromData(userId, memoryData);
      count = createdMemories.length;
    } catch (error) {
      console.error('Failed to migrate memories:', error);
    }

    return count;
  }

  /**
   * Migrate action items from localStorage
   */
  private async migrateActionItems(userId: string): Promise<number> {
    const actionItems = storage.getActionItems();
    let count = 0;

    for (const actionItem of actionItems) {
      try {
        await this.db.createActionItem({
          user_id: userId,
          text: actionItem.text,
          completed: actionItem.completed,
          priority: actionItem.priority,
          category: actionItem.category,
          due_date: actionItem.dueDate ? new Date(actionItem.dueDate).toISOString().split('T')[0] : undefined,
          source_interaction_id: actionItem.sourceInteractionId,
          source_session_id: undefined // Will need to be mapped if available
        });
        count++;
      } catch (error) {
        console.error(`Failed to migrate action item ${actionItem.id}:`, error);
      }
    }

    return count;
  }

  /**
   * Create memories from existing interactions (for RAG enhancement)
   */
  async createMemoriesFromInteractions(userId: string): Promise<number> {
    const interactions = storage.getInteractions();
    let count = 0;

    // Create memory data from interactions
    const memoryData = interactions.map(interaction => ({
      content: `${interaction.prompt}\n\n${interaction.response}`,
      sourceType: 'interaction' as const,
      sourceId: interaction.id,
      tags: interaction.tags
    }));

    try {
      const createdMemories = await this.rag.createMemoriesFromData(userId, memoryData);
      count = createdMemories.length;
    } catch (error) {
      console.error('Failed to create memories from interactions:', error);
    }

    return count;
  }

  /**
   * Verify migration success
   */
  async verifyMigration(userId: string): Promise<{
    localStorageCounts: {
      interactions: number;
      sessions: number;
      memories: number;
      actionItems: number;
    };
    databaseCounts: {
      interactions: number;
      sessions: number;
      memories: number;
      actionItems: number;
    };
    matches: boolean;
  }> {
    // Get localStorage counts
    const localStorageCounts = {
      interactions: storage.getInteractions().length,
      sessions: storage.getSessions().length,
      memories: storage.getMemories().length,
      actionItems: storage.getActionItems().length
    };

    // Get database counts
    const [dbInteractions, dbSessions, dbMemories, dbActionItems] = await Promise.all([
      this.db.getAiInteractions(userId),
      this.db.getSessions(userId),
      this.db.getMemoriesBySourceType(userId, 'interaction'),
      this.db.getActionItems(userId)
    ]);

    const databaseCounts = {
      interactions: dbInteractions.length,
      sessions: dbSessions.length,
      memories: dbMemories.length,
      actionItems: dbActionItems.length
    };

    const matches = 
      localStorageCounts.interactions === databaseCounts.interactions &&
      localStorageCounts.sessions === databaseCounts.sessions &&
      localStorageCounts.actionItems === databaseCounts.actionItems;

    return {
      localStorageCounts,
      databaseCounts,
      matches
    };
  }

  /**
   * Clear localStorage after successful migration
   */
  clearLocalStorage(): void {
    storage.clearAllData();
  }

  /**
   * Export localStorage data as backup
   */
  exportLocalStorageData(): {
    interactions: AIInteraction[];
    sessions: Session[];
    memories: Memory[];
    actionItems: ActionItem[];
    exportDate: string;
  } {
    return {
      interactions: storage.getInteractions(),
      sessions: storage.getSessions(),
      memories: storage.getMemories(),
      actionItems: storage.getActionItems(),
      exportDate: new Date().toISOString()
    };
  }

  /**
   * Import data from backup
   */
  async importFromBackup(
    userId: string,
    backupData: {
      interactions: AIInteraction[];
      sessions: Session[];
      memories: Memory[];
      actionItems: ActionItem[];
    }
  ): Promise<{
    interactions: number;
    sessions: number;
    memories: number;
    actionItems: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let interactions = 0;
    let sessions = 0;
    let memories = 0;
    let actionItems = 0;

    try {
      // Import interactions
      for (const interaction of backupData.interactions) {
        try {
          await this.db.createAiInteraction({
            user_id: userId,
            prompt: interaction.prompt,
            response: interaction.response,
            platform: interaction.platform,
            model: interaction.model,
            timestamp: interaction.timestamp,
            tags: interaction.tags,
            summary: interaction.summary,
            embedding: interaction.embedding
          });
          interactions++;
        } catch (error) {
          errors.push(`Failed to import interaction ${interaction.id}: ${error}`);
        }
      }

      // Import sessions
      for (const session of backupData.sessions) {
        try {
          await this.db.createSession({
            user_id: userId,
            title: session.title,
            platform: session.platform,
            start_time: new Date(session.startTime).toISOString(),
            end_time: session.endTime ? new Date(session.endTime).toISOString() : undefined,
            summary: session.summary,
            themes: session.themes,
            total_interactions: session.totalInteractions
          });
          sessions++;
        } catch (error) {
          errors.push(`Failed to import session ${session.id}: ${error}`);
        }
      }

      // Import action items
      for (const actionItem of backupData.actionItems) {
        try {
          await this.db.createActionItem({
            user_id: userId,
            text: actionItem.text,
            completed: actionItem.completed,
            priority: actionItem.priority,
            category: actionItem.category,
            due_date: actionItem.dueDate ? new Date(actionItem.dueDate).toISOString().split('T')[0] : undefined,
            source_interaction_id: actionItem.sourceInteractionId
          });
          actionItems++;
        } catch (error) {
          errors.push(`Failed to import action item ${actionItem.id}: ${error}`);
        }
      }

      // Create memories from interactions
      const memoryData = backupData.interactions.map(interaction => ({
        content: `${interaction.prompt}\n\n${interaction.response}`,
        sourceType: 'interaction' as const,
        sourceId: interaction.id,
        tags: interaction.tags
      }));

      const createdMemories = await this.rag.createMemoriesFromData(userId, memoryData);
      memories = createdMemories.length;

    } catch (error) {
      errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      interactions,
      sessions,
      memories,
      actionItems,
      errors
    };
  }
} 