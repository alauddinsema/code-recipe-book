import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  PlusIcon, 
  HeartIcon, 
  UserIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid, 
  PlusIcon as PlusIconSolid, 
  HeartIcon as HeartIconSolid, 
  UserIcon as UserIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid
} from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';

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
      activeIcon: HomeIconSolid,
      requireAuth: false
    },
    {
      path: '/search', // We'll create this route later
      label: 'Search',
      icon: MagnifyingGlassIcon,
      activeIcon: MagnifyingGlassIconSolid,
      requireAuth: false
    },
    {
      path: ROUTES.ADD_RECIPE,
      label: 'Add',
      icon: PlusIcon,
      activeIcon: PlusIconSolid,
      requireAuth: true
    },
    {
      path: ROUTES.FAVORITES,
      label: 'Favorites',
      icon: HeartIcon,
      activeIcon: HeartIconSolid,
      requireAuth: true
    },
    {
      path: ROUTES.PROFILE,
      label: 'Profile',
      icon: UserIcon,
      activeIcon: UserIconSolid,
      requireAuth: true
    }
  ];

  // Don't show bottom nav on auth pages
  if (location.pathname === ROUTES.LOGIN || location.pathname === ROUTES.REGISTER) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40 sm:hidden">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          // Skip auth-required items if user is not logged in
          if (item.requireAuth && !user) {
            return (
              <div key={item.path} className="flex items-center justify-center">
                <div className="w-6 h-6"></div>
              </div>
            );
          }

          const active = isActive(item.path);
          const IconComponent = active ? item.activeIcon : item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center space-y-1 py-2 px-1 transition-colors duration-200 touch-manipulation ${
                active
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <IconComponent className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
