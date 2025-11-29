import createAnalysisChart from "./common/CreateAnalysisChart";
import { CEO_GENDER_COLOR_MAP } from "../../lib/constants";

/**
 * Gender Analysis Chart
 * Uses the shared createAnalysisChart factory to eliminate repetition
 */
const GenderAnalysisChart = createAnalysisChart({
  chartType: "gender",
  title: "Gender Analysis",
  legendTitle: "Genders",
  categoryField: "Gender CEO",
  colorMap: CEO_GENDER_COLOR_MAP,
  // Filter out deals with unknown gender
  filterDeals: (deals) =>
    deals.filter((d) => {
      const gender = d["Gender CEO"];
      return gender && gender.trim() && gender !== "Unknown";
    }),
  volumeLabel: "Invested capital",
  countLabel: "Number of deals",
});

export default GenderAnalysisChart;
