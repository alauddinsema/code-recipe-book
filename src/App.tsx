import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { Layout, ErrorBoundary, Loading } from './components';
import { ROUTES } from './utils/constants';

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
  return (
    <ErrorBoundary>
      <ThemeProvider>
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
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
