import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@heroicons/react', 'react-hot-toast'],
          'supabase-vendor': ['@supabase/supabase-js'],

          // Feature chunks
          'auth': ['./src/pages/auth/Login.tsx', './src/pages/auth/Register.tsx'],
          'recipe': ['./src/pages/RecipeDetails.tsx', './src/pages/AddRecipe.tsx'],
          'profile': ['./src/pages/Profile.tsx', './src/pages/Favorites.tsx']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js']
  }
})
