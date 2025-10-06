import React from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProgressOverlay from 'src/components/QuestionsDisplay/ProgressOverlay/ProgressOverlay';

describe('ProgressOverlay Component', () => {
  afterEach(() => {
    cleanup();
  });

  test('should render when show is true', () => {
    const { container } = render(<ProgressOverlay percentage={50} show={true} />);
    
    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('MuiBox-root');
  });

  test('should render with different percentages', () => {
    const { container: container1 } = render(<ProgressOverlay percentage={75} show={true} />);
    const overlay1 = container1.firstChild as HTMLElement;
    expect(overlay1).toBeInTheDocument();
    cleanup();

    const { container: container2 } = render(<ProgressOverlay percentage={25} show={true} />);
    const overlay2 = container2.firstChild as HTMLElement;
    expect(overlay2).toBeInTheDocument();
    cleanup();

    const { container: container3 } = render(<ProgressOverlay percentage={0} show={true} />);
    const overlay3 = container3.firstChild as HTMLElement;
    expect(overlay3).toBeInTheDocument();
    cleanup();

    const { container: container4 } = render(<ProgressOverlay percentage={100} show={true} />);
    const overlay4 = container4.firstChild as HTMLElement;
    expect(overlay4).toBeInTheDocument();
  });

  test('should render with different colors', () => {
    const { container: container1 } = render(
      <ProgressOverlay percentage={50} show={true} color="rgba(40, 167, 69, 0.8)" />
    );
    const overlay1 = container1.firstChild as HTMLElement;
    expect(overlay1).toBeInTheDocument();
    cleanup();

    const { container: container2 } = render(
      <ProgressOverlay percentage={50} show={true} color="rgba(220, 53, 69, 0.8)" />
    );
    const overlay2 = container2.firstChild as HTMLElement;
    expect(overlay2).toBeInTheDocument();
  });

  test('should not render when show is false', () => {
    const { container } = render(<ProgressOverlay percentage={50} show={false} />);
    
    expect(container.firstChild).toBeNull();
  });

  test('should render as MUI Box component', () => {
    const { container } = render(<ProgressOverlay percentage={60} show={true} />);
    
    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('MuiBox-root');
  });

  test('should handle prop changes correctly', () => {
    const TestWrapper = ({ 
      percentage = 50, 
      show = true, 
      color 
    }: { 
      percentage?: number; 
      show?: boolean; 
      color?: string; 
    }) => (
      <div data-testid="wrapper">
        <ProgressOverlay percentage={percentage} show={show} color={color} />
      </div>
    );

    const { rerender, getByTestId } = render(<TestWrapper percentage={50} />);
    let wrapper = getByTestId('wrapper');
    let overlay = wrapper.firstChild as HTMLElement;
    expect(overlay).toHaveClass('MuiBox-root');

    // Test show=false
    rerender(<TestWrapper percentage={50} show={false} />);
    wrapper = getByTestId('wrapper');
    expect(wrapper.firstChild).toBeNull();

    // Test show=true again
    rerender(<TestWrapper percentage={75} show={true} />);
    wrapper = getByTestId('wrapper');
    overlay = wrapper.firstChild as HTMLElement;
    expect(overlay).toHaveClass('MuiBox-root');

    // Test with color
    rerender(<TestWrapper percentage={75} show={true} color="rgba(40, 167, 69, 0.8)" />);
    wrapper = getByTestId('wrapper');
    overlay = wrapper.firstChild as HTMLElement;
    expect(overlay).toHaveClass('MuiBox-root');
  });

  test('should work with edge case values', () => {
    // Test with 0%
    const { container: container1 } = render(<ProgressOverlay percentage={0} show={true} />);
    expect(container1.firstChild).toBeInTheDocument();
    cleanup();

    // Test with 100%
    const { container: container2 } = render(<ProgressOverlay percentage={100} show={true} />);
    expect(container2.firstChild).toBeInTheDocument();
    cleanup();

    // Test with decimal percentage
    const { container: container3 } = render(<ProgressOverlay percentage={33.33} show={true} />);
    expect(container3.firstChild).toBeInTheDocument();
  });
});