import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock D3AreaChart to avoid d3 rendering
jest.mock("../common/D3AreaChart", () => (props) => (
  <div data-testid="mock-area" data-mode={props.mode ?? "line"} />
));

import TimelineChart from "../TimelineChart";

const sampleData = [
  { year: 2019, volume: 1, count: 1 },
  { year: 2020, volume: 3, count: 2 },
];

describe("TimelineChart expanded behavior", () => {
  test("expand opens modal and close button closes it; mode dropdown present", async () => {
    render(<TimelineChart data={sampleData} showVolume={true} />);

    // Expand button should open modal
    const expandBtn = screen.getByRole("button", { name: /Expand Chart/i });
    await userEvent.click(expandBtn);

    // Modal should show expanded title
    expect(await screen.findByText(/Expanded Investment Volume/i)).toBeInTheDocument();

    // Mode controls should be present in modal (radios or a combobox depending on implementation)
    const closeBtn = screen.getByRole("button", { name: /Close modal/i });
    const modalFrame = closeBtn.closest(".modalFrame") || document.body;
    const { within } = require("@testing-library/react");
    const lineRadio = within(modalFrame).queryByRole("radio", { name: /Line/i });
    if (lineRadio) {
      const stackedRadio = within(modalFrame).getByRole("radio", { name: /Stacked/i });
      expect(lineRadio).toBeInTheDocument();
      expect(stackedRadio).toBeInTheDocument();
    } else {
      const select = within(modalFrame).getByRole("combobox");
      expect(select).toBeInTheDocument();
    }

    // Close modal via Close button
    await userEvent.click(closeBtn);

    expect(screen.queryByText(/Expanded Investment Volume/i)).not.toBeInTheDocument();
  });
});
