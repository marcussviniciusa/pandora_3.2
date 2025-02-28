import React from 'react';
import PropTypes from 'prop-types';
import { twMerge } from 'tailwind-merge';

/**
 * Loading screen component to display during application loading states
 */
const LoadingScreen = ({ message = 'Loading...', fullScreen = true, overlay = false, className }) => {
  return (
    <div 
      className={twMerge(
        'flex flex-col items-center justify-center',
        fullScreen ? 'fixed inset-0 z-50' : 'w-full h-full min-h-[200px]',
        overlay ? 'bg-white/80 backdrop-blur-sm' : 'bg-white',
        className
      )}
    >
      <div className="relative">
        {/* Spinner */}
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        
        {/* Pandora logo in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-indigo-600 text-xl font-bold">P</span>
        </div>
      </div>
      
      {message && (
        <p className="mt-4 text-gray-600 font-medium">{message}</p>
      )}
    </div>
  );
};

LoadingScreen.propTypes = {
  message: PropTypes.string,
  fullScreen: PropTypes.bool,
  overlay: PropTypes.bool,
  className: PropTypes.string
};

export default LoadingScreen;
