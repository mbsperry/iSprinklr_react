import { screen } from '@testing-library/react';
import { renderWithWrapper } from './testUtils';
import App from './App';

describe('App Component', () => {
  test('renders app header', () => {
    renderWithWrapper(<App />);
    const headerElement = screen.getByText(/iSprinklr/i);
    expect(headerElement).toBeInTheDocument();
  });

  test('renders navigation elements', () => {
    renderWithWrapper(<App />);
    expect(screen.getByText(/Controller/i)).toBeInTheDocument();
    expect(screen.getByText(/Scheduler/i)).toBeInTheDocument();
    expect(screen.getByText(/Logs/i)).toBeInTheDocument();
  });
});
