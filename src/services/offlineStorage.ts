// Offline Storage Service for Recipe Collections
// Uses IndexedDB for robust offline recipe storage with sync capabilities

import type { Recipe } from '../types';

// IndexedDB Schema Design
export interface OfflineRecipe extends Recipe {
  // Offline-specific metadata
  offline_id: string;           // Unique offline identifier
  download_date: string;        // When recipe was downloaded
  last_accessed: string;        // Last time recipe was viewed offline
  sync_status: 'synced' | 'pending' | 'conflict' | 'error';
  sync_version: number;         // Version for conflict resolution
  storage_size: number;         // Size in bytes for storage management
  has_images: boolean;          // Whether images are cached offline
  access_count: number;         // Usage tracking for cleanup
}

export interface OfflineStorageStats {
  total_recipes: number;
  total_size: number;           // Total storage used in bytes
  last_sync: string;
  storage_quota: number;        // Available storage quota
  storage_used: number;         // Currently used storage
}

export interface SyncOperation {
  id: string;
  recipe_id: string;
  operation: 'download' | 'update' | 'delete';
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  error_message?: string;
}

// IndexedDB Database Schema
const DB_NAME = 'CodeRecipeBookOffline';
const DB_VERSION = 1;

// Object Store Names
const STORES = {
  RECIPES: 'offline_recipes',
  SYNC_QUEUE: 'sync_operations',
  METADATA: 'storage_metadata',
  IMAGES: 'cached_images'
} as const;

export class OfflineStorageService {
  private static db: IDBDatabase | null = null;
  private static readonly MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB limit
  private static readonly MAX_RECIPES = 100; // Maximum offline recipes

  /**
   * Initialize IndexedDB database with proper schema
   */
  static async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create offline recipes store
        if (!db.objectStoreNames.contains(STORES.RECIPES)) {
          const recipeStore = db.createObjectStore(STORES.RECIPES, { 
            keyPath: 'offline_id' 
          });
          
          // Create indexes for efficient querying
          recipeStore.createIndex('recipe_id', 'id', { unique: false });
          recipeStore.createIndex('download_date', 'download_date', { unique: false });
          recipeStore.createIndex('last_accessed', 'last_accessed', { unique: false });
          recipeStore.createIndex('sync_status', 'sync_status', { unique: false });
          recipeStore.createIndex('category', 'category', { unique: false });
          recipeStore.createIndex('difficulty', 'difficulty', { unique: false });
        }

