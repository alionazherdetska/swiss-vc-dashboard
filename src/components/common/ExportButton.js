const ExportButton = ({
  title = "Export chart (print or save as PDF)",
  onClick = () => window.print(),
  className = "",
  iconOnly = false,
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
      className={`h-10 px-2 flex items-center gap-2 text-base font-medium rounded-md bg-gray-100 text-gray-900 hover:bg-gray-200 border-none shadow-none transition-colors ${className}`}
      title={title}
      onClick={onClick}
    >
      {label ? <span>{label}</span> : null}
      <img src="/download.svg" alt="Download" className="h-5 w-5" />
    </button>
  );
};

export default ExportButton;
