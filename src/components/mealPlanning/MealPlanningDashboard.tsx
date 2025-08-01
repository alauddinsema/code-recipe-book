import React, { useState, useEffect } from 'react';
import { MealPlanningService, type MealPlan, type WeeklySchedule, type MealPlanStats } from '../../services/mealPlanningService';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui';
import WeeklyCalendar from './WeeklyCalendar';
import MealPlanTemplates from './MealPlanTemplates';
import CreateMealPlanModal from './CreateMealPlanModal';
import toast from 'react-hot-toast';

const MealPlanningDashboard: React.FC = () => {
  const { user } = useAuth();
  const [currentMealPlan, setCurrentMealPlan] = useState<MealPlan | null>(null);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule[]>([]);
  const [stats, setStats] = useState<MealPlanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadMealPlanningData();
    }
  }, [user]);

  useEffect(() => {
    // Calculate current week start (Sunday)
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    setCurrentWeekStart(weekStart.toISOString().split('T')[0]);
  }, []);

  const loadMealPlanningData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load current week's meal plan and stats
      const [currentWeekData, statsData] = await Promise.all([
        MealPlanningService.getCurrentWeekMealPlan(user.id),
        MealPlanningService.getMealPlanStats(user.id)
      ]);

      setCurrentMealPlan(currentWeekData.mealPlan);
      setWeeklySchedule(currentWeekData.schedule);
      setStats(statsData);

    } catch (error) {
      console.error('Failed to load meal planning data:', error);
      toast.error('Failed to load meal planning data');
    } finally {
      setLoading(false);
    }
  };

  const handleMealPlanCreated = (newMealPlan: MealPlan) => {
    setCurrentMealPlan(newMealPlan);
    setShowCreateModal(false);
    loadMealPlanningData();
    toast.success('Meal plan created successfully!');
  };

  const handleTemplateApplied = (mealPlan: MealPlan) => {
    setCurrentMealPlan(mealPlan);
    setShowTemplates(false);
    loadMealPlanningData();
    toast.success('Template applied successfully!');
  };

  const handleScheduleUpdated = () => {
    loadMealPlanningData();
  };

  const getDaysUntilWeekEnd = () => {
    const today = new Date();
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + (6 - today.getDay()));
    const diffTime = weekEnd.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getWeekDateRange = () => {
    if (!currentWeekStart) return '';
    
    const start = new Date(currentWeekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const getCompletedMealsThisWeek = () => {
    return weeklySchedule.filter(meal => meal.is_completed).length;
  };

  const getTotalPlannedMealsThisWeek = () => {
    return weeklySchedule.length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meal Planning</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Plan your meals, generate shopping lists, and stay organized
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => setShowTemplates(true)} variant="secondary">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Templates
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Plan
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_plans}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Plans</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">{stats.active_plans}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Plans</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{getCompletedMealsThisWeek()}/{getTotalPlannedMealsThisWeek()}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">This Week</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{getDaysUntilWeekEnd()}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Days Left</div>
          </div>
        </div>
      )}

      {/* Current Week Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-8">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                This Week's Meal Plan
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {getWeekDateRange()}
              </p>
            </div>
            {currentMealPlan && (
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {currentMealPlan.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {currentMealPlan.total_recipes} recipes planned
                </div>
              </div>
            )}
          </div>
        </div>

        {currentMealPlan ? (
          <div className="p-6">
            <WeeklyCalendar
              mealPlan={currentMealPlan}
              weekStartDate={currentWeekStart}
              schedule={weeklySchedule}
              onScheduleUpdated={handleScheduleUpdated}
            />
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No meal plan for this week
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create a new meal plan or apply a template to get started
            </p>
            <div className="flex justify-center space-x-3">
              <Button onClick={() => setShowCreateModal(true)}>
                Create New Plan
              </Button>
              <Button onClick={() => setShowTemplates(true)} variant="secondary">
                Browse Templates
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {currentMealPlan && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              🛒 Shopping List
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Generate a shopping list from your meal plan
            </p>
            <Button size="sm" className="w-full">
              Generate List
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              🥘 Pantry Check
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              See what ingredients you already have
            </p>
            <Button size="sm" variant="secondary" className="w-full">
              Check Pantry
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              📊 Nutrition
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              View nutritional breakdown of your plan
            </p>
            <Button size="sm" variant="secondary" className="w-full">
              View Nutrition
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateMealPlanModal
          onMealPlanCreated={handleMealPlanCreated}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showTemplates && (
        <MealPlanTemplates
          onTemplateApplied={handleTemplateApplied}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
};

export default MealPlanningDashboard;
