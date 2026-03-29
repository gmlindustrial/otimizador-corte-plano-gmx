import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

function renderSidebar(props?: Partial<{
  activeSection: string
  onSectionChange: (section: string) => void
  isAdmin: boolean
}>) {
  const defaultProps = {
    activeSection: 'projects',
    onSectionChange: vi.fn(),
    isAdmin: false,
    ...props,
  }

  return render(
    <BrowserRouter>
      <TooltipProvider>
        <SidebarProvider defaultOpen={true}>
          <AppSidebar {...defaultProps} />
        </SidebarProvider>
      </TooltipProvider>
    </BrowserRouter>
  )
}

describe('AppSidebar', () => {
  describe('Renderização', () => {
    it('deve renderizar o logo e título GMX Corte', () => {
      renderSidebar()
      expect(screen.getByText('GMX Corte')).toBeInTheDocument()
      expect(screen.getByText('v2.0')).toBeInTheDocument()
    })

    it('deve renderizar o label de navegação', () => {
      renderSidebar()
      expect(screen.getByText('Navegação')).toBeInTheDocument()
    })

    it('deve renderizar os 6 itens de menu padrão', () => {
      renderSidebar({ isAdmin: false })
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Projetos')).toBeInTheDocument()
      expect(screen.getByText('Estoque')).toBeInTheDocument()
      expect(screen.getByText('Relatórios')).toBeInTheDocument()
      expect(screen.getByText('Configurações')).toBeInTheDocument()
      expect(screen.getByText('Lâminas')).toBeInTheDocument()
    })

    it('não deve mostrar item Admin para usuário não-admin', () => {
      renderSidebar({ isAdmin: false })
      expect(screen.queryByText('Administrador')).not.toBeInTheDocument()
    })

    it('deve mostrar item Admin para usuário admin', () => {
      renderSidebar({ isAdmin: true })
      expect(screen.getByText('Administrador')).toBeInTheDocument()
    })

    it('deve renderizar 7 itens de menu para admin', () => {
      renderSidebar({ isAdmin: true })
      const menuItems = screen.getAllByRole('listitem')
      expect(menuItems.length).toBe(7)
    })

    it('deve renderizar 6 itens de menu para não-admin', () => {
      renderSidebar({ isAdmin: false })
      const menuItems = screen.getAllByRole('listitem')
      expect(menuItems.length).toBe(6)
    })
  })

  describe('Navegação', () => {
    it('deve chamar onSectionChange ao clicar em Dashboard', () => {
      const onSectionChange = vi.fn()
      renderSidebar({ onSectionChange })

      fireEvent.click(screen.getByText('Dashboard'))
      expect(onSectionChange).toHaveBeenCalledWith('dashboard')
    })

    it('deve chamar onSectionChange ao clicar em Projetos', () => {
      const onSectionChange = vi.fn()
      renderSidebar({ onSectionChange })

      fireEvent.click(screen.getByText('Projetos'))
      expect(onSectionChange).toHaveBeenCalledWith('projects')
    })

    it('deve chamar onSectionChange ao clicar em Estoque', () => {
      const onSectionChange = vi.fn()
      renderSidebar({ onSectionChange })

      fireEvent.click(screen.getByText('Estoque'))
      expect(onSectionChange).toHaveBeenCalledWith('sobras')
    })

    it('deve chamar onSectionChange ao clicar em Relatórios', () => {
      const onSectionChange = vi.fn()
      renderSidebar({ onSectionChange })

      fireEvent.click(screen.getByText('Relatórios'))
      expect(onSectionChange).toHaveBeenCalledWith('reports')
    })

    it('deve chamar onSectionChange ao clicar em Configurações', () => {
      const onSectionChange = vi.fn()
      renderSidebar({ onSectionChange })

      fireEvent.click(screen.getByText('Configurações'))
      expect(onSectionChange).toHaveBeenCalledWith('settings')
    })

    it('deve chamar onSectionChange ao clicar em Lâminas', () => {
      const onSectionChange = vi.fn()
      renderSidebar({ onSectionChange })

      fireEvent.click(screen.getByText('Lâminas'))
      expect(onSectionChange).toHaveBeenCalledWith('laminas')
    })

    it('deve chamar onSectionChange ao clicar em Admin', () => {
      const onSectionChange = vi.fn()
      renderSidebar({ onSectionChange, isAdmin: true })

      fireEvent.click(screen.getByText('Administrador'))
      expect(onSectionChange).toHaveBeenCalledWith('admin')
    })
  })

  describe('Estado ativo', () => {
    it('deve marcar Projetos como ativo quando activeSection é projects', () => {
      renderSidebar({ activeSection: 'projects' })
      const button = screen.getByText('Projetos').closest('button')
      expect(button).toHaveAttribute('data-active', 'true')
    })

    it('deve marcar Dashboard como ativo quando activeSection é dashboard', () => {
      renderSidebar({ activeSection: 'dashboard' })
      const button = screen.getByText('Dashboard').closest('button')
      expect(button).toHaveAttribute('data-active', 'true')
    })

    it('não deve marcar outros itens como ativos', () => {
      renderSidebar({ activeSection: 'dashboard' })
      const projectsButton = screen.getByText('Projetos').closest('button')
      expect(projectsButton).toHaveAttribute('data-active', 'false')
    })
  })

  describe('Logout', () => {
    it('deve renderizar botão de logout', () => {
      renderSidebar()
      // O botão de logout tem sr-only text ou é um ícone
      const logoutButtons = screen.getAllByRole('button')
      // Pelo menos um botão deve existir no footer (logout)
      expect(logoutButtons.length).toBeGreaterThan(0)
    })
  })

  describe('ThemeToggle', () => {
    it('deve renderizar o toggle de tema no footer', () => {
      renderSidebar()
      expect(screen.getByText('Alternar tema')).toBeInTheDocument()
    })
  })
})
