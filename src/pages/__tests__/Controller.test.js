import { screen, fireEvent } from '@testing-library/react';
import { renderWithWrapper, mockSprinklerList, mockSystemStatus, createMockApiResponse } from '../../testUtils';
import { fetchTimeout } from '../../fetchTimeout';
import Controller from '../Controller';

describe('Controller Component', () => {
  beforeEach(() => {
    // Default mock implementations
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
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSprinklerList)
        });
      });

      renderWithWrapper(<Controller />);
      expect(await screen.findByText('Error: Failed to connect to hardware')).toBeInTheDocument();
    });

    test('handles sprinkler data loading failure', async () => {
      fetchTimeout.mockImplementation((url) => {
        if (url.includes('/api/sprinklers/')) {
          return Promise.reject(new Error('Failed to load sprinkler configuration'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSystemStatus)
        });
      });

      renderWithWrapper(<Controller />);
      expect(await screen.findByText('Error: Failed to load sprinkler configuration')).toBeInTheDocument();
    });

    test('handles invalid zone parameter when starting sprinkler', async () => {
      fetchTimeout.mockImplementation((url) => {
        if (url.includes('/api/sprinklers/start')) {
          return Promise.resolve({
            ok: false,
            statusText: 'Invalid zone number'
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => url.includes('/api/sprinklers/') ? mockSprinklerList : mockSystemStatus
        });
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
      
      expect(await screen.findByText('Error: Invalid zone number')).toBeInTheDocument();
    });

    test('handles system already active error', async () => {
      fetchTimeout.mockImplementation((url) => {
        if (url.includes('/api/sprinklers/start')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              systemStatus: "active",
              message: "System already active on zone 2",
              zone: 2,
              duration: 45
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => url.includes('/api/sprinklers/') ? mockSprinklerList : mockSystemStatus
        });
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
      
      expect(await screen.findByText(/Error, system already active on zone 2/)).toBeInTheDocument();
    });

    test('handles stop system failure', async () => {
      // Start with active system
      fetchTimeout.mockImplementation((url) => {
        if (url.includes('/api/system/status')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              systemStatus: "active",
              message: "System active",
              zone: 1,
              duration: 30
            })
          });
        }
        if (url.includes('/api/sprinklers/stop')) {
          return Promise.reject(new Error('Hardware communication error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSprinklerList)
        });
      });

      renderWithWrapper(<Controller />);
      await screen.findByText(/Active Zone:/);
      
      // Try to stop
      const stopButton = screen.getByRole('button', { name: 'Stop' });
      fireEvent.click(stopButton);
      
      expect(await screen.findByText('Error: Hardware communication error')).toBeInTheDocument();
    });
  });

  describe('Normal Operation', () => {
    test('handles sprinkler activation flow', async () => {
      fetchTimeout.mockImplementation((url, options) => {
        if (url.includes('/api/sprinklers/start')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              systemStatus: "active",
              message: "System active",
              zone: 1,
              duration: 30
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => url.includes('/api/sprinklers/') ? mockSprinklerList : mockSystemStatus
        });
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
      await screen.findByText(/Active Zone:/);
      expect(screen.getByText(/Front Yard/)).toBeInTheDocument();
    });

    test('handles sprinkler deactivation', async () => {
      // Start with active system
      fetchTimeout.mockImplementation((url) => {
        if (url.includes('/api/system/status')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              systemStatus: "active",
              message: "System active",
              zone: 1,
              duration: 30
            })
          });
        }
        if (url.includes('/api/sprinklers/stop')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              systemStatus: "inactive",
              message: "System is idle"
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSprinklerList)
        });
      });

      renderWithWrapper(<Controller />);
      await screen.findByText(/Active Zone:/);
      
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
      await screen.findByText('System is Idle');
    });

    test('handles automatic system stop when countdown expires', async () => {
      // Mock active system with expired countdown
      jest.mock('../useCountdown', () => ({
        useCountdown: jest.fn(() => [0, 0])
      }));

      render(<Controller />);
      await screen.findByText('System is Idle');
      
      expect(fetchTimeout).toHaveBeenCalledWith(
        'http://test-server:8080/api/sprinklers/stop',
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
  });
});
