import React from 'react';
import { Maximize2 } from 'lucide-react';
import ExportButton from '../../common/ExportButton';

/**
 * Reusable chart controls component
 * Provides consistent UI for chart mode selection, export, and expand functionality
 */
const ChartControls = ({
  // Mode controls
  showModeControls = true,
  leftMode,
  rightMode,
  singleMode,
  onLeftModeChange,
  onRightModeChange,
  onSingleModeChange,
  
  // Layout type
  isDualChart = false,
  
  // Show total checkbox
  showTotalControl = false,
  showTotal,
  onShowTotalChange,
  
  // Export functionality
  showExportButton = true,
  onExport,
  
  // Expand functionality
  showExpandButton = true,
  onExpand,
  expandButtonColor = 'bg-blue-600',
  expandTitle = 'Expand chart',
  
  // Custom controls
  children,
  
  // Styling
  className = 'flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-gray-50'
}) => {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-4">
        {/* Mode controls for dual charts */}
        {showModeControls && isDualChart && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-gray-700">Left (Volume):</span>
              <select
                value={leftMode}
                onChange={(e) => onLeftModeChange?.(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700 focus:outline-none"
              >
                <option value="line">Line</option>
                <option value="column">Column</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700">Right (Count):</span>
              <select
                value={rightMode}
                onChange={(e) => onRightModeChange?.(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700 focus:outline-none"
              >
                <option value="line">Line</option>
                <option value="column">Column</option>
              </select>
            </div>
          </>
        )}
        
        {/* Mode controls for single charts */}
        {showModeControls && !isDualChart && (
          <div className="flex items-center gap-2">
            <span className="text-gray-700">Chart Type:</span>
            <select
              value={singleMode}
              onChange={(e) => onSingleModeChange?.(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm bg-white border-gray-300 text-gray-700 focus:outline-none"
            >
              <option value="line">Line</option>
              <option value="column">Column</option>
            </select>
          </div>
        )}
        
        {/* Show Total checkbox */}
        {showTotalControl && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showTotal}
              onChange={(e) => onShowTotalChange?.(e.target.checked)}
            />
            <span className="text-gray-700">Show total</span>
          </label>
        )}
        
        {/* Custom controls */}
        {children}
      </div>
      
      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {showExportButton && (
          <ExportButton onClick={onExport} />
        )}
        
        {showExpandButton && (
          <button
            onClick={onExpand}
            className={`p-2 rounded-md ${expandButtonColor} text-white shadow-md hover:opacity-90 transition-colors`}
            title={expandTitle}
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChartControls;