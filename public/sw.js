// Service Worker for Code Recipe Book PWA with Offline Recipe Support
const CACHE_NAME = 'code-recipe-book-v2';
const RECIPE_CACHE_NAME = 'recipe-data-v1';
const IMAGE_CACHE_NAME = 'recipe-images-v1';

// Static assets to cache
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.webmanifest'
];

// Recipe API endpoints to cache
const RECIPE_API_PATTERNS = [
  /\/api\/recipes/,
  /\/\.netlify\/functions\/generate-recipe/,
  /supabase\.co.*\/rest\/v1\/recipes/
];

// Image domains to cache
const IMAGE_DOMAINS = [
  'images.unsplash.com',
  'supabase.co',
  'storage.googleapis.com'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache install failed:', error);
      })
  );
});

// Fetch event - intelligent caching for recipes and images
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle recipe API requests
  if (isRecipeApiRequest(event.request)) {
    event.respondWith(handleRecipeApiRequest(event.request));
    return;
  }

  // Handle recipe images
  if (isRecipeImage(event.request)) {
    event.respondWith(handleImageRequest(event.request));
    return;
  }

  // Handle static assets and pages
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // If both cache and network fail, show offline page
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old static caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME &&
                cacheName !== RECIPE_CACHE_NAME &&
                cacheName !== IMAGE_CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Initialize offline storage
      initializeOfflineStorage()
    ])
  );
});

// Helper functions for intelligent caching

/**
 * Check if request is for recipe API data
 */
function isRecipeApiRequest(request) {
  return RECIPE_API_PATTERNS.some(pattern => pattern.test(request.url));
}

/**
 * Check if request is for recipe images
 */
function isRecipeImage(request) {
  const url = new URL(request.url);
  return IMAGE_DOMAINS.some(domain => url.hostname.includes(domain)) &&
         request.destination === 'image';
}

/**
 * Handle recipe API requests with cache-first strategy
 */
async function handleRecipeApiRequest(request) {
  try {
    // Try cache first for offline support
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      // Serve from cache and update in background
      updateCacheInBackground(request);
      return cachedResponse;
    }

    // Fetch from network and cache
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(RECIPE_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('Recipe API request failed:', error);

    // Try to serve from cache as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'Recipe data not available offline'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Handle image requests with cache-first strategy
 */
async function handleImageRequest(request) {
  try {
    // Check cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fetch from network
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful image responses
      const cache = await caches.open(IMAGE_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('Image request failed:', error);

    // Try cache as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return placeholder image or error
    return new Response('', { status: 404 });
  }
}

/**
 * Update cache in background (stale-while-revalidate)
 */
async function updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(RECIPE_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    console.log('Background cache update failed:', error);
  }
}

/**
 * Initialize offline storage on service worker activation
 */
async function initializeOfflineStorage() {
  try {
    // Post message to main thread to initialize IndexedDB
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'INIT_OFFLINE_STORAGE'
        });
      });
    });

    console.log('📱 Offline storage initialization requested');
  } catch (error) {
    console.error('Failed to initialize offline storage:', error);
  }
}

// Background sync for offline operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'recipe-sync') {
    event.waitUntil(syncOfflineRecipes());
  }
});

/**
 * Sync offline recipe operations when connection is restored
 */
async function syncOfflineRecipes() {
  try {
    // Notify main thread to perform sync operations
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_OFFLINE_RECIPES'
      });
    });

    console.log('🔄 Offline recipe sync initiated');
  } catch (error) {
    console.error('Offline sync failed:', error);
  }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_RECIPE') {
    // Cache specific recipe data
    cacheRecipeData(event.data.recipe);
  }
});

/**
 * Cache specific recipe data
 */
async function cacheRecipeData(recipe) {
  try {
    const cache = await caches.open(RECIPE_CACHE_NAME);

    // Cache recipe JSON data
    const recipeResponse = new Response(JSON.stringify(recipe), {
      headers: { 'Content-Type': 'application/json' }
    });

    await cache.put(`/api/recipes/${recipe.id}`, recipeResponse);

    // Cache recipe image if available
    if (recipe.image_url) {
      try {
        const imageResponse = await fetch(recipe.image_url);
        if (imageResponse.ok) {
          const imageCache = await caches.open(IMAGE_CACHE_NAME);
          await imageCache.put(recipe.image_url, imageResponse);
        }
      } catch (error) {
        console.warn('Failed to cache recipe image:', error);
      }
    }

    console.log(`📦 Cached recipe: ${recipe.title}`);
  } catch (error) {
    console.error('Failed to cache recipe data:', error);
  }
}
