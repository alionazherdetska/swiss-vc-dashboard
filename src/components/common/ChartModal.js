import React, { useEffect } from "react";
import { X } from "lucide-react";

const ChartModal = ({ isOpen, onClose, title, children }) => {
  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const stop = (e) => e.stopPropagation();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(2px)",
      }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full h-full flex flex-col"
        style={{
          maxWidth: "95vw",
          maxHeight: "95vh",
          minHeight: "60vh",
        }}
        onClick={stop}
      >
        {/* Fixed Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate pr-4">
              {title}
            </h2>
            <button 
              onClick={onClose} 
              className="flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-800 hover:bg-gray-900 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500" 
              aria-label="Close modal"
            > 
              <X className="h-4 w-4" /> 
              <span className="hidden sm:inline">Close</span> 
            </button> 
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-h-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartModal;