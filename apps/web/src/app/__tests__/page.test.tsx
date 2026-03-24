import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import HomePage from '../page'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

const mockPush = jest.fn()
;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })

// Mock global fetch
global.fetch = jest.fn()

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the Dynamizer title', () => {
    render(<HomePage />)
    expect(screen.getByText('Dynamizer')).toBeInTheDocument()
  })

  it('renders the name input', () => {
    render(<HomePage />)
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument()
  })

  it('shows error when trying to create a room without a name', () => {
    render(<HomePage />)
    fireEvent.click(screen.getByRole('button', { name: /create room/i }))
    expect(screen.getByText('Enter your name')).toBeInTheDocument()
  })

  it('shows error when trying to join without a room code', () => {
    render(<HomePage />)
    const nameInput = screen.getByPlaceholderText('Your name')
    fireEvent.change(nameInput, { target: { value: 'Ana' } })
    fireEvent.click(screen.getByRole('button', { name: /join/i }))
    expect(screen.getByText('Enter the room code')).toBeInTheDocument()
  })
})
