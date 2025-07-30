# Database Setup Guide

## 🗄️ Setting up Supabase Database

The "Failed to save recipe" error indicates that the database tables haven't been created yet. Follow these steps to set up your Supabase database:

### Step 1: Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: **alauddinsema's Project** (ID: xjclhzrhfxqvwzwqmupi)

### Step 2: Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy the entire contents of `database-schema.sql` file
4. Paste it into the SQL editor
5. Click **Run** to execute the schema

### Step 3: Verify Tables Created

After running the schema, verify these tables exist in **Table Editor**:

- ✅ **profiles** - User profile information
- ✅ **recipes** - Recipe data with all fields

### Step 4: Check Row Level Security

In **Authentication > Policies**, verify these policies exist:

**Profiles Table:**
- ✅ Users can view their own profile
- ✅ Users can update their own profile

**Recipes Table:**
- ✅ Anyone can view recipes
- ✅ Users can create their own recipes  
- ✅ Users can update their own recipes
- ✅ Users can delete their own recipes

### Step 5: Test Database Connection

1. Try creating a recipe in your deployed app
2. Check the browser console (F12) for any error messages
3. Verify the recipe appears in **Table Editor > recipes**

## 🔧 Troubleshooting

### Common Issues:

1. **"relation does not exist" error**
   - The tables haven't been created
   - Re-run the `database-schema.sql` script

2. **"permission denied" error**
   - Row Level Security policies aren't set up correctly
   - Check the RLS policies in Authentication > Policies

3. **"invalid input syntax" error**
   - Data type mismatch (e.g., sending string instead of array)
   - Check the console logs for detailed error messages

### Environment Variables

Make sure these are set in Netlify:

```
VITE_SUPABASE_URL=https://xjclhzrhfxqvwzwqmupi.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Getting Your Supabase Keys

1. Go to **Settings > API** in your Supabase dashboard
2. Copy the **Project URL** and **anon public** key
3. Add them to your Netlify environment variables

## 🎯 Expected Database Structure

After setup, your database should have:

```sql
-- Profiles table
profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Recipes table  
recipes (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  ingredients TEXT[] NOT NULL,
  steps TEXT[] NOT NULL,
  code_snippet TEXT,
  language TEXT,
  difficulty TEXT,
  category TEXT,
  prep_time INTEGER,
  cook_time INTEGER,
  servings INTEGER,
  author_id UUID NOT NULL,
  author_name TEXT,
  image_url TEXT,
  tags TEXT[],
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## ✅ Success Indicators

You'll know the setup worked when:

1. ✅ Tables appear in Supabase Table Editor
2. ✅ RLS policies are active
3. ✅ Recipe creation works without errors
4. ✅ Recipes appear in the database
5. ✅ User profiles are auto-created on signup

Once the database is set up, your Code Recipe Book should work perfectly! 🚀