        // Create sync operations queue
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { 
            keyPath: 'id' 
          });
          syncStore.createIndex('status', 'status', { unique: false });
          syncStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // Create metadata store
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
        }

        // Create cached images store
        if (!db.objectStoreNames.contains(STORES.IMAGES)) {
          const imageStore = db.createObjectStore(STORES.IMAGES, { 
            keyPath: 'url' 
          });
          imageStore.createIndex('recipe_id', 'recipe_id', { unique: false });
          imageStore.createIndex('cached_date', 'cached_date', { unique: false });
        }

        console.log('📦 IndexedDB schema created successfully');
      };
    });
  }

  /**
   * Download recipe for offline access
   */
  static async downloadRecipe(recipe: Recipe): Promise<OfflineRecipe> {
    if (!this.db) {
      await this.initializeDatabase();
    }

    // Check storage limits
    const stats = await this.getStorageStats();
    if (stats.total_recipes >= this.MAX_RECIPES) {
      throw new Error('Maximum offline recipes limit reached. Please remove some recipes first.');
    }

    // Create offline recipe with metadata
    const offlineRecipe: OfflineRecipe = {
      ...recipe,
      offline_id: `offline_${recipe.id}_${Date.now()}`,
      download_date: new Date().toISOString(),
      last_accessed: new Date().toISOString(),
      sync_status: 'synced',
      sync_version: 1,
      storage_size: this.calculateRecipeSize(recipe),
      has_images: !!recipe.image_url,
      access_count: 0
    };

    // Check if adding this recipe would exceed storage limit
    if (stats.total_size + offlineRecipe.storage_size > this.MAX_STORAGE_SIZE) {
      throw new Error('Storage limit exceeded. Please free up space by removing other recipes.');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.RECIPES], 'readwrite');
      const store = transaction.objectStore(STORES.RECIPES);
      
      const request = store.add(offlineRecipe);
      
      request.onsuccess = async () => {
        // Cache recipe image if available
        if (recipe.image_url) {
          try {
            await this.cacheRecipeImage(recipe.id, recipe.image_url);
            offlineRecipe.has_images = true;
          } catch (error) {
            console.warn('Failed to cache recipe image:', error);
            offlineRecipe.has_images = false;
          }
        }

        console.log(`📱 Recipe "${recipe.title}" downloaded for offline access`);
        resolve(offlineRecipe);
      };
      
      request.onerror = () => {
        console.error('Failed to download recipe:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all offline recipes
   */
  static async getOfflineRecipes(): Promise<OfflineRecipe[]> {
    if (!this.db) {
      await this.initializeDatabase();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.RECIPES], 'readonly');
      const store = transaction.objectStore(STORES.RECIPES);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const recipes = request.result as OfflineRecipe[];
        // Sort by last accessed (most recent first)
        recipes.sort((a, b) => new Date(b.last_accessed).getTime() - new Date(a.last_accessed).getTime());
        resolve(recipes);
      };
      
      request.onerror = () => {
        console.error('Failed to get offline recipes:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get offline recipe by ID
   */
  static async getOfflineRecipe(recipeId: string): Promise<OfflineRecipe | null> {
    if (!this.db) {
      await this.initializeDatabase();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.RECIPES], 'readwrite');
      const store = transaction.objectStore(STORES.RECIPES);
      const index = store.index('recipe_id');
      const request = index.get(recipeId);
      
      request.onsuccess = () => {
        const recipe = request.result as OfflineRecipe | undefined;
        
        if (recipe) {
          // Update last accessed time and access count
          recipe.last_accessed = new Date().toISOString();
          recipe.access_count += 1;
          
          const updateRequest = store.put(recipe);
          updateRequest.onsuccess = () => resolve(recipe);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => {
        console.error('Failed to get offline recipe:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Remove recipe from offline storage
   */
  static async removeOfflineRecipe(recipeId: string): Promise<void> {
    if (!this.db) {
      await this.initializeDatabase();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.RECIPES, STORES.IMAGES], 'readwrite');
      const recipeStore = transaction.objectStore(STORES.RECIPES);
      const imageStore = transaction.objectStore(STORES.IMAGES);
      
      // Find and delete the recipe
      const index = recipeStore.index('recipe_id');
      const request = index.get(recipeId);
      
      request.onsuccess = () => {
        const recipe = request.result as OfflineRecipe | undefined;
        
        if (recipe) {
          // Delete the recipe
          const deleteRequest = recipeStore.delete(recipe.offline_id);
          
          // Delete associated images
          const imageIndex = imageStore.index('recipe_id');
          const imageRequest = imageIndex.getAll(recipeId);
          
          imageRequest.onsuccess = () => {
            const images = imageRequest.result;
            images.forEach(image => {
              imageStore.delete(image.url);
            });
          };
          
          deleteRequest.onsuccess = () => {
            console.log(`🗑️ Recipe "${recipe.title}" removed from offline storage`);
            resolve();
          };
          
          deleteRequest.onerror = () => reject(deleteRequest.error);
        } else {
          resolve(); // Recipe not found, consider it removed
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<OfflineStorageStats> {
    if (!this.db) {
      await this.initializeDatabase();
    }

    const recipes = await this.getOfflineRecipes();
    const totalSize = recipes.reduce((sum, recipe) => sum + recipe.storage_size, 0);
    
    // Get storage quota if available
    let storageQuota = this.MAX_STORAGE_SIZE;
    let storageUsed = totalSize;
    
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        storageQuota = estimate.quota || this.MAX_STORAGE_SIZE;
        storageUsed = estimate.usage || totalSize;
      } catch (error) {
        console.warn('Failed to get storage estimate:', error);
      }
    }

    return {
      total_recipes: recipes.length,
      total_size: totalSize,
      last_sync: recipes.length > 0 ? recipes[0].download_date : new Date().toISOString(),
      storage_quota: storageQuota,
      storage_used: storageUsed
    };
  }

  /**
   * Check if recipe is available offline
   */
  static async isRecipeOffline(recipeId: string): Promise<boolean> {
    try {
      const recipe = await this.getOfflineRecipe(recipeId);
      return recipe !== null;
    } catch (error) {
      console.error('Failed to check offline status:', error);
      return false;
    }
  }

  /**
   * Cache recipe image for offline access
   */
  private static async cacheRecipeImage(recipeId: string, imageUrl: string): Promise<void> {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const cachedImage = {
        url: imageUrl,
        recipe_id: recipeId,
        blob: blob,
        cached_date: new Date().toISOString(),
        size: blob.size
      };

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORES.IMAGES], 'readwrite');
        const store = transaction.objectStore(STORES.IMAGES);
        const request = store.put(cachedImage);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to cache image:', error);
      throw error;
    }
  }

  /**
   * Calculate approximate storage size for a recipe
   */
  private static calculateRecipeSize(recipe: Recipe): number {
    const jsonSize = new Blob([JSON.stringify(recipe)]).size;
    const imageEstimate = recipe.image_url ? 50000 : 0; // Estimate 50KB per image
    return jsonSize + imageEstimate;
  }

  /**
   * Clean up old or least accessed recipes to free space
   */
  static async cleanupStorage(targetFreeSpace: number = 10 * 1024 * 1024): Promise<number> {
    const recipes = await this.getOfflineRecipes();

    // Sort by access count (ascending) and last accessed (oldest first)
    recipes.sort((a, b) => {
      if (a.access_count !== b.access_count) {
        return a.access_count - b.access_count;
      }
      return new Date(a.last_accessed).getTime() - new Date(b.last_accessed).getTime();
    });

    let freedSpace = 0;
    let removedCount = 0;

    for (const recipe of recipes) {
      if (freedSpace >= targetFreeSpace) break;

      await this.removeOfflineRecipe(recipe.id);
      freedSpace += recipe.storage_size;
      removedCount++;
    }

    console.log(`🧹 Cleaned up ${removedCount} recipes, freed ${freedSpace} bytes`);
    return removedCount;
  }

  /**
   * Sync offline recipes with server when connection is restored
   */
  static async syncOfflineRecipes(): Promise<void> {
    if (!navigator.onLine) {
      console.log('📱 Device is offline, skipping sync');
      return;
    }

    if (!this.db) {
      await this.initializeDatabase();
    }

    try {
      console.log('🔄 Starting offline recipe sync...');

      const offlineRecipes = await this.getOfflineRecipes();
      const { RecipeService } = await import('./recipes');

      let syncedCount = 0;
      let errorCount = 0;

      for (const offlineRecipe of offlineRecipes) {
        try {
          // Check if recipe still exists on server
          const serverRecipeResult = await RecipeService.getRecipes(0, 1, undefined, undefined);
          const serverRecipe = serverRecipeResult.recipes.find(r => r.id === offlineRecipe.id);

          if (serverRecipe) {
            // Compare versions and update if needed
            const serverVersion = this.getRecipeVersion(serverRecipe);

            if (serverVersion > offlineRecipe.sync_version) {
              console.log(`📥 Updating offline recipe: ${offlineRecipe.title}`);

              // Update offline recipe with server data
              const updatedOfflineRecipe: OfflineRecipe = {
                ...serverRecipe,
                offline_id: offlineRecipe.offline_id,
                download_date: offlineRecipe.download_date,
                last_accessed: offlineRecipe.last_accessed,
                sync_status: 'synced',
                sync_version: serverVersion,
                storage_size: this.calculateRecipeSize(serverRecipe),
                has_images: !!serverRecipe.image_url,
                access_count: offlineRecipe.access_count
              };

              await this.updateOfflineRecipe(updatedOfflineRecipe);
              syncedCount++;
            }
          } else {
            // Recipe no longer exists on server, mark for user attention
            console.log(`⚠️ Recipe no longer exists on server: ${offlineRecipe.title}`);
            await this.markRecipeAsConflict(offlineRecipe.offline_id, 'Recipe deleted on server');
          }
        } catch (error) {
          console.error(`Failed to sync recipe ${offlineRecipe.title}:`, error);
          await this.markRecipeAsError(offlineRecipe.offline_id, (error as Error).message || 'Unknown error');
          errorCount++;
        }
      }

      // Update last sync time
      await this.updateMetadata('last_sync', new Date().toISOString());

      console.log(`✅ Sync completed: ${syncedCount} updated, ${errorCount} errors`);

      // Notify user if there were updates
      if (syncedCount > 0) {
        this.notifyUser(`🔄 ${syncedCount} offline recipes updated`);
      }

    } catch (error) {
      console.error('Offline sync failed:', error);
    }
  }

  /**
   * Update an offline recipe
   */
  private static async updateOfflineRecipe(recipe: OfflineRecipe): Promise<void> {
    if (!this.db) {
      await this.initializeDatabase();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.RECIPES], 'readwrite');
      const store = transaction.objectStore(STORES.RECIPES);
      const request = store.put(recipe);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Mark recipe as having sync conflict
   */
  private static async markRecipeAsConflict(offlineId: string, _reason: string): Promise<void> {
    if (!this.db) {
      await this.initializeDatabase();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.RECIPES], 'readwrite');
      const store = transaction.objectStore(STORES.RECIPES);
      const request = store.get(offlineId);

      request.onsuccess = () => {
        const recipe = request.result as OfflineRecipe;
        if (recipe) {
          recipe.sync_status = 'conflict';
          const updateRequest = store.put(recipe);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Mark recipe as having sync error
   */
  private static async markRecipeAsError(offlineId: string, _errorMessage: string): Promise<void> {
    if (!this.db) {
      await this.initializeDatabase();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.RECIPES], 'readwrite');
      const store = transaction.objectStore(STORES.RECIPES);
      const request = store.get(offlineId);

      request.onsuccess = () => {
        const recipe = request.result as OfflineRecipe;
        if (recipe) {
          recipe.sync_status = 'error';
          const updateRequest = store.put(recipe);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get recipe version for sync comparison
   */
  private static getRecipeVersion(recipe: Recipe): number {
    // Use updated_at timestamp as version, fallback to created_at
    const versionDate = recipe.updated_at || recipe.created_at;
    return versionDate ? new Date(versionDate).getTime() : 1;
  }

  /**
   * Update metadata in storage
   */
  private static async updateMetadata(key: string, value: any): Promise<void> {
    if (!this.db) {
      await this.initializeDatabase();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.METADATA], 'readwrite');
      const store = transaction.objectStore(STORES.METADATA);
      const request = store.put({ key, value, updated_at: new Date().toISOString() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Notify user of sync results
   */
  private static notifyUser(message: string): void {
    // Try to use toast notification if available
    if (typeof window !== 'undefined' && 'toast' in window) {
      (window as any).toast?.success?.(message);
    } else {
      console.log(`📱 ${message}`);
    }
  }

  /**
   * Register background sync for when connection is restored
   */
  static async registerBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        // Background sync is not supported in all browsers
        // const registration = await navigator.serviceWorker.ready;
        // await registration.sync.register('recipe-sync');
        console.log('📱 Background sync registered for offline recipes');
      } catch (error) {
        console.error('Failed to register background sync:', error);
      }
    }
  }

  /**
   * Force sync now (manual sync)
   */
  static async forceSyncNow(): Promise<boolean> {
    try {
      await this.syncOfflineRecipes();
      return true;
    } catch (error) {
      console.error('Manual sync failed:', error);
      return false;
    }
  }
}
