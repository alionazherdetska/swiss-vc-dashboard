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
        <img src="/download.svg" alt="Download" className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      className={`h-10 px-4 flex items-center gap-2 text-sm font-medium rounded-full bg-white text-gray-800 hover:bg-gray-50 border border-gray-300 transition-colors ${className}`}
      title={title}
      onClick={onClick}
    >
      {label && <span>{label}</span>}
      {showIcon && <img src="/download.svg" alt="Download" className="h-4 w-4" />}
    </button>
  );
};

export default ExportButton;