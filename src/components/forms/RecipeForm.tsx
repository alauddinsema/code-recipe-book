import React, { useState } from 'react';
import { Button } from '../ui';
import type { RecipeFormData } from '../../types';
import { RECIPE_CATEGORIES, DIFFICULTY_LEVELS, PROGRAMMING_LANGUAGES } from '../../utils/constants';

interface RecipeFormProps {
  initialData?: Partial<RecipeFormData>;
  onSubmit: (data: RecipeFormData) => Promise<void>;
  loading?: boolean;
  submitText?: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  ingredients?: string;
  steps?: string;
  category?: string;
  difficulty?: string;
  prep_time?: string;
  cook_time?: string;
  servings?: string;
  code_snippet?: string;
  language?: string;
}

const RecipeForm: React.FC<RecipeFormProps> = ({
  initialData = {},
  onSubmit,
  loading = false,
  submitText = 'Create Recipe'
}) => {
  const [formData, setFormData] = useState<RecipeFormData>({
    title: initialData.title || '',
    description: initialData.description || '',
    ingredients: initialData.ingredients || [],
    steps: initialData.steps || [],
    category: initialData.category || '',
    difficulty: initialData.difficulty || 'easy',
    prep_time: initialData.prep_time || undefined,
    cook_time: initialData.cook_time || undefined,
    servings: initialData.servings || undefined,
    code_snippet: initialData.code_snippet || '',
    language: initialData.language || '',
    tags: initialData.tags || [],
    image_url: initialData.image_url || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [ingredientInput, setIngredientInput] = useState('');
  const [stepInput, setStepInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.ingredients.length === 0) {
      newErrors.ingredients = 'At least one ingredient is required';
    }

    if (formData.steps.length === 0) {
      newErrors.steps = 'At least one step is required';
    }

    if (formData.prep_time !== undefined && formData.prep_time < 0) {
      newErrors.prep_time = 'Prep time must be positive';
    }

    if (formData.cook_time !== undefined && formData.cook_time < 0) {
      newErrors.cook_time = 'Cook time must be positive';
    }

    if (formData.servings !== undefined && formData.servings < 1) {
      newErrors.servings = 'Servings must be at least 1';
    }

    if (formData.code_snippet && !formData.language) {
      newErrors.language = 'Programming language is required when code snippet is provided';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const addIngredient = () => {
    if (ingredientInput.trim()) {
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, ingredientInput.trim()]
      }));
      setIngredientInput('');
      if (errors.ingredients) {
        setErrors(prev => ({ ...prev, ingredients: undefined }));
      }
    }
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const addStep = () => {
    if (stepInput.trim()) {
      setFormData(prev => ({
        ...prev,
        steps: [...prev.steps, stepInput.trim()]
      }));
      setStepInput('');
      if (errors.steps) {
        setErrors(prev => ({ ...prev, steps: undefined }));
      }
    }
  };

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !(formData.tags || []).includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter((_, i) => i !== index)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Basic Information
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recipe Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`input-field ${errors.title ? 'border-red-500' : ''}`}
              placeholder="Enter recipe title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className={`input-field ${errors.description ? 'border-red-500' : ''}`}
              placeholder="Describe your recipe"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="input-field"
              >
                <option value="">Select category</option>
                {RECIPE_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}
                className="input-field"
              >
                {DIFFICULTY_LEVELS.map((difficulty) => (
                  <option key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prep Time (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={formData.prep_time || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  prep_time: e.target.value ? parseInt(e.target.value) : undefined
                }))}
                className={`input-field ${errors.prep_time ? 'border-red-500' : ''}`}
                placeholder="30"
              />
              {errors.prep_time && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.prep_time}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cook Time (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={formData.cook_time || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  cook_time: e.target.value ? parseInt(e.target.value) : undefined
                }))}
                className={`input-field ${errors.cook_time ? 'border-red-500' : ''}`}
                placeholder="45"
              />
              {errors.cook_time && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.cook_time}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Servings
              </label>
              <input
                type="number"
                min="1"
                value={formData.servings || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  servings: e.target.value ? parseInt(e.target.value) : undefined
                }))}
                className={`input-field ${errors.servings ? 'border-red-500' : ''}`}
                placeholder="4"
              />
              {errors.servings && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.servings}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Image URL (optional)
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              className="input-field"
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Ingredients *
        </h2>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={ingredientInput}
              onChange={(e) => setIngredientInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
              className="input-field flex-1"
              placeholder="Add an ingredient"
            />
            <Button
              type="button"
              onClick={addIngredient}
              variant="secondary"
            >
              Add
            </Button>
          </div>

          {errors.ingredients && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.ingredients}</p>
          )}

          {formData.ingredients.length > 0 && (
            <div className="space-y-2">
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <span className="text-gray-900 dark:text-white">{ingredient}</span>
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Steps */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Instructions *
        </h2>

        <div className="space-y-4">
          <div className="flex gap-2">
            <textarea
              value={stepInput}
              onChange={(e) => setStepInput(e.target.value)}
              rows={2}
              className="input-field flex-1"
              placeholder="Add a cooking step"
            />
            <Button
              type="button"
              onClick={addStep}
              variant="secondary"
            >
              Add
            </Button>
          </div>

          {errors.steps && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.steps}</p>
          )}

          {formData.steps.length > 0 && (
            <div className="space-y-3">
              {formData.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-gray-900 dark:text-white flex-1">{step}</span>
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Code Snippet */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Code Snippet (Optional)
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Programming Language
            </label>
            <select
              value={formData.language}
              onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
              className={`input-field ${errors.language ? 'border-red-500' : ''}`}
            >
              <option value="">Select language</option>
              {PROGRAMMING_LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
            {errors.language && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.language}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Code
            </label>
            <textarea
              value={formData.code_snippet}
              onChange={(e) => setFormData(prev => ({ ...prev, code_snippet: e.target.value }))}
              rows={8}
              className="input-field font-mono text-sm"
              placeholder="// Add your code snippet here
function calculateCookingTime(servings) {
  return servings * 15; // 15 minutes per serving
}"
            />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Tags (Optional)
        </h2>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="input-field flex-1"
              placeholder="Add a tag"
            />
            <Button
              type="button"
              onClick={addTag}
              variant="secondary"
            >
              Add
            </Button>
          </div>

          {(formData.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(formData.tags || []).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          loading={loading}
          disabled={loading}
          size="lg"
        >
          {submitText}
        </Button>
      </div>
    </form>
  );
};

export default RecipeForm;
