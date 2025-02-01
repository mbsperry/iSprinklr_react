import { screen, fireEvent } from '@testing-library/react';
import { renderWithWrapper, mockSprinklerList, mockSystemStatus } from '../../testUtils';
import { useCountdown } from '../../useCountdown';
import { StatusCard } from '../Controller';

describe('StatusCard Component', () => {
  const mockOnStatusChange = jest.fn();
  const defaultProps = {
    sprinklerList: mockSprinklerList,
    sprinklr: 1,
    countDownDate: new Date().getTime() + 300000, // 5 minutes from now
    onStatusChange: mockOnStatusChange
  };

  beforeEach(() => {
    mockOnStatusChange.mockClear();
  });

  test('displays loading state correctly', () => {
    renderWithWrapper(
      <StatusCard
        {...defaultProps}
        systemStatus={{ status: 'loading', message: 'Waiting for arduino...' }}
      />
    );
    
    expect(screen.getByText('Waiting for arduino...')).toBeInTheDocument();
    const card = screen.getByRole('article');
    expect(card).toHaveClass('bg-warning');
  });

  test('displays inactive state correctly', () => {
    renderWithWrapper(
      <StatusCard
        {...defaultProps}
        systemStatus={{ status: 'inactive', message: 'System is Idle' }}
      />
    );
    
    expect(screen.getByText('System is Idle')).toBeInTheDocument();
    const card = screen.getByRole('article');
    expect(card).toHaveClass('bg-info');
  });

  test('displays active state with countdown', () => {
    renderWithWrapper(
      <StatusCard
        {...defaultProps}
        systemStatus={{ status: 'active', message: 'System active' }}
      />
    );
    
    expect(screen.getByText(/Active Zone:/)).toBeInTheDocument();
    expect(screen.getByText(/Front Yard/)).toBeInTheDocument();
    expect(screen.getByText(/Remaining time: 05:30/)).toBeInTheDocument();
    const card = screen.getByRole('article');
    expect(card).toHaveClass('bg-success');
  });

  test('displays error state with reset button', () => {
    const errorMessage = 'Connection failed';
    renderWithWrapper(
      <StatusCard
        {...defaultProps}
        systemStatus={{ status: 'error', message: errorMessage }}
      />
    );
    
    expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    const resetButton = screen.getByRole('button', { name: 'Reset' });
    expect(resetButton).toBeInTheDocument();
    
    fireEvent.click(resetButton);
    expect(window.location.reload).toHaveBeenCalled();
  });

  test('calls onStatusChange when countdown expires', () => {
    const pastDate = new Date().getTime() - 1000; // 1 second ago
    renderWithWrapper(
      <StatusCard
        {...defaultProps}
        systemStatus={{ status: 'active', message: 'System active' }}
        countDownDate={pastDate}
      />
    );
    
    expect(mockOnStatusChange).toHaveBeenCalledWith(0, 'update');
  });
});
