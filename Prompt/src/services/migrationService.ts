import { storage } from '../utils/storage';
import { supabaseService } from './supabaseService';
import { AIInteraction, Session, Memory, ActionItem } from '../types';

export class MigrationService {
  async migrateToSupabase(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Starting migration to Supabase...');

      // Get all data from localStorage
      const interactions = storage.getInteractions();
      const sessions = storage.getSessions();
      const memories = storage.getMemories();
      const actionItems = storage.getActionItems();

      console.log(`Migrating ${interactions.length} interactions...`);
      for (const interaction of interactions) {
        await supabaseService.saveInteraction(interaction);
      }

      console.log(`Migrating ${sessions.length} sessions...`);
      for (const session of sessions) {
        await supabaseService.saveSession(session);
      }

      console.log(`Migrating ${memories.length} memories...`);
      for (const memory of memories) {
        await supabaseService.saveMemory(memory);
      }

      console.log(`Migrating ${actionItems.length} action items...`);
      for (const actionItem of actionItems) {
        await supabaseService.saveActionItem(actionItem);
      }

      console.log('Migration completed successfully!');
      return {
        success: true,
        message: `Successfully migrated ${interactions.length} interactions, ${sessions.length} sessions, ${memories.length} memories, and ${actionItems.length} action items to Supabase.`
      };

    } catch (error) {
      console.error('Migration failed:', error);
      return {
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async migrateFromSupabase(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Starting migration from Supabase...');

      // Get all data from Supabase
      const interactions = await supabaseService.getInteractions();
      const sessions = await supabaseService.getSessions();
      const memories = await supabaseService.getMemories();
      const actionItems = await supabaseService.getActionItems();

      console.log(`Migrating ${interactions.length} interactions...`);
      for (const interaction of interactions) {
        storage.saveInteraction(interaction);
      }

      console.log(`Migrating ${sessions.length} sessions...`);
      for (const session of sessions) {
        storage.saveSession(session);
      }

      console.log(`Migrating ${memories.length} memories...`);
      for (const memory of memories) {
        storage.saveMemory(memory);
      }

      console.log(`Migrating ${actionItems.length} action items...`);
      for (const actionItem of actionItems) {
        storage.saveActionItem(actionItem);
      }

      console.log('Migration completed successfully!');
      return {
        success: true,
        message: `Successfully migrated ${interactions.length} interactions, ${sessions.length} sessions, ${memories.length} memories, and ${actionItems.length} action items to localStorage.`
      };

    } catch (error) {
      console.error('Migration failed:', error);
      return {
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getMigrationStats(): Promise<{
    localStorage: { interactions: number; sessions: number; memories: number; actionItems: number };
    supabase: { interactions: number; sessions: number; memories: number; actionItems: number };
  }> {
    try {
      const localStorageStats = {
        interactions: storage.getInteractions().length,
        sessions: storage.getSessions().length,
        memories: storage.getMemories().length,
        actionItems: storage.getActionItems().length,
      };

      const supabaseStats = {
        interactions: (await supabaseService.getInteractions()).length,
        sessions: (await supabaseService.getSessions()).length,
        memories: (await supabaseService.getMemories()).length,
        actionItems: (await supabaseService.getActionItems()).length,
      };

      return {
        localStorage: localStorageStats,
        supabase: supabaseStats,
      };
    } catch (error) {
      console.error('Failed to get migration stats:', error);
      return {
        localStorage: { interactions: 0, sessions: 0, memories: 0, actionItems: 0 },
        supabase: { interactions: 0, sessions: 0, memories: 0, actionItems: 0 },
      };
    }
  }
}

export const migrationService = new MigrationService(); 