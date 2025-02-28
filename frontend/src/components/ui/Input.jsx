import React from 'react';
import PropTypes from 'prop-types';
import { twMerge } from 'tailwind-merge';

/**
 * Input component for forms
 */
const Input = ({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  name,
  id,
  error,
  helperText,
  required = false,
  disabled = false,
  className,
  fullWidth = true,
  leftIcon,
  rightIcon,
  ...rest
}) => {
  // Generate unique ID if not provided
  const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  // Base styles
  const baseInputStyles = 'block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm';
  
  // Define conditional styles
  const errorStyles = 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500';
  const disabledStyles = 'bg-gray-100 cursor-not-allowed opacity-75';
  const iconPaddingLeft = leftIcon ? 'pl-10' : 'pl-3';
  const iconPaddingRight = rightIcon ? 'pr-10' : 'pr-3';
  
  // Full width style
  const fullWidthStyle = 'w-full';
  
  // Combine all styles
  const inputClasses = twMerge(
    baseInputStyles,
    'py-2 border border-gray-300',
    iconPaddingLeft,
    iconPaddingRight,
    error ? errorStyles : '',
    disabled ? disabledStyles : '',
    fullWidth ? fullWidthStyle : '',
    className
  );

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label 
          htmlFor={inputId} 
          className={`block text-sm font-medium mb-1 ${error ? 'text-red-700' : 'text-gray-700'}`}
        >
          {label}
          {required && <span className="text-red-600">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            {leftIcon}
          </div>
        )}
        
        <input
          type={type}
          name={name}
          id={inputId}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={inputClasses}
          {...rest}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
            {rightIcon}
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <p className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

Input.propTypes = {
  type: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  name: PropTypes.string,
  id: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  fullWidth: PropTypes.bool,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
};

export default Input;
