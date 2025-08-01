import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';
import {
  HomeIcon,
  PlusCircleIcon,
  HeartIcon,
  UserIcon,
  CloudArrowDownIcon,
  ShoppingCartIcon,
  ArchiveBoxIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolidIcon,
  PlusCircleIcon as PlusCircleSolidIcon,
  HeartIcon as HeartSolidIcon,
  UserIcon as UserSolidIcon,
  CloudArrowDownIcon as CloudArrowDownSolidIcon,
  ShoppingCartIcon as ShoppingCartSolidIcon,
  ArchiveBoxIcon as ArchiveBoxSolidIcon,
  CalendarDaysIcon as CalendarDaysSolidIcon,
} from '@heroicons/react/24/solid';

const BottomNavigation: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      path: ROUTES.HOME,
      label: 'Home',
      icon: HomeIcon,
      activeIcon: HomeSolidIcon,
      requireAuth: false,
    },
    {
      path: ROUTES.ADD_RECIPE,
      label: 'Add Recipe',
      icon: PlusCircleIcon,
      activeIcon: PlusCircleSolidIcon,
      requireAuth: true,
    },
    {
      path: ROUTES.MEAL_PLANNING,
      label: 'Meal Plan',
      icon: CalendarDaysIcon,
      activeIcon: CalendarDaysSolidIcon,
      requireAuth: true,
    },
    {
      path: ROUTES.GROCERY_LISTS,
      label: 'Grocery',
      icon: ShoppingCartIcon,
      activeIcon: ShoppingCartSolidIcon,
      requireAuth: true,
    },
    {
      path: ROUTES.PANTRY,
      label: 'Pantry',
      icon: ArchiveBoxIcon,
      activeIcon: ArchiveBoxSolidIcon,
      requireAuth: true,
    },
    {
      path: ROUTES.PROFILE,
      label: 'Profile',
      icon: UserIcon,
      activeIcon: UserSolidIcon,
      requireAuth: true,
    },
  ];

  // Filter items based on authentication
  const visibleItems = navItems.filter(item => !item.requireAuth || user);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-2xl">
      {/* Android-style bottom navigation */}
      <div className="flex justify-around items-center py-1 px-2 max-w-md mx-auto">
        {visibleItems.map((item) => {
          const active = isActive(item.path);
          const Icon = active ? item.activeIcon : item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center min-w-[64px] min-h-[56px] px-3 py-2 rounded-2xl transition-all duration-300 ${
                active
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 scale-105'
                  : 'text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
              <span className={`text-xs font-medium transition-all duration-200 ${active ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Android-style home indicator */}
      <div className="flex justify-center pb-1">
        <div className="w-32 h-1 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50"></div>
      </div>
    </nav>
  );
};

export default BottomNavigation;
