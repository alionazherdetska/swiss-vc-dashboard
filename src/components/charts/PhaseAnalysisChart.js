import createAnalysisChart from "./common/CreateAnalysisChart";
import { STAGE_COLOR_MAP } from "../../lib/constants";

/**
 * Phase Analysis Chart
 * Uses the shared createAnalysisChart factory for consistency
 */
const PhaseAnalysisChart = createAnalysisChart({
  chartType: "phase",
  title: "Phase Analysis",
  legendTitle: "Phases",
  categoryField: "Phase",
  colorMap: STAGE_COLOR_MAP,
  volumeLabel: "Invested capital",
  countLabel: "Number of Deals",
});

export default PhaseAnalysisChart;