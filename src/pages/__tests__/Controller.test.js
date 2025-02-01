import { screen, fireEvent } from '@testing-library/react';
import { renderWithWrapper, mockSprinklerList, mockSystemStatus, createMockApiResponse } from '../../testUtils';
import { fetchTimeout } from '../../fetchTimeout';
import { useCountdown } from '../../useCountdown';
import Controller from '../Controller';

// Mock modules
jest.mock('../../fetchTimeout');
jest.mock('../../useCountdown');

describe('Controller Component', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Default mock implementations
    useCountdown.mockImplementation(() => [0, 0]);
    fetchTimeout.mockImplementation((url) => {
      if (url.includes('/api/system/status')) {
        return Promise.resolve(createMockApiResponse(mockSystemStatus));
      }
      if (url.includes('/api/sprinklers/')) {
        return Promise.resolve(createMockApiResponse(mockSprinklerList));
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  test('renders loading state initially', () => {
    renderWithWrapper(<Controller />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('loads and displays sprinkler data', async () => {
    renderWithWrapper(<Controller />);
    
    // Wait for loading to complete
    expect(await screen.findByText('React based Sprinklr control')).toBeInTheDocument();
    
    // Check if sprinkler options are loaded
    expect(screen.getByRole('option', { name: 'Front Yard' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Back Yard' })).toBeInTheDocument();
  });

  describe('API Error Handling', () => {
    test('handles system status retrieval failure', async () => {
      fetchTimeout.mockImplementation((url) => {
        if (url.includes('/api/system/status')) {
          return Promise.reject(new Error('Failed to connect to hardware'));
        }
        return Promise.resolve(createMockApiResponse(mockSprinklerList));
      });

      renderWithWrapper(<Controller />);
      const errorElement = await screen.findByText('Error: Failed to connect to hardware', {
        exact: false,
        trim: true
      });
      expect(errorElement).toBeInTheDocument();
    });

    test('handles sprinkler data loading failure', async () => {
      fetchTimeout.mockImplementation((url) => {
        if (url.includes('/api/sprinklers/')) {
          return Promise.reject(new Error('Failed to load sprinkler configuration'));
        }
        return Promise.resolve(createMockApiResponse(mockSystemStatus));
      });

      renderWithWrapper(<Controller />);
      
      // Wait for error state
      const errorMessage = await screen.findByText(/Error: Failed to load sprinkler configuration/, {
        exact: false
      });
      expect(errorMessage).toBeInTheDocument();
      
      // Verify error state is shown in a danger card
      const dangerCard = screen.getByTestId('status-card');
      expect(dangerCard).toHaveClass('bg-danger');
    });

    test('handles invalid zone parameter when starting sprinkler', async () => {
      const errorResponse = {
        systemStatus: "error",
        message: "Invalid zone number"
      };

      fetchTimeout.mockImplementation((url) => {
        if (url.includes('/api/sprinklers/start')) {
          return Promise.resolve(createMockApiResponse(errorResponse));
        }
        return Promise.resolve(createMockApiResponse(
          url.includes('/api/sprinklers/') ? mockSprinklerList : mockSystemStatus
        ));
      });

      renderWithWrapper(<Controller />);
      await screen.findByText('React based Sprinklr control');
      
      // Select a sprinkler
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '1' } });
      
      // Try to activate
      const durationInput = screen.getByPlaceholderText('Duration in whole minutes');
      const activateButton = screen.getByRole('button', { name: 'Activate!' });
      
      fireEvent.change(durationInput, { target: { value: '30' } });
      fireEvent.click(activateButton);
      
      const errorElement = await screen.findByText('Error: Invalid zone number', {
        exact: false,
        trim: true
      });
      expect(errorElement).toBeInTheDocument();
    });

    test('handles system already active error', async () => {
      const activeResponse = {
        systemStatus: "active",
        message: "System already active on zone 2",
        zone: 2,
        duration: 45
      };

      let isStarted = false;
      fetchTimeout.mockImplementation((url) => {
        if (url.includes('/api/sprinklers/start')) {
          isStarted = true;
          return Promise.resolve(createMockApiResponse(activeResponse));
        }
        if (url.includes('/api/system/status')) {
          return Promise.resolve(createMockApiResponse(
            isStarted ? activeResponse : mockSystemStatus
          ));
        }
        return Promise.resolve(createMockApiResponse(mockSprinklerList));
      });

      renderWithWrapper(<Controller />);
      await screen.findByText('React based Sprinklr control');
      
      // Select zone 1
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '1' } });
      
      // Try to activate
      const durationInput = screen.getByPlaceholderText('Duration in whole minutes');
      const activateButton = screen.getByRole('button', { name: 'Activate!' });
      
      fireEvent.change(durationInput, { target: { value: '30' } });
      fireEvent.click(activateButton);
      
      // Wait for error state
      const errorMessage = await screen.findByText(/Error, system already active on zone 2/, {
        exact: false
      });
      expect(errorMessage).toBeInTheDocument();
      
      // Verify error state is shown in a danger card
      const dangerCard = screen.getByTestId('status-card');
      expect(dangerCard).toHaveClass('bg-danger');
    });

    test('handles stop system failure', async () => {
      const activeResponse = {
        systemStatus: "active",
        message: "System active",
        zone: 1,
        duration: 30,
        active_zone: 1
      };

      fetchTimeout.mockImplementation((url) => {
        if (url.includes('/api/system/status')) {
          return Promise.resolve(createMockApiResponse(activeResponse));
        }
        if (url.includes('/api/sprinklers/stop')) {
          return Promise.reject(new Error('Hardware communication error'));
        }
        return Promise.resolve(createMockApiResponse(mockSprinklerList));
      });

      renderWithWrapper(<Controller />);
      
      // Wait for active system UI
      await screen.findByText('Active Zone:', { exact: false });
      
      // Try to stop
      const stopButton = screen.getByRole('button', { name: 'Stop' });
      fireEvent.click(stopButton);
      
      const errorElement = await screen.findByText('Error: Hardware communication error', {
        exact: false,
        trim: true
      });
      expect(errorElement).toBeInTheDocument();
    });
  });

  describe('Normal Operation', () => {
    test('handles sprinkler activation flow', async () => {
      const activeResponse = {
        systemStatus: "active",
        message: "System active",
        zone: 1,
        duration: 30
      };

      fetchTimeout.mockImplementation((url, options) => {
        if (url.includes('/api/sprinklers/start')) {
          return Promise.resolve(createMockApiResponse(activeResponse));
        }
        return Promise.resolve(createMockApiResponse(
          url.includes('/api/sprinklers/') ? mockSprinklerList : mockSystemStatus
        ));
      });

      renderWithWrapper(<Controller />);
      await screen.findByText('React based Sprinklr control');
      
      // Select a sprinkler
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '1' } });
      
      // Enter duration and activate
      const durationInput = screen.getByPlaceholderText('Duration in whole minutes');
      const activateButton = screen.getByRole('button', { name: 'Activate!' });
      
      fireEvent.change(durationInput, { target: { value: '30' } });
      fireEvent.click(activateButton);
      
      // Verify API call
      expect(fetchTimeout).toHaveBeenCalledWith(
        'http://test-server:8080/api/sprinklers/start',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            zone: 1,
            duration: 1800 // 30 minutes in seconds
          })
        })
      );
      
      // Verify UI updates
      const activeZoneText = await screen.findByText('Active Zone:');
      expect(activeZoneText).toBeInTheDocument();
      
      const frontYardText = await screen.findByText(/Front Yard/, {
        selector: 'p'
      });
      expect(frontYardText).toBeInTheDocument();
    });

    test('handles sprinkler deactivation', async () => {
      const activeResponse = {
        systemStatus: "active",
        message: "System active",
        zone: 1,
        duration: 30,
        active_zone: 1
      };

      const inactiveResponse = {
        systemStatus: "inactive",
        message: "System is idle"
      };

      // First set active state
      fetchTimeout.mockImplementation((url) => {
        if (url.includes('/api/system/status')) {
          return Promise.resolve(createMockApiResponse(activeResponse));
        }
        if (url.includes('/api/sprinklers/stop')) {
          return Promise.resolve(createMockApiResponse(inactiveResponse));
        }
        return Promise.resolve(createMockApiResponse(mockSprinklerList));
      });

      renderWithWrapper(<Controller />);
      
      // Wait for active system UI
      await screen.findByText('Active Zone:', { exact: false });
      
      // Stop the system
      const stopButton = screen.getByRole('button', { name: 'Stop' });
      fireEvent.click(stopButton);
      
      // Verify API call
      expect(fetchTimeout).toHaveBeenCalledWith(
        'http://test-server:8080/api/sprinklers/stop',
        expect.objectContaining({
          method: 'POST'
        })
      );
      
      // Verify UI updates
      const idleText = await screen.findByText('System is Idle', {
        exact: false,
        trim: true
      });
      expect(idleText).toBeInTheDocument();
    });

    test('handles automatic system stop when countdown expires', async () => {
      const activeResponse = {
        systemStatus: "active",
        message: "System active",
        zone: 1,
        duration: 30,
        active_zone: 1
      };

      // First set active state
      fetchTimeout.mockImplementation((url) => {
        if (url.includes('/api/system/status')) {
          return Promise.resolve(createMockApiResponse(activeResponse));
        }
        return Promise.resolve(createMockApiResponse(mockSprinklerList));
      });

      renderWithWrapper(<Controller />);
      
      // Wait for active system UI
      await screen.findByText('Active Zone:', { exact: false });
      
      // Simulate countdown expiry
      useCountdown.mockReturnValue([0, 0]);
      
      // Verify system stops
      const idleText = await screen.findByText(/System is Idle/, {
        exact: false
      });
      expect(idleText).toBeInTheDocument();
      
      // Verify status card shows idle state
      const statusCard = screen.getByTestId('status-card');
      expect(statusCard).toHaveClass('bg-info');
    });
  });
});
