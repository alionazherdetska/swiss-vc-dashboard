const ChartLegend = ({ items = [], colorOf, title = "Legend" }) => {
  if (!items || !items.length) return null;
  return (
    <div className="flex flex-col flex-wrap gap-4 justify-center py-2">
      {title && <span className="text-sm font-semibold text-gray-700 mr-4">{title}:</span>}
      {items.map((item) => (
        <span key={item} className="flex items-center gap-2">
          <span
            className="inline-block w-5 h-5 rounded"
            style={{ backgroundColor: colorOf(item) }}
          ></span>
          <span className="text-sm text-gray-800">{item}</span>
        </span>
      ))}
    </div>
  );
};

export default ChartLegend;
