import React, { useState, useRef, useEffect } from 'react';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface MobileTextareaProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder?: string;
  error?: string;
  success?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
  minLength?: number;
  autoFocus?: boolean;
  autoResize?: boolean;
  className?: string;
  containerClassName?: string;
  showCharacterCount?: boolean;
  enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
}

const MobileTextarea: React.FC<MobileTextareaProps> = ({
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
  rows = 4,
  maxLength,
  minLength,
  autoFocus = false,
  autoResize = false,
  className = '',
  containerClassName = '',
  showCharacterCount = false,
  enterKeyHint = 'enter'
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value, autoResize]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
  const characterCount = value.length;
  const isOverLimit = maxLength ? characterCount > maxLength : false;

  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Textarea Container */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          rows={autoResize ? undefined : rows}
          maxLength={maxLength}
          minLength={minLength}
          enterKeyHint={enterKeyHint}
          className={`
            w-full px-4 py-3 text-base
            border rounded-lg
            transition-all duration-200 ease-in-out
            touch-manipulation
            resize-none
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
            ${autoResize ? 'min-h-[6rem]' : ''}
            ${className}
          `}
          style={autoResize ? { height: 'auto', minHeight: '6rem' } : undefined}
        />

        {/* Status icon */}
        {(showError || showSuccess) && (
          <div className="absolute top-3 right-3">
            {showError && (
              <ExclamationCircleIcon className="w-5 h-5 text-red-500 dark:text-red-400" />
            )}
            {showSuccess && (
              <CheckCircleIcon className="w-5 h-5 text-green-500 dark:text-green-400" />
            )}
          </div>
        )}
      </div>

      {/* Helper text, error, success, and character count */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
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

        {/* Character count */}
        {showCharacterCount && maxLength && (
          <p className={`text-xs ml-2 flex-shrink-0 ${
            isOverLimit 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {characterCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
};

export default MobileTextarea;
