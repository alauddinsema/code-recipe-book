import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';
import {
  HomeIcon,
  PlusCircleIcon,
  HeartIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolidIcon,
  PlusCircleIcon as PlusCircleSolidIcon,
  HeartIcon as HeartSolidIcon,
  UserIcon as UserSolidIcon,
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
      path: ROUTES.FAVORITES,
      label: 'Favorites',
      icon: HeartIcon,
      activeIcon: HeartSolidIcon,
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="flex justify-around items-center py-2 px-4 max-w-md mx-auto">
        {visibleItems.map((item) => {
          const active = isActive(item.path);
          const Icon = active ? item.activeIcon : item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 py-1 rounded-xl transition-all duration-200 ${
                active
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
