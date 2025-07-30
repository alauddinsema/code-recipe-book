import React, { useState } from 'react';
import { MinusIcon, PlusIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface MobileNumberInputProps {
  label?: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder?: string;
  error?: string;
  success?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  showSteppers?: boolean;
  allowDecimal?: boolean;
  className?: string;
  containerClassName?: string;
}

const MobileNumberInput: React.FC<MobileNumberInputProps> = ({
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  error,
  success,
  required = false,
  disabled = false,
  min,
  max,
  step = 1,
  unit,
  showSteppers = true,
  allowDecimal = false,
  className = '',
  containerClassName = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [inputValue, setInputValue] = useState(value?.toString() || '');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setHasInteracted(true);

    if (newValue === '') {
      onChange(undefined);
      return;
    }

    const numValue = allowDecimal ? parseFloat(newValue) : parseInt(newValue, 10);
    
    if (!isNaN(numValue)) {
      // Apply min/max constraints
      let constrainedValue = numValue;
      if (min !== undefined && constrainedValue < min) {
        constrainedValue = min;
      }
      if (max !== undefined && constrainedValue > max) {
        constrainedValue = max;
      }
      
      onChange(constrainedValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    setHasInteracted(true);
    
    // Sync input value with actual value on blur
    if (value !== undefined) {
      setInputValue(value.toString());
    } else {
      setInputValue('');
    }
    
    onBlur?.();
  };

  const handleStepUp = () => {
    const currentValue = value || 0;
    const newValue = currentValue + step;
    
    if (max === undefined || newValue <= max) {
      onChange(newValue);
      setInputValue(newValue.toString());
      setHasInteracted(true);
    }
  };

  const handleStepDown = () => {
    const currentValue = value || 0;
    const newValue = currentValue - step;
    
    if (min === undefined || newValue >= min) {
      onChange(newValue);
      setInputValue(newValue.toString());
      setHasInteracted(true);
    }
  };

  const showError = error && hasInteracted;
  const showSuccess = success && hasInteracted && !error;
  const canStepUp = max === undefined || (value || 0) < max;
  const canStepDown = min === undefined || (value || 0) > min;

  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative flex">
        {/* Decrease button */}
        {showSteppers && (
          <button
            type="button"
            onClick={handleStepDown}
            disabled={disabled || !canStepDown}
            className={`
              px-3 py-3 border border-r-0 rounded-l-lg
              transition-all duration-200 ease-in-out
              touch-manipulation
              flex items-center justify-center
              ${isFocused 
                ? 'border-primary-500 dark:border-primary-400' 
                : showError
                ? 'border-red-500 dark:border-red-400'
                : showSuccess
                ? 'border-green-500 dark:border-green-400'
                : 'border-gray-300 dark:border-gray-600'
              }
              ${disabled || !canStepDown
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700'
              }
            `}
          >
            <MinusIcon className="w-4 h-4" />
          </button>
        )}

        {/* Number Input */}
        <input
          type={allowDecimal ? 'number' : 'number'}
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          step={allowDecimal ? 'any' : step}
          className={`
            flex-1 px-4 py-3 text-base text-center
            border
            transition-all duration-200 ease-in-out
            touch-manipulation
            ${showSteppers ? 'rounded-none' : 'rounded-lg'}
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
            placeholder-gray-500 dark:placeholder-gray-400
            focus:outline-none
            ${className}
          `}
        />

        {/* Unit display */}
        {unit && (
          <div className={`
            px-3 py-3 border border-l-0
            ${showSteppers ? 'border-r-0' : 'rounded-r-lg'}
            ${isFocused 
              ? 'border-primary-500 dark:border-primary-400' 
              : showError
              ? 'border-red-500 dark:border-red-400'
              : showSuccess
              ? 'border-green-500 dark:border-green-400'
              : 'border-gray-300 dark:border-gray-600'
            }
            bg-gray-50 dark:bg-gray-800
            text-gray-600 dark:text-gray-400
            flex items-center justify-center
            text-sm font-medium
          `}>
            {unit}
          </div>
        )}

        {/* Increase button */}
        {showSteppers && (
          <button
            type="button"
            onClick={handleStepUp}
            disabled={disabled || !canStepUp}
            className={`
              px-3 py-3 border border-l-0 rounded-r-lg
              transition-all duration-200 ease-in-out
              touch-manipulation
              flex items-center justify-center
              ${isFocused 
                ? 'border-primary-500 dark:border-primary-400' 
                : showError
                ? 'border-red-500 dark:border-red-400'
                : showSuccess
                ? 'border-green-500 dark:border-green-400'
                : 'border-gray-300 dark:border-gray-600'
              }
              ${disabled || !canStepUp
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700'
              }
            `}
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        )}

        {/* Status icon (when no steppers) */}
        {!showSteppers && (showError || showSuccess) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {showError && (
              <ExclamationCircleIcon className="w-5 h-5 text-red-500 dark:text-red-400" />
            )}
            {showSuccess && (
              <CheckCircleIcon className="w-5 h-5 text-green-500 dark:text-green-400" />
            )}
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

export default MobileNumberInput;
