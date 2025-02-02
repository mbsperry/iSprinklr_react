import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, setupFetchMock } from '../../testUtils';
import Controller from '../Controller';

describe('Controller', () => {
  let cleanupFetch;

  beforeEach(() => {
    cleanupFetch = setupFetchMock();
  });

  afterEach(() => {
    cleanupFetch();
  });

  test('renders initial state correctly', async () => {
    await renderWithProviders(<Controller />);
    
    // Check title and description
    expect(screen.getByText('###iSprinklr###')).toBeInTheDocument();
    expect(screen.getByText('React based Sprinklr control')).toBeInTheDocument();
    
    // Check sprinkler select is rendered with options
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Select Sprinklr')).toBeInTheDocument();
    expect(screen.getByText('None')).toBeInTheDocument();
    expect(screen.getByText('Zone 1')).toBeInTheDocument();
    expect(screen.getByText('Zone 2')).toBeInTheDocument();
    
    // Check initial system status
    expect(screen.getByText('System is Idle')).toBeInTheDocument();
  });

  test('shows duration input after selecting a sprinkler', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<Controller />);
    
    // Initially duration input should not be visible
    expect(screen.queryByPlaceholderText('Duration in whole minutes')).not.toBeInTheDocument();
    
    // Select Zone 1
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, '1');
    
    // Duration input and activate button should now be visible
    expect(screen.getByPlaceholderText('Duration in whole minutes')).toBeInTheDocument();
    expect(screen.getByText('Activate!')).toBeInTheDocument();
  });

  test('can start and stop a sprinkler', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<Controller />);
    
    // Select Zone 1
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, '1');
    
    // Enter duration (5 minutes)
    const durationInput = screen.getByPlaceholderText('Duration in whole minutes');
    await user.type(durationInput, '5');
    
    // Click activate button
    const activateButton = screen.getByText('Activate!');
    await user.click(activateButton);
    
    // Check active state
    await waitFor(() => {
      expect(screen.getByTestId('active-zone')).toHaveTextContent('Zone 1');
    }, { interval: 100, timeout: 3000 });
    
    // Click stop button
    const stopButton = screen.getByText('Stop');
    await user.click(stopButton);
    
    // Check system returned to idle
    await waitFor(() => {
      expect(screen.getByText('System is Idle')).toBeInTheDocument();
    });
  });

  describe('duration input validation', () => {
    test('requires duration to be entered', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<Controller />);
      
      // Select Zone 1
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '1');
      
      // Try to submit without entering duration
      const activateButton = screen.getByText('Activate!');
      await user.click(activateButton);
      
      // Should show validation message
      expect(screen.getByText('Please enter duration in whole minutes only. Max 60 min.')).toBeInTheDocument();
      
      // System should still be idle
      expect(screen.getByText('System is Idle')).toBeInTheDocument();
    });

    test('prevents negative duration values', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<Controller />);
      
      // Select Zone 1
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '1');
      
      // Try to enter negative value
      const durationInput = screen.getByPlaceholderText('Duration in whole minutes');
      await user.type(durationInput, '-5');
      
      // Try to submit
      const activateButton = screen.getByText('Activate!');
      await user.click(activateButton);
      
      // Should show validation message
      expect(screen.getByText('Please enter duration in whole minutes only. Max 60 min.')).toBeInTheDocument();
      
      // System should still be idle
      expect(screen.getByText('System is Idle')).toBeInTheDocument();
    });

    test('prevents duration greater than 60 minutes', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<Controller />);
      
      // Select Zone 1
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '1');
      
      // Try to enter value > 60
      const durationInput = screen.getByPlaceholderText('Duration in whole minutes');
      await user.type(durationInput, '61');
      
      // Try to submit
      const activateButton = screen.getByText('Activate!');
      await user.click(activateButton);
      
      // Should show validation message
      expect(screen.getByText('Please enter duration in whole minutes only. Max 60 min.')).toBeInTheDocument();
      
      // System should still be idle
      expect(screen.getByText('System is Idle')).toBeInTheDocument();
    });

    test('prevents decimal values', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<Controller />);
      
      // Select Zone 1
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '1');
      
      // Try to enter decimal value
      const durationInput = screen.getByPlaceholderText('Duration in whole minutes');
      await user.type(durationInput, '5.5');
      
      // Try to submit
      const activateButton = screen.getByText('Activate!');
      await user.click(activateButton);
      
      // Should show validation message
      expect(screen.getByText('Please enter duration in whole minutes only. Max 60 min.')).toBeInTheDocument();
      
      // System should still be idle
      expect(screen.getByText('System is Idle')).toBeInTheDocument();
    });
  });

  describe('countdown functionality', () => {
    let originalDate;
    let currentTime;

    beforeEach(() => {
      originalDate = global.Date;
      currentTime = new Date('2024-01-01T00:00:00Z').getTime();
      
      // Mock Date.now() to control time
      global.Date = class extends Date {
        constructor(date) {
          if (date) {
            return super(date);
          }
          return new Date(currentTime);
        }
        static now() {
          return currentTime;
        }
      };
    });

    afterEach(() => {
      global.Date = originalDate;
    });

    test('displays countdown timer when sprinkler is active', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<Controller />);
      
      // Select Zone 1 and set 5 minute duration
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '1');
      const durationInput = screen.getByPlaceholderText('Duration in whole minutes');
      await user.type(durationInput, '5');
      
      // Start sprinkler
      const activateButton = screen.getByText('Activate!');
      await user.click(activateButton);
      
      // Initial time should show 5 minutes
      await waitFor(() => {
        expect(screen.getByTestId('remaining-time')).toHaveTextContent('05:00');
      }, { interval: 100, timeout: 3000 });
      
      // Advance time by 2 minutes
      currentTime += 2 * 60 * 1000;
      
      // Should show 3 minutes remaining
      await waitFor(() => {
        expect(screen.getByTestId('remaining-time')).toHaveTextContent('03:00');
      }, { interval: 100, timeout: 3000 });
    });

    test('returns to idle when countdown reaches zero', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<Controller />);
      
      // Select Zone 1 and set 1 minute duration
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '1');
      const durationInput = screen.getByPlaceholderText('Duration in whole minutes');
      await user.type(durationInput, '1');
      
      // Start sprinkler
      const activateButton = screen.getByText('Activate!');
      await user.click(activateButton);
      
      // Initial time should show 1 minute
      await waitFor(() => {
        expect(screen.getByTestId('remaining-time')).toHaveTextContent('01:00');
      }, { interval: 100, timeout: 3000 });
      
      // Advance time past duration
      currentTime += 61 * 1000; // 1 minute and 1 second
      
      // System should return to idle
      await waitFor(() => {
        expect(screen.getByTestId('system-status')).toHaveTextContent('System is Idle');
      }, { interval: 100, timeout: 3000 });
    });
  });

  describe('error handling', () => {
    test('handles system status network error', async () => {
      // Override fetch mock for this test
      const mockFetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/api/system/status')) {
          return Promise.reject(new Error('Failed to fetch system status'));
        }
        // Let other requests go through normal mock
        return global.fetch(url);
      });
      global.fetch = mockFetch;
      
      await renderWithProviders(<Controller />);
      
      await waitFor(() => {
        expect(screen.getByTestId('system-status')).toHaveTextContent('Error: Failed to fetch system status');
      });
    });

    test('handles sprinkler data fetch error', async () => {
      // Override fetch mock for this test
      const mockFetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/api/sprinklers/') && !url.includes('/start') && !url.includes('/stop')) {
          return Promise.reject(new Error('Failed to load sprinkler data'));
        }
        // Let other requests go through normal mock
        return global.fetch(url);
      });
      global.fetch = mockFetch;
      
      await renderWithProviders(<Controller />);
      
      await waitFor(() => {
        expect(screen.getByTestId('system-status')).toHaveTextContent('Error: Failed to load sprinkler data');
      });
    });

    test('handles sprinkler start error', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<Controller />);
      
      // Override fetch mock after initial render
      const mockFetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/api/sprinklers/start')) {
          return Promise.reject(new Error('Failed to start sprinkler'));
        }
        // Let other requests go through normal mock
        return global.fetch(url);
      });
      global.fetch = mockFetch;
      
      // Select Zone 1 and set duration
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '1');
      const durationInput = screen.getByPlaceholderText('Duration in whole minutes');
      await user.type(durationInput, '5');
      
      // Try to start sprinkler
      const activateButton = screen.getByText('Activate!');
      await user.click(activateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('system-status')).toHaveTextContent('Error: Failed to start sprinkler');
      });
    });

    test('handles sprinkler stop error', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<Controller />);
      
      // Start sprinkler first
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '1');
      const durationInput = screen.getByPlaceholderText('Duration in whole minutes');
      await user.type(durationInput, '5');
      const activateButton = screen.getByText('Activate!');
      await user.click(activateButton);
      
      // Override fetch mock after sprinkler is started
      const mockFetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/api/sprinklers/stop')) {
          return Promise.reject(new Error('Failed to stop sprinkler'));
        }
        // Let other requests go through normal mock
        return global.fetch(url);
      });
      global.fetch = mockFetch;
      
      // Try to stop sprinkler
      const stopButton = screen.getByText('Stop');
      await user.click(stopButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('system-status')).toHaveTextContent('Error: Failed to stop sprinkler');
      });
    });
    test('handles system status error response', async () => {
      // Override fetch mock for this test
      const mockFetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/api/system/status')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              systemStatus: 'error',
              message: 'Hardware communication error'
            })
          });
        }
        // Let other requests go through normal mock
        return global.fetch(url);
      });
      global.fetch = mockFetch;
      
      await renderWithProviders(<Controller />);
      
      await waitFor(() => {
        expect(screen.getByTestId('system-status')).toHaveTextContent('Error: Hardware communication error');
      });
    });

    test('handles system already active error', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<Controller />);
      
      // Override fetch mock after initial render
      const mockFetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/api/sprinklers/start')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              systemStatus: 'error',
              message: 'Error, system already active on zone 2',
              zone: 2,
              duration: 300
            })
          });
        }
        // Let other requests go through normal mock
        return global.fetch(url);
      });
      global.fetch = mockFetch;
      
      // Select Zone 1 and set duration
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '1');
      const durationInput = screen.getByPlaceholderText('Duration in whole minutes');
      await user.type(durationInput, '5');
      
      // Try to start sprinkler
      const activateButton = screen.getByText('Activate!');
      await user.click(activateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('system-status')).toHaveTextContent('Error, system already active on zone 2');
      });
    });
  });
});
