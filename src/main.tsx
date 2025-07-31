import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Development testing utilities
if (import.meta.env.DEV) {
  import('./scripts/testImageGeneration').then(({ runImageGenerationTests }) => {
    (window as any).testImageGeneration = runImageGenerationTests;
    console.log('🔧 Development mode: Image generation tests available');
    console.log('🔧 Run in console: testImageGeneration()');
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
