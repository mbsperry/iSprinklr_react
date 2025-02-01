import { screen, fireEvent } from '@testing-library/react';
import { renderWithWrapper, mockSprinklerList } from '../../testUtils';
import { SprinklrSelect } from '../Controller';

describe('SprinklrSelect Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  test('renders dropdown with correct options', () => {
    renderWithWrapper(<SprinklrSelect sprinklerList={mockSprinklerList} onChange={mockOnChange} />);
    
    // Check if label is present
    expect(screen.getByText('Select Sprinklr')).toBeInTheDocument();
    
    // Check if "None" option is present
    expect(screen.getByRole('option', { name: 'None' })).toBeInTheDocument();
    
    // Check if all sprinkler options are present
    mockSprinklerList.forEach(sprinkler => {
      expect(screen.getByRole('option', { name: sprinkler.name })).toBeInTheDocument();
    });
  });

  test('calls onChange when selection changes', () => {
    renderWithWrapper(<SprinklrSelect sprinklerList={mockSprinklerList} onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2' } });
    
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(expect.any(Object));
  });

  test('renders with empty sprinkler list', () => {
    renderWithWrapper(<SprinklrSelect sprinklerList={[]} onChange={mockOnChange} />);
    
    // Should only have the "None" option
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('None');
  });
});
