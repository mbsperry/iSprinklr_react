import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, setupFetchMock } from '../../testUtils';
import Scheduler from '../Scheduler';

describe('Scheduler', () => {
  let cleanupFetch;

  beforeEach(() => {
    cleanupFetch = setupFetchMock();
    // Extend fetch mock for scheduler-specific endpoints
    global.fetch = jest.fn((url, options = {}) => {
      // GET active schedule
      if (url.includes('/api/scheduler/active')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            schedule_name: "default",
            schedule_items: [
              { zone: 1, day: "M:W:F", duration: 15 },
              { zone: 2, day: "ALL", duration: 20 }
            ]
          })
        });
      }
      
      // GET schedule on/off status
      if (url.includes('/api/scheduler/on_off')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            schedule_on_off: true
          })
        });
      }
      
      // GET sprinkler configurations
      if (url.includes('/api/sprinklers/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { zone: 1, name: "Zone 1" },
            { zone: 2, name: "Zone 2" }
          ])
        });
      }
      
      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });
  });

  afterEach(() => {
    cleanupFetch();
  });

  test('shows loading state initially', async () => {
    // Override fetch to delay all responses
    global.fetch = jest.fn((url) => 
      new Promise(resolve => setTimeout(() => {
        if (url.includes('/api/scheduler/active')) {
          resolve({
            ok: true,
            json: () => Promise.resolve({
              schedule_name: "default",
              schedule_items: []
            })
          });
        } else if (url.includes('/api/scheduler/on_off')) {
          resolve({
            ok: true,
            json: () => Promise.resolve({
              schedule_on_off: true
            })
          });
        } else if (url.includes('/api/sprinklers/')) {
          resolve({
            ok: true,
            json: () => Promise.resolve([
              { zone: 1, name: "Zone 1" },
              { zone: 2, name: "Zone 2" }
            ])
          });
        }
      }, 100))
    );
    
    renderWithProviders(<Scheduler />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Wait for loading to finish to avoid affecting other tests
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  test('renders initial state correctly', async () => {
    const { container } = await renderWithProviders(<Scheduler />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Check title
    expect(screen.getByText('Sprinkler Schedule')).toBeInTheDocument();
    
    // Check schedule on/off switch
    const scheduleSwitch = screen.getByRole('checkbox', { name: /Schedule On/i });
    expect(scheduleSwitch).toBeInTheDocument();
    expect(scheduleSwitch).toBeChecked();
    
    // Check global duration buttons
    expect(screen.getByText('Decrease All 10%')).toBeInTheDocument();
    expect(screen.getByText('Increase All 10%')).toBeInTheDocument();
    
    // Check duration inputs and their labels exist
    const durationInputs = screen.getAllByRole('spinbutton');
    expect(durationInputs).toHaveLength(2);
    
    // Find zone labels using form label elements
    const zoneLabels = screen.getAllByRole('columnheader');
    expect(zoneLabels[0]).toHaveTextContent('Zone');
    expect(zoneLabels[1]).toHaveTextContent('Duration');
    expect(zoneLabels[2]).toHaveTextContent('Day');
    
    // Check duration values
    expect(durationInputs[0]).toHaveValue(15); // Zone 1 duration
    expect(durationInputs[1]).toHaveValue(20); // Zone 2 duration
  });

  test('handles schedule fetch error', async () => {
    // Mock all endpoints but make schedule fetch fail
    global.fetch = jest.fn((url) => {
      if (url.includes('/api/scheduler/active')) {
        return Promise.reject(new Error('Failed to load schedule'));
      }
      if (url.includes('/api/scheduler/on_off')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ schedule_on_off: true })
        });
      }
      if (url.includes('/api/sprinklers/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });
    
    renderWithProviders(<Scheduler />);
    
    // Wait for loading to finish and error to appear
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // The error should be displayed
    const errorDiv = screen.getByText((content, element) => {
      return element.textContent === 'Failed to load schedule';
    });
    expect(errorDiv).toBeInTheDocument();
  });
});
