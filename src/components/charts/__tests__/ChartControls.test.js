import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ChartControls from "../common/ChartControls";

describe("ChartControls", () => {
  test("renders show total with no-wrap classes and mode dropdown when controlsGrid is true", () => {
    const onShowTotalChange = jest.fn();
    const onSingleModeChange = jest.fn();

    render(
      <ChartControls
        controlsGrid={true}
        isDualChart={false}
        showModeControls={true}
        singleMode="line"
        onSingleModeChange={onSingleModeChange}
        showTotalControl={true}
        showTotal={true}
        onShowTotalChange={onShowTotalChange}
      />
    );

    // mode select exists
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue("line");

    // Show total checkbox and label exist and have whitespace-nowrap
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeInTheDocument();
    const label = checkbox.closest("label");
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass("whitespace-nowrap");

    // clicking checkbox should call handler
    fireEvent.click(checkbox);
    expect(onShowTotalChange).toHaveBeenCalled();
  });
});
