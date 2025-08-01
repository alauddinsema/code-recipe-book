import React from 'react';
import { Helmet } from 'react-helmet-async';
import MealPlanningDashboard from '../components/mealPlanning/MealPlanningDashboard';

const MealPlanning: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Meal Planning - PantryAI</title>
        <meta name="description" content="Plan your meals, create weekly schedules, and generate shopping lists with PantryAI's intelligent meal planning system." />
        <meta name="keywords" content="meal planning, weekly menu, meal prep, cooking schedule, recipe planning, grocery list" />
      </Helmet>
      
      <MealPlanningDashboard />
    </>
  );
};

export default MealPlanning;
