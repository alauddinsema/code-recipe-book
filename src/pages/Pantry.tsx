import React from 'react';
import { SEOHead } from '../components';
import PantryDashboard from '../components/pantry/PantryDashboard';

const Pantry: React.FC = () => {
  return (
    <>
      <SEOHead 
        title="My Pantry - PantryAI"
        description="Track your ingredients, manage expiration dates, and never run out of essentials with smart pantry management."
        keywords="pantry management, ingredient tracking, expiration dates, food inventory, smart kitchen"
      />
      <PantryDashboard />
    </>
  );
};

export default Pantry;
