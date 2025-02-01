// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock modules
jest.mock('./fetchTimeout');
jest.mock('./useCountdown');

// Mock config
jest.mock('./config', () => ({
  API_SERVER: 'test-server:8080'
}));

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Mock window.location.reload
Object.defineProperty(window, 'location', {
  writable: true,
  value: { reload: jest.fn() }
});
