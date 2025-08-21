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

  if (!isOpen) return null;

  const stop = (e) => e.stopPropagation();

  return (
    <div className="fixed inset-0 z-50 bg-black/75" onClick={onClose} mb-4 style={{
        background: "rgba(0,0,0,0.2)", // Stronger shadow overlay
        backdropFilter: "blur(2px)",   // Optional: subtle blur for modern modal feel
      }}>
      <div className="flex min-h-full items-center justify-center rounded-lg">
        <div
          className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-auto"
          onClick={stop}
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-800 hover:bg-gray-900 text-white transition"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>

          <div className="py-2 px-5">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default ChartModal;
