import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock D3MultiSeriesChart to observe props
jest.mock("../common/D3MultiSeriesChart", () => (props) => (
  <div
    data-testid="mock-multi"
    data-showtotal={props.showTotal ? "true" : "false"}
    data-mode={props.mode}
  />
));

import createAnalysisChart from "../common/CreateAnalysisChart";

const sampleDeals = [
  { Category: "A", Year: 2019, Amount: 1 },
  { Category: "B", Year: 2020, Amount: 2 },
  { Category: "A", Year: 2020, Amount: 3 },
];

describe("CreateAnalysisChart factory", () => {
  test("expanded modal passes showTotal and mode to D3MultiSeriesChart", async () => {
    const ConfigChart = createAnalysisChart({
      chartType: "test",
      title: "Test Chart",
      legendTitle: "Categories",
      categoryField: "Category",
      colorMap: {},
    });

    render(<ConfigChart deals={sampleDeals} />);

    // Expand button should exist (volume)
    const expandBtn = screen.getByRole("button", { name: /Expand Volume Chart/i });
    await userEvent.click(expandBtn);

    // Mocked D3MultiSeriesChart instances exist in main view and in modal; find the modal instance
    const allMocks = await screen.findAllByTestId("mock-multi");
    const modalMock = allMocks.find((el) => el.getAttribute("data-showtotal") === "true");
    expect(modalMock).toBeDefined();

    // Toggle checkbox inside modal
    const modalCloseBtn = screen.getByRole("button", { name: /Close modal/i });
    const modalFrame = modalCloseBtn.closest(".modalFrame") || document.body;
    const { within } = require("@testing-library/react");
    const checkbox = within(modalFrame).getByRole("checkbox");
    await userEvent.click(checkbox);

    const allMocksAfter = await screen.findAllByTestId("mock-multi");
    const modalAfter = allMocksAfter.find((el) => el.getAttribute("data-showtotal") === "false");
    expect(modalAfter).toBeDefined();

    // Mode controls should be present and changeable (radio buttons)
    const stackedRadio = within(modalFrame).getByRole("radio", { name: /Stacked/i });
    await userEvent.click(stackedRadio);
    expect(stackedRadio).toBeChecked();

    // Modal mock should reflect mode change
    const allMocksMode = await screen.findAllByTestId("mock-multi");
    const modalMode =
      allMocksMode.find((el) => el.closest(".modalFrame")) || allMocksMode[allMocksMode.length - 1];
    expect(modalMode).toHaveAttribute("data-mode", "column");
  });
});
