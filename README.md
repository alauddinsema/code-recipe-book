# 🍳 Code Recipe Book

A modern, mobile-first web application that combines cooking recipes with code snippets. Perfect for tech-savvy food lovers, smart kitchen enthusiasts, and coding students who want to explore the intersection of culinary arts and programming.

![Code Recipe Book](https://img.shields.io/badge/React-18.x-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.x-blue) ![Supabase](https://img.shields.io/badge/Supabase-Backend-green) ![Gemini AI](https://img.shields.io/badge/Gemini%20AI-2.5%20Flash-orange)

## ✨ Features

### 🍽️ Recipe Management
- **Browse & Search**: Discover recipes by category, difficulty, or ingredients
- **Create & Share**: Add your own recipes with detailed instructions
- **Smart Filtering**: Filter by dietary restrictions, cooking time, and difficulty
- **Mobile-First Design**: Optimized for smartphones and tablets

### 💻 Code Integration
- **Code Snippets**: Each recipe can include programming code for:
  - Smart kitchen automation
  - Cooking timers and calculations
  - IoT device integration
  - Recipe scaling algorithms
- **Syntax Highlighting**: Beautiful code display with language detection
- **Multiple Languages**: Support for Python, JavaScript, and more

### 🤖 AI-Powered Features
- **Recipe Generation**: AI creates recipes based on available ingredients
- **Smart Suggestions**: Get recipe recommendations using Gemini 2.5 Flash
- **Ingredient Analysis**: AI helps optimize ingredient combinations

### 👤 User Features
- **Authentication**: Secure email/password login with Supabase Auth
- **Personal Collection**: Save and organize your favorite recipes
- **Profile Management**: Track your created recipes and cooking history
- **Social Sharing**: Share recipes with the community

### 🎨 Modern UI/UX
- **Dark/Light Mode**: Toggle between themes with persistent storage
- **Responsive Design**: Works seamlessly on all device sizes
- **Loading States**: Smooth loading animations and error handling
- **Toast Notifications**: Real-time feedback for user actions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Google AI Studio account (for Gemini API)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/code-recipe-book.git
   cd code-recipe-book
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your API keys:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5174`

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development with strict type checking
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework with dark mode
- **React Router** - Client-side routing and navigation

### Backend & Services
- **Supabase** - PostgreSQL database with real-time features
- **Supabase Auth** - User authentication and authorization
- **Gemini 2.5 Flash** - AI-powered recipe generation
- **Row Level Security** - Database-level security policies

### Development Tools
- **ESLint** - Code linting and quality checks
- **PostCSS** - CSS processing and optimization
- **React Hot Toast** - Beautiful toast notifications

## 📁 Project Structure

```
code-recipe-book/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── auth/           # Authentication components
│   │   ├── recipe/         # Recipe-related components
│   │   └── ui/             # Generic UI components
│   ├── pages/              # Page components
│   ├── services/           # API services and data layer
│   ├── contexts/           # React contexts (Auth, Theme)
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions and constants
│   └── styles/             # Global styles and CSS
├── public/                 # Static assets
├── netlify.toml           # Netlify deployment configuration
└── README.md              # Project documentation
```

## 🗄️ Database Schema

### Recipes Table
```sql
recipes (
  id: uuid (primary key)
  title: text
  description: text
  ingredients: text[]
  steps: text[]
  code_snippet: text (optional)
  language: text (optional)
  prep_time: integer (minutes)
  cook_time: integer (minutes)
  servings: integer
  difficulty: text (easy|medium|hard)
  category: text
  tags: text[]
  image_url: text (optional)
  author_id: uuid (foreign key)
  author_name: text
  is_public: boolean
  created_at: timestamp
  updated_at: timestamp
)
```

### Profiles Table
```sql
profiles (
  id: uuid (primary key, references auth.users)
  full_name: text
  avatar_url: text (optional)
  bio: text (optional)
  created_at: timestamp
  updated_at: timestamp
)
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `VITE_GEMINI_API_KEY` | Google Gemini API key | ✅ |
| `VITE_APP_NAME` | Application name | ❌ |
| `VITE_APP_VERSION` | Application version | ❌ |

### Supabase Setup

1. Create a new Supabase project
2. Run the database migrations (see `/supabase` folder)
3. Configure Row Level Security policies
4. Enable email authentication
5. Get your project URL and anon key

### Gemini AI Setup

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add the key to your environment variables

## 🚀 Deployment

### Netlify Deployment (Recommended)

1. **Connect your repository**
   - Fork this repository to your GitHub account
   - Connect your GitHub account to Netlify
   - Select the repository for deployment

2. **Configure build settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18`

3. **Set environment variables**
   In Netlify dashboard, go to Site settings > Environment variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   VITE_GEMINI_API_KEY=your_gemini_key
   ```

4. **Deploy**
   - Push to main branch for automatic deployment
   - Or trigger manual deploy from Netlify dashboard

### Manual Deployment

```bash
# Build for production
npm run build

# Preview the build locally
npm run preview

# Deploy the 'dist' folder to your hosting provider
```

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Code Style

- Use TypeScript for all new files
- Follow React functional component patterns
- Use Tailwind CSS for styling
- Implement proper error handling
- Write descriptive commit messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for the amazing backend-as-a-service platform
- **Google Gemini** for AI-powered recipe generation
- **Tailwind CSS** for the beautiful utility-first CSS framework
- **React** team for the incredible frontend library

## 📞 Support

If you have any questions or need help:

1. Check the [Issues](https://github.com/yourusername/code-recipe-book/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

---

**Made with ❤️ for the intersection of cooking and coding**
