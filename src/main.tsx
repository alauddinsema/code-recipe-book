import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Register Service Worker for PWA and offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered successfully:', registration);

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              console.log('🔄 New service worker available');
              // You could show a notification to the user here
            }
          });
        }
      });

    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  });

  // Handle service worker messages
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'INIT_OFFLINE_STORAGE') {
      // Initialize offline storage when requested by service worker
      import('./services/offlineStorage').then(({ OfflineStorageService }) => {
        OfflineStorageService.initializeDatabase()
          .then(() => {
            // Register background sync after initialization
            return OfflineStorageService.registerBackgroundSync();
          })
          .catch(console.error);
      });
    }

    if (event.data && event.data.type === 'SYNC_OFFLINE_RECIPES') {
      // Handle offline recipe sync requested by service worker
      console.log('🔄 Sync offline recipes requested by service worker');
      import('./services/offlineStorage').then(({ OfflineStorageService }) => {
        OfflineStorageService.syncOfflineRecipes().catch(console.error);
      });
    }
  });

  // Handle online/offline events for sync
  window.addEventListener('online', () => {
    console.log('📶 Connection restored - triggering sync');
    import('./services/offlineStorage').then(({ OfflineStorageService }) => {
      OfflineStorageService.syncOfflineRecipes().catch(console.error);
    });
  });

  window.addEventListener('offline', () => {
    console.log('📱 Device went offline');
  });
}

// Remove any accessibility overlays or debugging elements that might cause white space
const removeAccessibilityOverlays = () => {
  const selectors = [
    '#sub-frame-error',
    'div[id*="sub-frame"]',
    'div[id*="error"]',
    'div[class*="devtools"]',
    'div[class*="debug"]',
    'div[role="generic"][style*="background"]',
    'div[style*="font: 15px system-ui"]',
    'div[data-accessibility]',
    'div[class*="accessibility-overlay"]',
    'div[class*="inspector"]',
    'div[id*="inspector"]'
  ];

  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
  });
};

// Run immediately and periodically to catch dynamically created overlays
removeAccessibilityOverlays();
setInterval(removeAccessibilityOverlays, 1000);

// Also run when DOM changes
const observer = new MutationObserver(() => {
  removeAccessibilityOverlays();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
