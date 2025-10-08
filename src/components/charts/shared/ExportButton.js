import React from 'react';

/**
 * Shared export button component to eliminate duplication across charts
 * Provides consistent styling and behavior for chart export functionality
 */
const ExportButton = ({
  onClick,
  className = "h-10 px-4 flex items-center gap-2 text-base font-medium rounded-md bg-gray-100 text-gray-900 hover:bg-gray-200 border-none shadow-none transition-colors",
  title = "Export chart (print or save as PDF)",
  text = "Export",
  iconSrc = "/download.svg",
  iconAlt = "Download",
  iconClassName = "h-5 w-5",
  style = { minHeight: '40px' },
  disabled = false,
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      className={className}
      title={title}
      style={style}
      disabled={disabled}
      {...props}
    >
      {text}
      <img src={iconSrc} alt={iconAlt} className={iconClassName} />
    </button>
  );
};

export default ExportButton;