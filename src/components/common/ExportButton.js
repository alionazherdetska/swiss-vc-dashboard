const ExportButton = ({
  title = "Export chart (print or save as PDF)",
  onClick = () => window.print(),
  className = "",
}) => {
  return (
    <button
      className={`h-10 px-4 flex items-center gap-2 text-base font-medium rounded-md bg-gray-100 text-gray-900 hover:bg-gray-200 border-none shadow-none transition-colors ${className}`}
      style={{ minHeight: "40px" }}
      title={title}
      onClick={onClick}
    >
      Export
      <img src="/download.svg" alt="Download" className="h-5 w-5" />
    </button>
  );
};

export default ExportButton;
