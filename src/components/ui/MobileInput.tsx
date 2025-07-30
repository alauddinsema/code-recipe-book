import React, { useState, useRef, useEffect } from 'react';
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface MobileInputProps {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'url' | 'search';
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder?: string;
  error?: string;
  success?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'url' | 'numeric' | 'decimal' | 'search';
  enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
  className?: string;
  containerClassName?: string;
  showCharacterCount?: boolean;
  formatValue?: (value: string) => string;
  validateOnBlur?: boolean;
  clearable?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const MobileInput: React.FC<MobileInputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  error,
  success,
  required = false,
  disabled = false,
  autoComplete,
  autoFocus = false,
  maxLength,
  minLength,
  pattern,
  inputMode,
  enterKeyHint,
  className = '',
  containerClassName = '',
  showCharacterCount = false,
  formatValue,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validateOnBlur = false,
  clearable = false,
  leftIcon,
  rightIcon
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  // Auto-detect input mode based on type
  const inputModeMap: Record<string, string> = {
    email: 'email',
    tel: 'tel',
    url: 'url',
    number: 'numeric',
    search: 'search',
    text: 'text',
    password: 'text'
  };
  const detectedInputMode = inputMode || inputModeMap[type] || 'text';

  // Auto-detect enter key hint
  const enterKeyHintMap: Record<string, string> = {
    email: 'next',
    password: 'done',
    search: 'search',
    text: 'done',
    tel: 'done',
    url: 'done',
    number: 'done'
  };
  const detectedEnterKeyHint = enterKeyHint || enterKeyHintMap[type] || 'done';

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    if (formatValue) {
      newValue = formatValue(newValue);
    }
    
    onChange(newValue);
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

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
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

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
            {leftIcon}
          </div>
        )}

        {/* Input */}
        <input
          ref={inputRef}
          type={inputType}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          inputMode={detectedInputMode as any}
          enterKeyHint={detectedEnterKeyHint as any}
          className={`
            w-full px-4 py-3 text-base
            ${leftIcon ? 'pl-10' : ''}
            ${(rightIcon || type === 'password' || clearable || showError || showSuccess) ? 'pr-12' : ''}
            border rounded-lg
            transition-all duration-200 ease-in-out
            touch-manipulation
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

        {/* Right Icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {/* Clear button */}
          {clearable && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors touch-manipulation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Password toggle */}
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors touch-manipulation"
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Status icons */}
          {showError && (
            <ExclamationCircleIcon className="w-5 h-5 text-red-500 dark:text-red-400" />
          )}
          {showSuccess && (
            <CheckCircleIcon className="w-5 h-5 text-green-500 dark:text-green-400" />
          )}

          {/* Custom right icon */}
          {rightIcon && !showError && !showSuccess && (
            <div className="text-gray-400 dark:text-gray-500">
              {rightIcon}
            </div>
          )}
        </div>
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

export default MobileInput;
