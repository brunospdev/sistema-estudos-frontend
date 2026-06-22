jest.mock('./services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
}));

jest.mock('./auth/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    setSession: jest.fn(),
    user: null,
    loading: false,
    isAuthenticated: false,
    logout: jest.fn(),
  }),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import Login from './pages/Login';

test('renderiza tela de login', () => {
  render(<Login />);
  expect(screen.getByText(/bem-vindo/i)).toBeInTheDocument();
});
