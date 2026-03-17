import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import HomePage from '../page'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

const mockPush = jest.fn()
;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })

// Mock fetch global
global.fetch = jest.fn()

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renderiza el título Dynamizer', () => {
    render(<HomePage />)
    expect(screen.getByText('Dynamizer')).toBeInTheDocument()
  })

  it('renderiza el input de nombre', () => {
    render(<HomePage />)
    expect(screen.getByPlaceholderText('Tu nombre')).toBeInTheDocument()
  })

  it('muestra error si se intenta crear sala sin nombre', () => {
    render(<HomePage />)
    fireEvent.click(screen.getByText('Crear sala'))
    expect(screen.getByText('Introduce tu nombre')).toBeInTheDocument()
  })

  it('muestra error si se intenta unir sin código de sala', () => {
    render(<HomePage />)
    const nombreInput = screen.getByPlaceholderText('Tu nombre')
    fireEvent.change(nombreInput, { target: { value: 'Ana' } })
    fireEvent.click(screen.getByText('Unirse'))
    expect(screen.getByText('Introduce el código de sala')).toBeInTheDocument()
  })
})
