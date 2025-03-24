import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders navigation', () => {
  render(<App />);
  const navElement = screen.getByText(/Vibe AntSim/i);
  expect(navElement).toBeInTheDocument();
});