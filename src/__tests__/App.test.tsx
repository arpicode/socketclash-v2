import { render, screen } from '@testing-library/react'
import App from '../App'

it('renders learn react link', () => {
  render(<App />)
  expect(screen.getByText(/Perma Chat/i)).toBeInTheDocument()
})
