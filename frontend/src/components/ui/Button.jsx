import React from 'react';
import PropTypes from 'prop-types';
import { twMerge } from 'tailwind-merge';

/**
 * Primary UI button component
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  ...rest
}) => {
  // Define base button styles
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-all focus:outline-none';
  
  // Variant styles
  const variantStyles = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
    outline: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
    text: 'bg-transparent text-indigo-600 hover:text-indigo-800 hover:bg-gray-50',
  };
  
  // Size styles
  const sizeStyles = {
    xs: 'text-xs px-2.5 py-1.5',
    sm: 'text-sm px-3 py-2',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-4 py-2',
    xl: 'text-base px-6 py-3',
  };
  
  // Disabled styles
  const disabledStyles = 'opacity-50 cursor-not-allowed';
  
  // Full width style
  const fullWidthStyle = 'w-full';
  
  // Combine all styles
  const buttonClasses = twMerge(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    disabled ? disabledStyles : '',
    fullWidth ? fullWidthStyle : '',
    className
  );
  
  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading && (
        <svg className={`animate-spin -ml-1 mr-2 h-4 w-4 ${variant === 'text' ? 'text-indigo-600' : 'text-white'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      
      {icon && iconPosition === 'left' && !loading && (
        <span className="mr-2">{icon}</span>
      )}
      
      {children}
      
      {icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success', 'outline', 'text']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  loading: PropTypes.bool,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

export default Button;
