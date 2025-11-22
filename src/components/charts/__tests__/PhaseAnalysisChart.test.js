import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the D3ComposedChart to inspect props passed from the expanded chart
jest.mock('../common/D3ComposedChart', () => (props) => {
  // render a simple marker that includes showTotal and mode
  return (
    <div
      data-testid="mock-d3"
      data-showtotal={props.showTotal ? 'true' : 'false'}
      data-mode={props.mode}
    />
  );
});

import PhaseAnalysisChart from '../PhaseAnalysisChart';

const sampleDeals = [
  { Phase: 'Seed', Year: 2019, Amount: 1 },
  { Phase: 'Series A', Year: 2020, Amount: 2 },
  { Phase: 'Seed', Year: 2020, Amount: 3 },
];

describe('PhaseAnalysisChart expanded behavior', () => {
  test('expand button opens modal, show total toggles dashed line, dropdown changes mode, and close button closes modal', async () => {
    render(<PhaseAnalysisChart deals={sampleDeals} />);

    // Find Expand Volume Chart button (aria-label)
    const expandBtn = screen.getByRole('button', { name: /Expand Volume Chart/i });
    expect(expandBtn).toBeInTheDocument();

    // Open modal
    await userEvent.click(expandBtn);

    // Modal title should appear
    const modalTitle = await screen.findByText(/Expanded Investment Volume/i);
    expect(modalTitle).toBeInTheDocument();

    // Mocked D3 components exist both in the main view and inside the modal; find the one inside the modal
    const allMocks = await screen.findAllByTestId('mock-d3');
    const modalMock = allMocks.find((el) => el.getAttribute('data-showtotal') === 'true');
    expect(modalMock).toBeDefined();

    // The modal contains a checkbox for Show total. Scope the checkbox to the modal and toggle it off
    const modalCloseBtn = screen.getByRole('button', { name: /Close modal/i });
    const modalFrame = modalCloseBtn.closest('.modalFrame') || document.body;
    const { within } = require('@testing-library/react');
    const checkbox = within(modalFrame).getByRole('checkbox');
    expect(checkbox).toBeChecked();
    await userEvent.click(checkbox);

    // After toggling, find the modal mock again and assert showTotal=false
    const allMocksAfter = await screen.findAllByTestId('mock-d3');
    const modalMockAfter = allMocksAfter.find((el) => el.closest('.modalFrame')) || allMocksAfter.find((el) => el.getAttribute('data-showtotal') === 'false');
    expect(modalMockAfter).toBeDefined();
    expect(modalMockAfter).toHaveAttribute('data-showtotal', 'false');

    // The mode dropdown should exist in the modal (single mode control)
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    // Change to stacked/column mode
    await userEvent.selectOptions(select, 'column');
    expect(select).toHaveValue('column');

    // Mocked D3 should reflect mode change (find modal instance)
    const allMocksMode = await screen.findAllByTestId('mock-d3');
    const modalMockMode = allMocksMode.find((el) => el.closest('.modalFrame')) || allMocksMode[allMocksMode.length - 1];
    expect(modalMockMode).toHaveAttribute('data-mode', 'column');

    // Close modal by clicking close button with aria-label
    expect(modalCloseBtn).toBeInTheDocument();
    await userEvent.click(modalCloseBtn);

    // Modal should be closed
    expect(screen.queryByText(/Expanded Investment Volume/i)).not.toBeInTheDocument();
  });
});
