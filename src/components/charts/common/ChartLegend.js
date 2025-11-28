import filterStyles from "../../filters/FilterPanel.module.css";

const ChartLegend = ({
  items = [],
  colorOf,
  title = "Legend",
  // optional checkbox mode
  showCheckboxes = false,
  checkedItems = [],
  onToggle = null,
}) => {
  if (!items || !items.length) return null;
  const isChecked = (it) => (checkedItems ? checkedItems.includes(it) : false);
  return (
    <div className="flex flex-col gap-4 justify-start py-2">
      {title && <span className="text-sm font-semibold text-gray-700 mr-4">{title}:</span>}
      {items.map((item) => (
        <label key={item} className="flex items-center gap-2 cursor-pointer">
          {showCheckboxes ? (
            <>
              <input
                type="checkbox"
                checked={isChecked(item)}
                onChange={() => onToggle && onToggle(item)}
                className={filterStyles.checkboxColored}
                style={{
                  // CSS modules + CSS variable for colored checkbox
                  "--checkbox-bg-color": colorOf(item),
                }}
                aria-label={`Toggle ${item}`}
              />
              <span className="text-sm text-gray-800 ml-2">{item}</span>
            </>
          ) : (
            <>
              <span
                className="inline-block w-5 h-5 rounded"
                style={{ backgroundColor: colorOf(item) }}
              ></span>
              <span className="text-sm text-gray-800">{item}</span>
            </>
          )}
        </label>
      ))}
    </div>
  );
};

export default ChartLegend;
