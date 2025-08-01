import React, { useState } from 'react';
import { MealPlanningService, type MealPlan, type WeeklySchedule } from '../../services/mealPlanningService';
import RecipeSelector from './RecipeSelector';
import type { Recipe } from '../../types';
import toast from 'react-hot-toast';

interface WeeklyCalendarProps {
  mealPlan: MealPlan;
  weekStartDate: string;
  schedule: WeeklySchedule[];
  onScheduleUpdated: () => void;
}

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  mealPlan,
  weekStartDate,
  schedule,
  onScheduleUpdated
}) => {
  const [showRecipeSelector, setShowRecipeSelector] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    dayOfWeek: number;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  } | null>(null);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const mealTypes: ('breakfast' | 'lunch' | 'dinner' | 'snack')[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      case 'snack': return '🍎';
      default: return '🍽️';
    }
  };

  const getMealTypeColor = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'lunch': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'dinner': return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'snack': return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getScheduleForSlot = (dayOfWeek: number, mealType: string) => {
    return schedule.find(s => s.day_of_week === dayOfWeek && s.meal_type === mealType);
  };

  const getDateForDay = (dayOfWeek: number) => {
    const weekStart = new Date(weekStartDate);
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + dayOfWeek);
    return date;
  };

  const isToday = (dayOfWeek: number) => {
    const today = new Date();
    const dayDate = getDateForDay(dayOfWeek);
    return today.toDateString() === dayDate.toDateString();
  };

  const isPastDay = (dayOfWeek: number) => {
    const today = new Date();
    const dayDate = getDateForDay(dayOfWeek);
    return dayDate < today;
  };

  const handleSlotClick = (dayOfWeek: number, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    setSelectedSlot({ dayOfWeek, mealType });
    setShowRecipeSelector(true);
  };

  const handleRecipeSelected = async (recipe: Recipe) => {
    if (!selectedSlot) return;

    try {
      await MealPlanningService.addRecipeToMealPlan(
        mealPlan.id,
        recipe.id,
        selectedSlot.dayOfWeek,
        selectedSlot.mealType,
        1
      );

      onScheduleUpdated();
      setShowRecipeSelector(false);
      setSelectedSlot(null);
      toast.success('Recipe added to meal plan!');

    } catch (error) {
      console.error('Failed to add recipe:', error);
      toast.error('Failed to add recipe to meal plan');
    }
  };

  const handleRemoveRecipe = async (scheduleItem: WeeklySchedule) => {
    if (!confirm('Remove this recipe from your meal plan?')) return;

    try {
      // Find the meal plan recipe to remove
      const mealPlanRecipes = await MealPlanningService.getMealPlanRecipes(mealPlan.id);
      const mealPlanRecipe = mealPlanRecipes.find(
        mpr => mpr.recipe_id === scheduleItem.recipe_id &&
               mpr.day_of_week === scheduleItem.day_of_week &&
               mpr.meal_type === scheduleItem.meal_type
      );

      if (mealPlanRecipe) {
        await MealPlanningService.removeRecipeFromMealPlan(mealPlanRecipe.id);
        onScheduleUpdated();
        toast.success('Recipe removed from meal plan');
      }

    } catch (error) {
      console.error('Failed to remove recipe:', error);
      toast.error('Failed to remove recipe');
    }
  };

  const handleMarkCompleted = async (scheduleItem: WeeklySchedule) => {
    try {
      await MealPlanningService.markMealCompleted(scheduleItem.id);
      onScheduleUpdated();
      toast.success('Meal marked as completed!');

    } catch (error) {
      console.error('Failed to mark meal as completed:', error);
      toast.error('Failed to mark meal as completed');
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-full">
        {/* Header */}
        <div className="grid grid-cols-8 gap-2 mb-4">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 p-2">
            Meal
          </div>
          {daysOfWeek.map((day, index) => (
            <div key={day} className="text-center p-2">
              <div className={`text-sm font-medium ${isToday(index) ? 'text-primary-600' : 'text-gray-900 dark:text-white'}`}>
                {day}
              </div>
              <div className={`text-xs ${isToday(index) ? 'text-primary-500' : 'text-gray-500'}`}>
                {getDateForDay(index).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
              </div>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="space-y-2">
          {mealTypes.map((mealType) => (
            <div key={mealType} className="grid grid-cols-8 gap-2">
              {/* Meal Type Label */}
              <div className={`p-3 rounded-lg border-2 ${getMealTypeColor(mealType)} flex items-center justify-center`}>
                <span className="text-lg mr-2">{getMealTypeIcon(mealType)}</span>
                <span className="text-sm font-medium capitalize">{mealType}</span>
              </div>

              {/* Day Slots */}
              {daysOfWeek.map((_, dayIndex) => {
                const scheduleItem = getScheduleForSlot(dayIndex, mealType);
                const isCompleted = scheduleItem?.is_completed;
                const isPast = isPastDay(dayIndex);

                return (
                  <div
                    key={`${dayIndex}-${mealType}`}
                    className={`
                      relative min-h-[80px] p-2 rounded-lg border-2 border-dashed transition-all duration-200
                      ${scheduleItem 
                        ? 'border-solid bg-white dark:bg-gray-700 shadow-sm' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600'
                      }
                      ${isCompleted ? 'opacity-75 bg-green-50 dark:bg-green-900/20' : ''}
                      ${isPast && !scheduleItem ? 'opacity-50' : ''}
                      cursor-pointer hover:shadow-md
                    `}
                    onClick={() => !scheduleItem && handleSlotClick(dayIndex, mealType)}
                  >
                    {scheduleItem ? (
                      <div className="h-full flex flex-col">
                        {/* Recipe Info */}
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                            {scheduleItem.recipe?.title || 'Unknown Recipe'}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {scheduleItem.servings} serving{scheduleItem.servings !== 1 ? 's' : ''}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex space-x-1">
                            {!isCompleted && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkCompleted(scheduleItem);
                                }}
                                className="p-1 text-green-600 hover:text-green-700 transition-colors"
                                title="Mark as completed"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveRecipe(scheduleItem);
                              }}
                              className="p-1 text-red-600 hover:text-red-700 transition-colors"
                              title="Remove recipe"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          {isCompleted && (
                            <div className="text-green-600" title="Completed">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <svg className="w-6 h-6 mx-auto text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <p className="text-xs text-gray-500">Add Recipe</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Recipe Selector Modal */}
      {showRecipeSelector && selectedSlot && (
        <RecipeSelector
          onRecipeSelected={handleRecipeSelected}
          onClose={() => {
            setShowRecipeSelector(false);
            setSelectedSlot(null);
          }}
          mealType={selectedSlot.mealType}
          dayOfWeek={selectedSlot.dayOfWeek}
        />
      )}
    </div>
  );
};

export default WeeklyCalendar;
