import styles from "../Charts.module.css";

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
              className={styles.expandButton}
              title={expandTitle}
              aria-label={expandTitle}
            >
              expand
                <img src="/expand.svg" className={styles.expandIcon} alt="" />
            </button>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

export default ChartHeader;
