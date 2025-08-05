import { storage } from '../utils/storage';
import { supabaseService } from './supabaseService';
import { migrationService } from './migrationService';
import { AIInteraction, Session, Memory, ActionItem } from '../types';

export interface StorageService {
  saveInteraction(interaction: AIInteraction): Promise<void>;
  getInteractions(): Promise<AIInteraction[]>;
  getInteractionById(id: string): Promise<AIInteraction | null>;
  saveSession(session: Session): Promise<void>;
  getSessions(): Promise<Session[]>;
  getSessionById(id: string): Promise<Session | null>;
  saveMemory(memory: Memory): Promise<void>;
  getMemories(): Promise<Memory[]>;
  saveActionItem(action: ActionItem): Promise<void>;
  getActionItems(): Promise<ActionItem[]>;
  deleteActionItem(id: string): Promise<void>;
  searchInteractions(query: string): Promise<AIInteraction[]>;
  clearAllData(): Promise<void>;
  testConnection(): Promise<boolean>;
}

class LocalStorageAdapter implements StorageService {
  async saveInteraction(interaction: AIInteraction): Promise<void> {
    storage.saveInteraction(interaction);
  }

  async getInteractions(): Promise<AIInteraction[]> {
    return storage.getInteractions();
  }

  async getInteractionById(id: string): Promise<AIInteraction | null> {
    return storage.getInteractionById(id);
  }

  async saveSession(session: Session): Promise<void> {
    storage.saveSession(session);
  }

  async getSessions(): Promise<Session[]> {
    return storage.getSessions();
  }

  async getSessionById(id: string): Promise<Session | null> {
    return storage.getSessionById(id);
  }

  async saveMemory(memory: Memory): Promise<void> {
    storage.saveMemory(memory);
  }

  async getMemories(): Promise<Memory[]> {
    return storage.getMemories();
  }

  async saveActionItem(action: ActionItem): Promise<void> {
    storage.saveActionItem(action);
  }

  async getActionItems(): Promise<ActionItem[]> {
    return storage.getActionItems();
  }

  async deleteActionItem(id: string): Promise<void> {
    storage.deleteActionItem(id);
  }

  async searchInteractions(query: string): Promise<AIInteraction[]> {
    return storage.searchInteractions(query);
  }

  async clearAllData(): Promise<void> {
    storage.clearAllData();
  }

  async testConnection(): Promise<boolean> {
    return true; // localStorage is always available
  }
}

class StorageManager {
  private currentService: StorageService;
  private useSupabase: boolean = false;

  constructor() {
    this.currentService = new LocalStorageAdapter();
    this.initializeStorage();
  }

  private async initializeStorage() {
    // Check if user prefers Supabase
    const useSupabase = localStorage.getItem('useSupabase') === 'true';
    
    if (useSupabase) {
      try {
        const isConnected = await supabaseService.testConnection();
        if (isConnected) {
          this.currentService = supabaseService;
          this.useSupabase = true;
          console.log('Using Supabase for data storage');
        } else {
          console.log('Supabase connection failed, falling back to localStorage');
        }
      } catch (error) {
        console.error('Failed to connect to Supabase:', error);
      }
    }
  }

  async switchToSupabase(): Promise<boolean> {
    try {
      const isConnected = await supabaseService.testConnection();
      if (isConnected) {
        // Migrate data from localStorage to Supabase
        const migrationResult = await migrationService.migrateToSupabase();
        if (migrationResult.success) {
          this.currentService = supabaseService;
          this.useSupabase = true;
          localStorage.setItem('useSupabase', 'true');
          console.log('Switched to Supabase storage');
          console.log(migrationResult.message);
          return true;
        } else {
          console.error('Migration failed:', migrationResult.message);
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to switch to Supabase:', error);
      return false;
    }
  }

  async switchToLocalStorage(): Promise<void> {
    // Migrate data from Supabase to localStorage
    const migrationResult = await migrationService.migrateFromSupabase();
    if (migrationResult.success) {
      this.currentService = new LocalStorageAdapter();
      this.useSupabase = false;
      localStorage.setItem('useSupabase', 'false');
      console.log('Switched to localStorage');
      console.log(migrationResult.message);
    } else {
      console.error('Migration failed:', migrationResult.message);
      throw new Error(migrationResult.message);
    }
  }

  isUsingSupabase(): boolean {
    return this.useSupabase;
  }

  // Delegate all methods to current service
  async saveInteraction(interaction: AIInteraction): Promise<void> {
    return this.currentService.saveInteraction(interaction);
  }

  async getInteractions(): Promise<AIInteraction[]> {
    return this.currentService.getInteractions();
  }

  async getInteractionById(id: string): Promise<AIInteraction | null> {
    return this.currentService.getInteractionById(id);
  }

  async saveSession(session: Session): Promise<void> {
    return this.currentService.saveSession(session);
  }

  async getSessions(): Promise<Session[]> {
    return this.currentService.getSessions();
  }

  async getSessionById(id: string): Promise<Session | null> {
    return this.currentService.getSessionById(id);
  }

  async saveMemory(memory: Memory): Promise<void> {
    return this.currentService.saveMemory(memory);
  }

  async getMemories(): Promise<Memory[]> {
    return this.currentService.getMemories();
  }

  async saveActionItem(action: ActionItem): Promise<void> {
    return this.currentService.saveActionItem(action);
  }

  async getActionItems(): Promise<ActionItem[]> {
    return this.currentService.getActionItems();
  }

  async deleteActionItem(id: string): Promise<void> {
    return this.currentService.deleteActionItem(id);
  }

  async searchInteractions(query: string): Promise<AIInteraction[]> {
    return this.currentService.searchInteractions(query);
  }

  async clearAllData(): Promise<void> {
    return this.currentService.clearAllData();
  }

  async testConnection(): Promise<boolean> {
    return this.currentService.testConnection();
  }
}

export const storageAdapter = new StorageManager(); 