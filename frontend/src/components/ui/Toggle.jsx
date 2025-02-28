import React from 'react';
import PropTypes from 'prop-types';
import { Switch } from '@headlessui/react';
import { twMerge } from 'tailwind-merge';

/**
 * Toggle component based on Headless UI Switch
 */
const Toggle = ({ enabled, onChange, className, size = 'md', label, labelPosition = 'left' }) => {
  const sizeClasses = {
    sm: 'h-5 w-9',
    md: 'h-6 w-11',
    lg: 'h-7 w-14'
  };
  
  const thumbSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };
  
  const translateClasses = {
    sm: 'translate-x-4',
    md: 'translate-x-5',
    lg: 'translate-x-7'
  };
  
  return (
    <div className={twMerge('flex items-center', labelPosition === 'left' ? 'justify-between' : 'gap-2', className)}>
      {label && labelPosition === 'left' && <span className="text-sm font-medium text-gray-700">{label}</span>}
      
      <Switch
        checked={enabled}
        onChange={onChange}
        className={twMerge(
          sizeClasses[size],
          'relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
          enabled ? 'bg-indigo-600' : 'bg-gray-200'
        )}
      >
        <span className="sr-only">Toggle</span>
        <span
          className={twMerge(
            thumbSizeClasses[size],
            'transform rounded-full bg-white transition-transform',
            enabled ? translateClasses[size] : 'translate-x-1'
          )}
        />
      </Switch>
      
      {label && labelPosition === 'right' && <span className="text-sm font-medium text-gray-700">{label}</span>}
    </div>
  );
};

Toggle.propTypes = {
  enabled: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  label: PropTypes.string,
  labelPosition: PropTypes.oneOf(['left', 'right'])
};

export default Toggle;
