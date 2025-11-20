import { Maximize2 } from "lucide-react";

// Unified chart header to better match modal design (title + optional subtitle + compact expand icon)
const ChartHeader = ({
  title,
  subtitle,
  showExpandButton = false,
  onExpand,
  expandTitle = "Expand chart",
  children,
  className = "flex items-start gap-4 mb-4",
  titleClassName = "text-xl font-semibold text-gray-900 leading-tight",
  subtitleClassName = "text-sm text-gray-500 mt-0.5",
}) => {
  return (
    <div className={className}>
      <div className="flex flex-col">
        <h3 className={titleClassName}>{title}</h3>
        {subtitle && <p className={subtitleClassName}>{subtitle}</p>}
      </div>
      {(showExpandButton || children) && (
        <div className="flex items-center gap-2 ml-auto">
          {showExpandButton && (
            <button
              onClick={onExpand}
              className="w-9 h-9 inline-flex items-center justify-center rounded-full border border-gray-400 bg-white hover:bg-gray-50 transition-colors"
              title={expandTitle}
              aria-label={expandTitle}
            >
              <Maximize2 className="h-4 w-4 text-gray-700" />
            </button>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

export default ChartHeader;
