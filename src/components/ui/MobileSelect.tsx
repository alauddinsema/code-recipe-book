import React, { useState } from 'react';
import { ChevronDownIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface MobileSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  success?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
  native?: boolean; // Use native select on mobile
}

const MobileSelect: React.FC<MobileSelectProps> = ({
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  options,
  placeholder = 'Select an option',
  error,
  success,
  required = false,
  disabled = false,
  className = '',
  containerClassName = '',
  native = true // Default to native select for better mobile UX
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
    setHasInteracted(true);
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    setHasInteracted(true);
    onBlur?.();
  };

  const showError = error && hasInteracted;
  const showSuccess = success && hasInteracted && !error;

  const selectedOption = options.find(option => option.value === value);

  if (native) {
    return (
      <div className={`space-y-2 ${containerClassName}`}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Native Select Container */}
        <div className="relative">
          <select
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            className={`
              w-full px-4 py-3 text-base
              border rounded-lg
              transition-all duration-200 ease-in-out
              touch-manipulation
              appearance-none
              ${isFocused 
                ? 'border-primary-500 ring-2 ring-primary-500/20 dark:border-primary-400 dark:ring-primary-400/20' 
                : showError
                ? 'border-red-500 dark:border-red-400'
                : showSuccess
                ? 'border-green-500 dark:border-green-400'
                : 'border-gray-300 dark:border-gray-600'
              }
              ${disabled 
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white'
              }
              focus:outline-none
              pr-12
              ${className}
            `}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Icons */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 pointer-events-none">
            {/* Status icons */}
            {showError && (
              <ExclamationCircleIcon className="w-5 h-5 text-red-500 dark:text-red-400" />
            )}
            {showSuccess && (
              <CheckCircleIcon className="w-5 h-5 text-green-500 dark:text-green-400" />
            )}
            
            {/* Chevron */}
            {!showError && !showSuccess && (
              <ChevronDownIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            )}
          </div>
        </div>

        {/* Helper text and error */}
        <div>
          {showError && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
              <ExclamationCircleIcon className="w-4 h-4 mr-1 flex-shrink-0" />
              {error}
            </p>
          )}
          {showSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
              <CheckCircleIcon className="w-4 h-4 mr-1 flex-shrink-0" />
              {success}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Custom select implementation (for desktop or when native=false)
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setHasInteracted(true);
  };

  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Custom Select Container */}
      <div className="relative">
        <button
          type="button"
          onClick={handleToggle}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={`
            w-full px-4 py-3 text-base text-left
            border rounded-lg
            transition-all duration-200 ease-in-out
            touch-manipulation
            ${isFocused || isOpen
              ? 'border-primary-500 ring-2 ring-primary-500/20 dark:border-primary-400 dark:ring-primary-400/20' 
              : showError
              ? 'border-red-500 dark:border-red-400'
              : showSuccess
              ? 'border-green-500 dark:border-green-400'
              : 'border-gray-300 dark:border-gray-600'
            }
            ${disabled 
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
              : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
            }
            focus:outline-none
            pr-12
            ${className}
          `}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </button>

        {/* Icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 pointer-events-none">
          {showError && (
            <ExclamationCircleIcon className="w-5 h-5 text-red-500 dark:text-red-400" />
          )}
          {showSuccess && (
            <CheckCircleIcon className="w-5 h-5 text-green-500 dark:text-green-400" />
          )}
          
          <ChevronDownIcon 
            className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleOptionClick(option.value)}
                disabled={option.disabled}
                className={`
                  w-full px-4 py-3 text-left text-base
                  transition-colors duration-150
                  touch-manipulation
                  ${option.value === value 
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                    : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                  }
                  ${option.disabled 
                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                    : 'cursor-pointer'
                  }
                  first:rounded-t-lg last:rounded-b-lg
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Helper text and error */}
      <div>
        {showError && (
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
            <ExclamationCircleIcon className="w-4 h-4 mr-1 flex-shrink-0" />
            {error}
          </p>
        )}
        {showSuccess && (
          <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
            <CheckCircleIcon className="w-4 h-4 mr-1 flex-shrink-0" />
            {success}
          </p>
        )}
      </div>
    </div>
  );
};

export default MobileSelect;
