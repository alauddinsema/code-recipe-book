import React, { useState, useEffect } from 'react';
import { MealPlanningService, type MealPlanTemplate, type MealPlan } from '../../services/mealPlanningService';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui';
import toast from 'react-hot-toast';

interface MealPlanTemplatesProps {
  onTemplateApplied: (mealPlan: MealPlan) => void;
  onClose: () => void;
}

const MealPlanTemplates: React.FC<MealPlanTemplatesProps> = ({
  onTemplateApplied,
  onClose
}) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MealPlanTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadTemplates();
  }, [selectedCategory]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const templatesData = await MealPlanningService.getMealPlanTemplates(selectedCategory || undefined);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = async (template: MealPlanTemplate) => {
    if (!user) return;

    try {
      setApplying(template.id);
      const mealPlan = await MealPlanningService.applyTemplate(template.id, user.id, startDate);
      onTemplateApplied(mealPlan);
    } catch (error) {
      console.error('Failed to apply template:', error);
      toast.error('Failed to apply template');
    } finally {
      setApplying(null);
    }
  };

  const getUniqueCategories = () => {
    const categories = new Set(templates.map(template => template.category));
    return Array.from(categories).sort();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getEndDate = (template: MealPlanTemplate) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + template.duration_days - 1);
    return end.toLocaleDateString();
  };

  // Mock templates if none exist
  const mockTemplates: MealPlanTemplate[] = [
    {
      id: 'template-1',
      name: 'Healthy Week',
      description: 'A balanced week of nutritious meals with plenty of vegetables and lean proteins',
      category: 'Healthy',
      difficulty_level: 'easy',
      duration_days: 7,
      total_recipes: 21,
      estimated_cost: 85,
      dietary_tags: ['healthy', 'balanced', 'low-fat'],
      is_public: true,
      created_by: 'system',
      usage_count: 156,
      average_rating: 4.5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'template-2',
      name: 'Quick & Easy',
      description: 'Simple meals that can be prepared in 30 minutes or less',
      category: 'Quick',
      difficulty_level: 'easy',
      duration_days: 7,
      total_recipes: 21,
      estimated_cost: 65,
      dietary_tags: ['quick', 'easy', 'beginner'],
      is_public: true,
      created_by: 'system',
      usage_count: 203,
      average_rating: 4.3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'template-3',
      name: 'Mediterranean Diet',
      description: 'Traditional Mediterranean cuisine with olive oil, fish, and fresh vegetables',
      category: 'Mediterranean',
      difficulty_level: 'medium',
      duration_days: 14,
      total_recipes: 42,
      estimated_cost: 120,
      dietary_tags: ['mediterranean', 'heart-healthy', 'fish'],
      is_public: true,
      created_by: 'system',
      usage_count: 89,
      average_rating: 4.7,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'template-4',
      name: 'Vegetarian Delight',
      description: 'Plant-based meals full of flavor and nutrition',
      category: 'Vegetarian',
      difficulty_level: 'medium',
      duration_days: 7,
      total_recipes: 21,
      estimated_cost: 55,
      dietary_tags: ['vegetarian', 'plant-based', 'healthy'],
      is_public: true,
      created_by: 'system',
      usage_count: 134,
      average_rating: 4.4,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const displayTemplates = templates.length > 0 ? templates : mockTemplates;
  const filteredTemplates = selectedCategory 
    ? displayTemplates.filter(template => template.category === selectedCategory)
    : displayTemplates;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Meal Plan Templates</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Choose a pre-built meal plan to get started quickly
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Categories</option>
                {getUniqueCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Templates List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No templates found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try selecting a different category or create your own meal plan
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  {/* Template Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {template.category} • {template.duration_days} days
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(template.difficulty_level)}`}>
                      {template.difficulty_level}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {template.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {template.total_recipes}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Recipes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        ${template.estimated_cost}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Est. Cost</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {template.average_rating.toFixed(1)}★
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Rating</div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.dietary_tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="inline-block px-2 py-1 text-xs bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Date Range */}
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Will run from {new Date(startDate).toLocaleDateString()} to {getEndDate(template)}
                  </div>

                  {/* Apply Button */}
                  <Button
                    onClick={() => handleApplyTemplate(template)}
                    disabled={applying === template.id}
                    className="w-full"
                    size="sm"
                  >
                    {applying === template.id ? 'Applying...' : 'Apply Template'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
            </p>
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlanTemplates;
