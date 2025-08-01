// App constants
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Code Recipe Book';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

// API Configuration
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Routes
export const ROUTES = {
  HOME: '/',
  ADD_RECIPE: '/add-recipe',
  RECIPE_DETAILS: '/recipe/:id',
  PROFILE: '/profile',
  FAVORITES: '/favorites',
  COLLECTIONS: '/collections',
  OFFLINE_RECIPES: '/offline-recipes',
  GROCERY_LISTS: '/grocery-lists',
  GROCERY_LIST_DETAILS: '/grocery-lists/:id',
  PANTRY: '/pantry',
  MEAL_PLANNING: '/meal-planning',
  LOGIN: '/login',
  REGISTER: '/register',
} as const;

// Recipe difficulty levels
export const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
] as const;

// Programming languages for code snippets
export const PROGRAMMING_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
] as const;

// Recipe categories
export const RECIPE_CATEGORIES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'snack', label: 'Snack' },
  { value: 'beverage', label: 'Beverage' },
  { value: 'appetizer', label: 'Appetizer' },
  { value: 'main-course', label: 'Main Course' },
  { value: 'side-dish', label: 'Side Dish' },
] as const;
