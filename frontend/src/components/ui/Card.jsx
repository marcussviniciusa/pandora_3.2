import React from 'react';
import PropTypes from 'prop-types';
import { twMerge } from 'tailwind-merge';

/**
 * Card component with customizable styling
 */
const Card = ({ children, className, onClick, padding = true, shadow = true, border = true, rounded = true }) => {
  return (
    <div
      className={twMerge(
        padding ? 'p-4' : '',
        shadow ? 'shadow-sm' : '',
        border ? 'border border-gray-200' : '',
        rounded ? 'rounded-lg' : '',
        'bg-white',
        onClick ? 'cursor-pointer hover:shadow transition-shadow duration-200' : '',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  onClick: PropTypes.func,
  padding: PropTypes.bool,
  shadow: PropTypes.bool,
  border: PropTypes.bool,
  rounded: PropTypes.bool
};

export default Card;
