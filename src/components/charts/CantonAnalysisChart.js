import createAnalysisChart from "./shared/CreateAnalysisChart";
import { normalizeCanton } from "../../lib/utils";
import { CANTON_COLOR_MAP } from "../../lib/constants";

/**
 * Canton Analysis Chart
 * Uses the shared createAnalysisChart factory to eliminate repetition
 */
const CantonAnalysisChart = createAnalysisChart({
  chartType: "canton",
  title: "Canton Analysis",
  legendTitle: "Cantons",
  categoryField: "Canton",
  colorMap: CANTON_COLOR_MAP,
  normalizeCategory: normalizeCanton,
  volumeLabel: "Investment Volume CHF (M)",
  countLabel: "Number of Deals",
});

export default CantonAnalysisChart;