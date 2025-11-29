import styles from "../Charts.module.css";

// Unified chart header to better match modal design (title + optional subtitle + compact expand icon)
const ChartHeader = ({
  title,
  subtitle,
  showExpandButton = false,
  onExpand,
  expandTitle = "Expand chart",
  children,
  className = "flex items-center justify-between gap-4 mb-[15px]",
  titleClassName = "",
  subtitleClassName = "text-sm text-gray-500 mt-0.5",
}) => {
  const wrapperClass = String(className).includes("w-") ? className : `${className} w-full`;

  return (
    <div className={wrapperClass}>
      <div className="flex flex-col">
        <h3 className={`${styles.chartTitle}${titleClassName ? ` ${titleClassName}` : ""}`}>{title}</h3>
        <p className={subtitleClassName} aria-hidden>{subtitle ?? "\u00A0"}</p>
      </div>
      {(showExpandButton || children) && (
        <div className="flex items-center gap-2">
          {showExpandButton && (
            <button
              onClick={onExpand}
              className={styles.expandButton}
              title={expandTitle}
              aria-label={expandTitle}
            >
              expand
              <img src="/assets/icons/expand.svg" className={styles.expandIcon} alt="" />
            </button>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

export default ChartHeader;
