import { screen, fireEvent } from '@testing-library/react';
import { renderWithWrapper, mockSystemStatus } from '../../testUtils';
import { DurationInput } from '../Controller';

describe('DurationInput Component', () => {
  const mockOnStatusChange = jest.fn();
  const defaultProps = {
    visible: true,
    systemStatus: mockSystemStatus,
    onStatusChange: mockOnStatusChange
  };

  beforeEach(() => {
    mockOnStatusChange.mockClear();
  });

  test('renders nothing when visible is false', () => {
    const { container } = renderWithWrapper(
      <DurationInput {...defaultProps} visible={false} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('renders form elements when visible', () => {
    renderWithWrapper(<DurationInput {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Duration in whole minutes')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('Activate!');
  });

  test('validates minimum duration input', () => {
    renderWithWrapper(<DurationInput {...defaultProps} />);
    
    const form = screen.getByRole('form');
    const input = screen.getByPlaceholderText('Duration in whole minutes');
    
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.submit(form);
    
    expect(screen.getByText('Please enter duration in whole minutes only. Max 60 min.')).toBeInTheDocument();
    expect(mockOnStatusChange).not.toHaveBeenCalled();
  });

  test('validates maximum duration input', () => {
    renderWithWrapper(<DurationInput {...defaultProps} />);
    
    const form = screen.getByRole('form');
    const input = screen.getByPlaceholderText('Duration in whole minutes');
    
    fireEvent.change(input, { target: { value: '61' } });
    fireEvent.submit(form);
    
    expect(screen.getByText('Please enter duration in whole minutes only. Max 60 min.')).toBeInTheDocument();
    expect(mockOnStatusChange).not.toHaveBeenCalled();
  });

  test('accepts valid duration and calls onStatusChange', () => {
    renderWithWrapper(<DurationInput {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Duration in whole minutes');
    const submitButton = screen.getByRole('button');
    
    fireEvent.change(input, { target: { value: '30' } });
    fireEvent.click(submitButton);
    
    expect(mockOnStatusChange).toHaveBeenCalledWith('30', 'start');
  });

  test('shows stop button when system is active', () => {
    renderWithWrapper(
      <DurationInput
        {...defaultProps}
        systemStatus={{ status: 'active' }}
      />
    );
    
    expect(screen.getByRole('button')).toHaveTextContent('Stop');
  });

  test('calls onStatusChange with stop action when stopping', () => {
    renderWithWrapper(
      <DurationInput
        {...defaultProps}
        systemStatus={{ status: 'active' }}
      />
    );
    
    const stopButton = screen.getByRole('button');
    fireEvent.click(stopButton);
    
    expect(mockOnStatusChange).toHaveBeenCalledWith(0, 'stop');
  });
});
