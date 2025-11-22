import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BaseExpandableChart from '../common/BaseExpandableChart';

describe('BaseExpandableChart', () => {
  test('expand opens modal and modal showTotal toggles propagated to expanded chart', async () => {
    const DummyChart = ({ data, onExpand }) => (
      <div>
        <button onClick={() => onExpand('volume')} aria-label="expand-test">Open</button>
      </div>
    );

    const ExpandedMock = ({ showTotal, controls }) => (
      <div>
        <div data-testid="expanded" data-showtotal={showTotal ? 'true' : 'false'} />
        {/* Render controls so tests can interact with the modal's checkbox */}
        {controls}
      </div>
    );

    render(
      <BaseExpandableChart
        title="Test"
        data={[1,2,3]}
        ChartComponent={({ data, onExpand }) => <DummyChart data={data} onExpand={onExpand} />}
        ExpandedChartComponent={ExpandedMock}
        supportsTotal={true}
      />
    );

    // open modal
    const openBtn = screen.getByRole('button', { name: /expand-test/i });
    await userEvent.click(openBtn);

    // modal expanded component should be present
    const expanded = await screen.findByTestId('expanded');
    expect(expanded).toBeInTheDocument();
    // default modalShowTotal is true in BaseExpandableChart
    expect(expanded).toHaveAttribute('data-showtotal', 'true');

    // find checkbox inside the modal and toggle off
    const closeBtn = screen.getByRole('button', { name: /Close modal/i });
    const modalFrame = closeBtn.closest('.modalFrame') || document.body;
    const { within } = require('@testing-library/react');
    const checkbox = within(modalFrame).getByRole('checkbox');
    expect(checkbox).toBeChecked();
    await userEvent.click(checkbox);

    // expanded component should update to reflect showTotal=false
    const expandedAfter = await screen.findByTestId('expanded');
    expect(expandedAfter).toHaveAttribute('data-showtotal', 'false');
  });
});
