import React, { Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { Layout, ErrorBoundary, Loading, AuthFallback } from './components';
// import DebugPanel from './components/DebugPanel';
import { ROUTES } from './utils/constants';
import { simpleDebugTool } from './utils/simpleDebugTool';

// Lazy load pages for better performance
const Home = React.lazy(() => import('./pages/Home'));
const AddRecipe = React.lazy(() => import('./pages/AddRecipe'));
const EditRecipe = React.lazy(() => import('./pages/EditRecipe'));
const Profile = React.lazy(() => import('./pages/Profile'));
const RecipeDetails = React.lazy(() => import('./pages/RecipeDetails'));
const Favorites = React.lazy(() => import('./pages/Favorites'));
const Collections = React.lazy(() => import('./pages/Collections'));
const CollectionDetail = React.lazy(() => import('./pages/CollectionDetail'));
const RatingAnalytics = React.lazy(() => import('./pages/RatingAnalytics'));
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));

function App() {
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);

  return (
    <ErrorBoundary fallback={<AuthFallback error="Application failed to initialize" />}>
      <ThemeProvider>
        <ErrorBoundary fallback={<AuthFallback error="Authentication system failed to initialize" />}>
          <AuthProvider>
            <Router>
              <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
                <Layout>
                  <ErrorBoundary>
                    <Suspense fallback={
                      <div className="flex items-center justify-center min-h-[50vh]">
                        <Loading size="lg" />
                      </div>
                    }>
                      <Routes>
                        <Route path={ROUTES.HOME} element={<Home />} />
                        <Route path={ROUTES.ADD_RECIPE} element={<AddRecipe />} />
                        <Route path="/recipe/:id/edit" element={<EditRecipe />} />
                        <Route path={ROUTES.RECIPE_DETAILS} element={<RecipeDetails />} />
                        <Route path={ROUTES.PROFILE} element={<Profile />} />
                        <Route path={ROUTES.FAVORITES} element={<Favorites />} />
                        <Route path={ROUTES.COLLECTIONS} element={<Collections />} />
                        <Route path={`${ROUTES.COLLECTIONS}/:id`} element={<CollectionDetail />} />
                        <Route path="/rating-analytics" element={<RatingAnalytics />} />
                        <Route path={ROUTES.LOGIN} element={<Login />} />
                        <Route path={ROUTES.REGISTER} element={<Register />} />
                      </Routes>
                    </Suspense>
                  </ErrorBoundary>
                </Layout>
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    className: 'dark:bg-gray-800 dark:text-white',
                  }}
                />

                {/* Debug Panel - Temporarily disabled */}
                {/* <DebugPanel
                  isOpen={debugPanelOpen}
                  onClose={() => setDebugPanelOpen(false)}
                /> */}

                {/* Floating Debug Button - Only in development */}
                {import.meta.env.DEV && (
                  <button
                    onClick={() => simpleDebugTool.printDebugInfo()}
                    className="fixed bottom-4 right-4 z-40 bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transition-colors duration-200"
                    title={`Debug Tool: ${simpleDebugTool.getIssuesSummary()}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                )}
              </div>
            </Router>
          </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
