import React from 'react';
import { render, screen } from '@testing-library/react';
import ExpandedChartLayout from '../common/ExpandedChartLayout';

describe('ExpandedChartLayout', () => {
  test('renders controls and children in layout', () => {
    render(
      <ExpandedChartLayout
        legendItems={["A", "B"]}
        legendTitle="Legend"
        colorOf={() => '#000'}
        height={200}
        controls={<div data-testid="controls">Controls</div>}
      >
        <div data-testid="child">ChartContent</div>
      </ExpandedChartLayout>
    );

    expect(screen.getByTestId('controls')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
    // legend title should be visible via legend component
    expect(screen.getByText(/Legend/i)).toBeInTheDocument();
  });
});
