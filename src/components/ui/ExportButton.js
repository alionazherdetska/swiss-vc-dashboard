import styles from "./ChartModal.module.css";

const ExportButton = ({
  title = "Export chart",
  onClick = () => window.print(),
  className = "",
  iconOnly = false,
  showIcon = true,
  label,
}) => {
  if (iconOnly) {
    return (
      <button
        className={`flex items-center justify-center rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 ${className}`}
        title={title}
        onClick={onClick}
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 20 17"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M14.7485 4.89011L16.0531 6.14089L10.0731 11.8988L4.05309 6.14525L5.31592 4.90761L10.0499 9.44615L14.7485 4.89011Z"
            fill="currentColor"
          />
          <line x1="10.1152" y1="10" x2="10.1152" y2="0" stroke="currentColor" strokeWidth="2" />
          <path d="M19 6.91016V15.9102H1V6.91016" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
    );
  }

  return (
    <button className={`${styles.exportBtn} ${className}`} title={title} onClick={onClick}>
      {label && <span>{label}</span>}
      {showIcon && (
        <svg
          className="h-5 w-5"
          viewBox="0 0 20 17"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M14.7485 4.89011L16.0531 6.14089L10.0731 11.8988L4.05309 6.14525L5.31592 4.90761L10.0499 9.44615L14.7485 4.89011Z"
            fill="currentColor"
          />
          <line x1="10.1152" y1="10" x2="10.1152" y2="0" stroke="currentColor" strokeWidth="2" />
          <path d="M19 6.91016V15.9102H1V6.91016" stroke="currentColor" strokeWidth="2" />
        </svg>
      )}
    </button>
  );
};

export default ExportButton;