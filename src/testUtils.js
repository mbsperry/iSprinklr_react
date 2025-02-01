import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a test QueryClient
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Test wrapper component
export const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  </BrowserRouter>
);

// Custom render function that includes the TestWrapper
export const renderWithWrapper = (ui, options) =>
  render(ui, { wrapper: TestWrapper, ...options });

// Common test data
export const mockSprinklerList = [
  { name: "Front Yard", zone: 1 },
  { name: "Back Yard", zone: 2 }
];

export const mockSystemStatus = {
  systemStatus: "inactive",
  message: "System is idle",
  active_zone: null,
  duration: 0
};

// Common test utilities
export const createMockApiResponse = (data) => ({
  ok: true,
  json: () => Promise.resolve(data)
});
