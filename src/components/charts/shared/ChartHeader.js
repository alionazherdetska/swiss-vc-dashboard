import React from 'react';
import { Maximize2 } from 'lucide-react';
import ExportButton from '../../common/ExportButton';

/**
 * Reusable chart header component
 * Provides consistent styling and functionality for chart titles with action buttons
 */
const ChartHeader = ({
  title,
  showExpandButton = false,
  showExportButton = false,
  onExpand,
  onExport,
  expandButtonColor = 'bg-blue-600',
  expandHoverColor = 'hover:bg-blue-700',
  expandTitle = 'Expand chart',
  isVolumeChart = false,
  
  // Custom content
  children,
  
  // Styling
  className = 'flex items-center gap-2 mb-2',
  titleClassName = 'text-md font-semibold text-gray-800'
}) => {
  // Determine expand button color based on chart type if not explicitly set
  const buttonColor = expandButtonColor === 'bg-blue-600' && !isVolumeChart 
    ? 'bg-green-600' 
    : expandButtonColor;
    
  const hoverColor = expandHoverColor === 'hover:bg-blue-700' && !isVolumeChart
    ? 'hover:bg-green-700'
    : expandHoverColor;

  return (
    <div className={className}>
      <h3 className={titleClassName}>{title}</h3>
      
      {/* Action buttons */}
      {(showExpandButton || showExportButton || children) && (
        <div className="flex gap-2 ml-auto">
          {showExportButton && (
            <ExportButton onClick={onExport} />
          )}
          
          {showExpandButton && (
            <button
              onClick={onExpand}
              className={`p-2 rounded-md ${buttonColor} text-white shadow-md ${hoverColor} transition-colors`}
              title={expandTitle}
            >
              <Maximize2 className="h-5 w-5" />
            </button>
          )}
          
          {/* Custom buttons */}
          {children}
        </div>
      )}
    </div>
  );
};

export default ChartHeader;