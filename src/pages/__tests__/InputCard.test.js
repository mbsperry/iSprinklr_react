import { screen, fireEvent } from '@testing-library/react';
import { renderWithWrapper, mockSprinklerList, mockSystemStatus } from '../../testUtils';
import { InputCard } from '../Controller';

describe('InputCard Component', () => {
  const mockOnSprinklrChange = jest.fn();
  const mockOnStatusChange = jest.fn();

  const defaultProps = {
    sprinklerList: mockSprinklerList,
    systemStatus: mockSystemStatus,
    sprinklr: "0",
    onSprinklrChange: mockOnSprinklrChange,
    onStatusChange: mockOnStatusChange
  };

  beforeEach(() => {
    mockOnSprinklrChange.mockClear();
    mockOnStatusChange.mockClear();
  });

  test('renders SprinklrSelect with correct options', () => {
    renderWithWrapper(<InputCard {...defaultProps} />);
    
    // Check if SprinklrSelect is rendered with options
    expect(screen.getByText('Select Sprinklr')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'None' })).toBeInTheDocument();
    mockSprinklerList.forEach(sprinkler => {
      expect(screen.getByRole('option', { name: sprinkler.name })).toBeInTheDocument();
    });
  });

  test('DurationInput is hidden when no sprinkler is selected', () => {
    renderWithWrapper(<InputCard {...defaultProps} />);
    
    // Duration input should not be visible
    expect(screen.queryByPlaceholderText('Duration in whole minutes')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Activate|Stop/ })).not.toBeInTheDocument();
  });

  test('DurationInput becomes visible when sprinkler is selected', () => {
    renderWithWrapper(<InputCard {...defaultProps} sprinklr="1" />);
    
    // Duration input should be visible
    expect(screen.getByPlaceholderText('Duration in whole minutes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Activate!' })).toBeInTheDocument();
  });

  test('propagates sprinkler selection change', () => {
    renderWithWrapper(<InputCard {...defaultProps} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2' } });
    
    expect(mockOnSprinklrChange).toHaveBeenCalledTimes(1);
  });

  test('propagates duration input status change', () => {
    renderWithWrapper(<InputCard {...defaultProps} sprinklr="1" />);
    
    const durationInput = screen.getByPlaceholderText('Duration in whole minutes');
    const activateButton = screen.getByRole('button', { name: 'Activate!' });
    
    fireEvent.change(durationInput, { target: { value: '30' } });
    fireEvent.click(activateButton);
    
    expect(mockOnStatusChange).toHaveBeenCalledWith('30', 'start');
  });

  test('handles system status changes correctly', () => {
    const { rerender } = renderWithWrapper(
      <InputCard
        {...defaultProps}
        sprinklr="1"
        systemStatus={{ status: 'active' }}
      />
    );
    
    // When system is active, should show Stop button
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
    
    // Rerender with inactive status
    rerender(
      <InputCard
        {...defaultProps}
        sprinklr="1"
        systemStatus={{ status: 'inactive' }}
      />
    );
    
    // When system is inactive, should show Activate button
    expect(screen.getByRole('button', { name: 'Activate!' })).toBeInTheDocument();
  });
});
