import createAnalysisChart from "./shared/CreateAnalysisChart";
import { INDUSTRY_COLOR_MAP } from "../../lib/constants";

/**
 * Quarterly (Sector/Industry) Analysis Chart
 * Uses the shared createAnalysisChart factory to eliminate repetition
 */
const QuarterlyAnalysisChart = createAnalysisChart({
  chartType: "quarterly",
  title: "Quarterly Analysis",
  legendTitle: "Industries",
  categoryField: "Industry",
  colorMap: INDUSTRY_COLOR_MAP,
  volumeLabel: "Investment Volume CHF (M)",
  countLabel: "Number of Deals",
});

export default QuarterlyAnalysisChart;