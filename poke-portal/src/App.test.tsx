import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Pokemon Query header', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /pokemon query/i })).toBeInTheDocument();
});
