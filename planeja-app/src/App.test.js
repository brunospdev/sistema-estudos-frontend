import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './pages/Login';

test('renderiza tela de login', () => {
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
  expect(screen.getByText(/bem-vindo/i)).toBeInTheDocument();
});
