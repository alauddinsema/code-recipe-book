import React, { useState } from 'react';
import { MealPlanningService, type MealPlan } from '../../services/mealPlanningService';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui';
import toast from 'react-hot-toast';

interface CreateMealPlanModalProps {
  onMealPlanCreated: (mealPlan: MealPlan) => void;
  onClose: () => void;
}

const CreateMealPlanModal: React.FC<CreateMealPlanModalProps> = ({
  onMealPlanCreated,
  onClose
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    duration_days: 7
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name.trim()) {
      toast.error('Plan name is required');
      return;
    }

    try {
      setLoading(true);

      // Calculate end date
      const startDate = new Date(formData.start_date);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + formData.duration_days - 1);

      const mealPlanData = {
        user_id: user.id,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        start_date: formData.start_date,
        end_date: endDate.toISOString().split('T')[0],
        is_template: false,
        total_recipes: 0,
        estimated_cost: undefined
      };

      const newMealPlan = await MealPlanningService.createMealPlan(mealPlanData);
      onMealPlanCreated(newMealPlan);

    } catch (error) {
      console.error('Failed to create meal plan:', error);
      toast.error('Failed to create meal plan');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getEndDate = () => {
    const startDate = new Date(formData.start_date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + formData.duration_days - 1);
    return endDate.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Meal Plan</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close create meal plan modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Plan Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Plan Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Weekly Meal Plan"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Optional description for your meal plan..."
              />
            </div>

            {/* Start Date */}
            <div>
              <label htmlFor="meal-plan-start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date *
              </label>
              <input
                id="meal-plan-start-date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* Duration */}
            <div>
              <label htmlFor="meal-plan-duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration
              </label>
              <select
                id="meal-plan-duration"
                value={formData.duration_days}
                onChange={(e) => handleInputChange('duration_days', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value={7}>1 Week (7 days)</option>
                <option value={14}>2 Weeks (14 days)</option>
                <option value={21}>3 Weeks (21 days)</option>
                <option value={30}>1 Month (30 days)</option>
              </select>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                End date: {getEndDate()}
              </p>
            </div>

            {/* Quick Start Options */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                Quick Start Tips
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <li>• Start with a 1-week plan to get familiar</li>
                <li>• You can add recipes after creating the plan</li>
                <li>• Use templates for pre-planned meal ideas</li>
                <li>• Generate shopping lists from your plan</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-6">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Creating...' : 'Create Plan'}
              </Button>
              <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateMealPlanModal;
