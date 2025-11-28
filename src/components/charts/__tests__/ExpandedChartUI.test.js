import React from "react";
import { render, screen } from "@testing-library/react";
import ChartModal from "../../ui/ChartModal";
import ChartControls from "../common/ChartControls";

describe("Expanded chart UI", () => {
  test("expanded modal shows title, export buttons, show total and mode radios", () => {
    const onClose = jest.fn();
    const onExport = jest.fn();

    // headerRight: show total checkbox
    const headerRight = (
      <label className="flex items-center gap-2 px-3 h-9 whitespace-nowrap">
        <input type="checkbox" checked={false} readOnly />
        <span>Show total</span>
      </label>
    );

    render(
      <ChartModal isOpen={true} onClose={onClose} title={"Expanded Investment Volume"} onExport={onExport} headerRight={headerRight}>
        <ChartControls
          isDualChart={false}
          showModeControls={true}
          singleMode={"line"}
          onSingleModeChange={() => {}}
          showTotalControl={true}
          showTotal={false}
          onShowTotalChange={() => {}}
          showExportButton={false}
        />
      </ChartModal>
    );

    // Title and subtitle
    expect(screen.getByText(/Expanded Investment Volume/i)).toBeInTheDocument();
    expect(screen.getByText(/in CHF Mio\./i)).toBeInTheDocument();

    // Export buttons rendered by ChartModal
    expect(screen.getByRole("button", { name: /CSV/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /PDF/i })).toBeInTheDocument();

    // Show total checkbox appears both in headerRight and in the ChartControls area;
    // assert that at least two "Show total" labels exist.
    const showTotalMatches = screen.getAllByText(/Show total/i);
    expect(showTotalMatches.length).toBeGreaterThanOrEqual(2);

    // Mode radios from ChartControls
    expect(screen.getByText(/Line/i)).toBeInTheDocument();
    expect(screen.getByText(/Stacked/i)).toBeInTheDocument();

    // Close button (aria-label in ChartModal)
    expect(screen.getByLabelText(/Close modal/i)).toBeInTheDocument();
  });

  test("total investment deals expanded view does not show Line/Stacked radios", () => {
    render(
      <ChartControls
        isDualChart={false}
        showModeControls={false}
        singleMode={"line"}
        onSingleModeChange={() => {}}
        showExportButton={false}
      />
    );

    // Radios should not be present
    expect(screen.queryByText(/Line/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Stacked/i)).not.toBeInTheDocument();
  });
});
