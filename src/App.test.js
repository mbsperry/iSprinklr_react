import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, setupFetchMock } from './testUtils';
import App from './App';

describe('App', () => {
  let cleanupFetch;

  beforeEach(() => {
    cleanupFetch = setupFetchMock();
  });

  afterEach(() => {
    cleanupFetch();
  });

  test('renders navigation with correct links', async () => {
    await renderWithProviders(<App />);
    
    expect(screen.getByText('iSprinklr')).toBeInTheDocument();
    expect(screen.getByText('Controller')).toBeInTheDocument();
    expect(screen.getByText('Scheduler')).toBeInTheDocument();
    expect(screen.getByText('Logs')).toBeInTheDocument();
  });

  test('renders Controller component at root path', async () => {
    await renderWithProviders(<App />, { route: '/' });
    
    // Controller component should be rendered at root with its title and description
    expect(screen.getByText('###iSprinklr###')).toBeInTheDocument();
    expect(screen.getByText('React based Sprinklr control')).toBeInTheDocument();
  });

  test('renders NoMatch component for invalid routes', async () => {
    await renderWithProviders(<App />, { route: '/invalid-route' });
    
    expect(screen.getByText('Nothing to see here!')).toBeInTheDocument();
    expect(screen.getByText('Go to the home page')).toBeInTheDocument();
  });
});
