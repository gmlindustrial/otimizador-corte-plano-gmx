import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeToggle } from '@/components/ThemeToggle'

const mockSetTheme = vi.fn()

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: mockSetTheme,
  }),
}))

function renderThemeToggle() {
  return render(
    <TooltipProvider>
      <ThemeToggle />
    </TooltipProvider>
  )
}

describe('ThemeToggle', () => {
  describe('Renderização', () => {
    it('deve renderizar o botão de alternância de tema', () => {
      renderThemeToggle()
      expect(screen.getByText('Alternar tema')).toBeInTheDocument()
    })

    it('deve renderizar como um botão clicável', () => {
      renderThemeToggle()
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('deve ter tamanho de ícone (h-8 w-8)', () => {
      renderThemeToggle()
      const button = screen.getByRole('button')
      expect(button.className).toContain('h-8')
      expect(button.className).toContain('w-8')
    })
  })

  describe('Alternância de tema', () => {
    it('deve chamar setTheme("dark") quando tema atual é light', () => {
      renderThemeToggle()
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(mockSetTheme).toHaveBeenCalledWith('dark')
    })
  })

  describe('Acessibilidade', () => {
    it('deve ter texto sr-only "Alternar tema"', () => {
      renderThemeToggle()
      const srText = screen.getByText('Alternar tema')
      expect(srText).toHaveClass('sr-only')
    })
  })
})

describe('ThemeToggle - Estrutura', () => {
  it('deve conter ícones Sun e Moon para alternância visual', () => {
    renderThemeToggle()
    const button = screen.getByRole('button')
    // Deve ter 2 SVGs (Sun e Moon)
    const svgs = button.querySelectorAll('svg')
    expect(svgs.length).toBe(2)
  })
})
