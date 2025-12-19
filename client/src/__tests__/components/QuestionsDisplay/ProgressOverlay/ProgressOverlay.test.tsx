import React from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProgressOverlay from 'src/components/QuestionsDisplay/ProgressOverlay/ProgressOverlay';

// Test constants
const TEST_PERCENTAGES = {
  ZERO: 0,
  QUARTER: 25,
  THIRD: 33.33,
  HALF: 50,
  THREE_QUARTERS: 75,
  FULL: 100,
  SIXTY: 60
} as const;

const COLOR_CLASSES = {
  CORRECT: 'progress-overlay-correct',
  INCORRECT: 'progress-overlay-incorrect'
} as const;

describe('ProgressOverlay Component', () => {
  afterEach(() => {
    cleanup();
  });

  test('should render when show is true', () => {
    const { container } = render(<ProgressOverlay percentage={TEST_PERCENTAGES.HALF} show={true} />);
    
    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('MuiBox-root');
  });

  test('should render with different percentages', () => {
    const percentages = [TEST_PERCENTAGES.THREE_QUARTERS, TEST_PERCENTAGES.QUARTER, TEST_PERCENTAGES.ZERO, TEST_PERCENTAGES.FULL];

    percentages.forEach(percentage => {
      const { container } = render(<ProgressOverlay percentage={percentage} show={true} />);
      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toBeInTheDocument();
      cleanup();
    });
  });

  test('should render with different colors', () => {
    const { container: container1 } = render(
      <ProgressOverlay percentage={TEST_PERCENTAGES.HALF} show={true} colorClass={COLOR_CLASSES.CORRECT} />
    );
    const overlay1 = container1.firstChild as HTMLElement;
    expect(overlay1).toBeInTheDocument();
    expect(overlay1).toHaveClass(COLOR_CLASSES.CORRECT);
    cleanup();

    const { container: container2 } = render(
      <ProgressOverlay percentage={TEST_PERCENTAGES.HALF} show={true} colorClass={COLOR_CLASSES.INCORRECT} />
    );
    const overlay2 = container2.firstChild as HTMLElement;
    expect(overlay2).toBeInTheDocument();
    expect(overlay2).toHaveClass(COLOR_CLASSES.INCORRECT);
  });

  test('should not render when show is false', () => {
    const { container } = render(<ProgressOverlay percentage={TEST_PERCENTAGES.HALF} show={false} />);
    
    expect(container.firstChild).toBeNull();
  });

  test('should render as MUI Box component', () => {
    const { container } = render(<ProgressOverlay percentage={TEST_PERCENTAGES.SIXTY} show={true} />);
    
    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('MuiBox-root');
  });

  test('should handle prop changes correctly', () => {
    const TestWrapper = ({ 
      percentage = TEST_PERCENTAGES.HALF, 
      show = true, 
      colorClass 
    }: { 
      percentage?: number; 
      show?: boolean; 
      colorClass?: string; 
    }) => (
      <div data-testid="wrapper">
        <ProgressOverlay percentage={percentage} show={show} colorClass={colorClass} />
      </div>
    );

    const { rerender, getByTestId } = render(<TestWrapper percentage={TEST_PERCENTAGES.HALF} />);
    let wrapper = getByTestId('wrapper');
    let overlay = wrapper.firstChild as HTMLElement;
    expect(overlay).toHaveClass('MuiBox-root');

    // Test show=false
    rerender(<TestWrapper percentage={TEST_PERCENTAGES.HALF} show={false} />);
    wrapper = getByTestId('wrapper');
    expect(wrapper.firstChild).toBeNull();

    // Test show=true again
    rerender(<TestWrapper percentage={TEST_PERCENTAGES.THREE_QUARTERS} show={true} />);
    wrapper = getByTestId('wrapper');
    overlay = wrapper.firstChild as HTMLElement;
    expect(overlay).toHaveClass('MuiBox-root');

    // Test with colorClass
    rerender(<TestWrapper percentage={TEST_PERCENTAGES.THREE_QUARTERS} show={true} colorClass={COLOR_CLASSES.CORRECT} />);
    wrapper = getByTestId('wrapper');
    overlay = wrapper.firstChild as HTMLElement;
    expect(overlay).toHaveClass('MuiBox-root');
    expect(overlay).toHaveClass(COLOR_CLASSES.CORRECT);
  });

  test('should work with edge case values', () => {
    const edgeCases = [TEST_PERCENTAGES.ZERO, TEST_PERCENTAGES.FULL, TEST_PERCENTAGES.THIRD];

    edgeCases.forEach(percentage => {
      const { container } = render(<ProgressOverlay percentage={percentage} show={true} />);
      expect(container.firstChild).toBeInTheDocument();
      cleanup();
    });
  });
});
