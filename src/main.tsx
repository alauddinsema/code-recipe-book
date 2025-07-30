import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { envValidation } from './utils/envCheck'

// Log environment validation results
console.log('🚀 App starting with environment validation:', envValidation);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
