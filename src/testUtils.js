import { render, waitForElementToBeRemoved } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock fetch for tests
export function setupFetchMock() {
  const originalFetch = global.fetch;
  let systemStatus = {
    systemStatus: 'inactive',
    message: 'System is idle',
    active_zone: null,
    duration: 0
  };
  
  global.fetch = jest.fn((url, options = {}) => {
    // GET system status
    if (url.includes('/api/system/status') && options.method !== 'POST') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(systemStatus)
      });
    }
    
    // GET sprinkler list
    if (url.includes('/api/sprinklers/') && !url.includes('/start') && !url.includes('/stop')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { name: 'Zone 1', zone: 1 },
          { name: 'Zone 2', zone: 2 }
        ])
      });
    }
    
    // POST start sprinkler
    if (url.includes('/api/sprinklers/start') && options.method === 'POST') {
      const body = JSON.parse(options.body);
      // Convert minutes to seconds for the API response
      const durationInSeconds = parseInt(body.duration);
      systemStatus = {
        systemStatus: 'active',
        message: 'System active',
        active_zone: parseInt(body.zone),
        duration: durationInSeconds
      };
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          message: 'Sprinkler started successfully',
          systemStatus: 'active',
          zone: parseInt(body.zone),
          duration: durationInSeconds
        })
      });
    }
    
    // POST stop sprinkler
    if (url.includes('/api/sprinklers/stop') && options.method === 'POST') {
      systemStatus = {
        systemStatus: 'inactive',
        message: 'System is idle',
        active_zone: null,
        duration: 0
      };
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'System stopped successfully' })
      });
    }
    
    return originalFetch(url);
  });

  return () => {
    global.fetch = originalFetch;
  };
}

export async function renderWithProviders(ui, { route = '/' } = {}) {
  window.history.pushState({}, 'Test page', route);

  const rendered = render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );

  // Wait for loading state to resolve
  try {
    await waitForElementToBeRemoved(() => rendered.getByText('Loading...'));
  } catch (error) {
    // If there's no loading state, that's fine
  }

  return {
    ...rendered,
    queryClient,
  };
}
