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

    // Mode select should be present in modal
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();

    // Close modal via Close button
    const closeBtn = screen.getByRole("button", { name: /Close modal/i });
    await userEvent.click(closeBtn);

    expect(screen.queryByText(/Expanded Investment Volume/i)).not.toBeInTheDocument();
  });
});
