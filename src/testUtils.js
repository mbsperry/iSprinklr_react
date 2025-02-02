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
