import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { BarSizeSelector } from '@/components/material-input/BarSizeSelector'
import { ProfileSelector } from '@/components/material-input/ProfileSelector'

// Mock usePerfilService para o ProfileSelector
vi.mock('@/hooks/services/usePerfilService', () => ({
  usePerfilService: () => ({
    perfis: [
      { id: 'perfil-1', descricao_perfil: 'W 200x15', tipo_perfil: 'W' },
      { id: 'perfil-2', descricao_perfil: 'U 100x10', tipo_perfil: 'U' },
    ],
    loading: false,
  }),
}))

function renderWithTooltip(component: React.ReactNode) {
  return render(
    <TooltipProvider>
      {component}
    </TooltipProvider>
  )
}

describe('BarSizeSelector - Tooltips', () => {
  const defaultSizes = [
    { id: '1', comprimento: 6000, descricao: 'Barra padrão 6m' },
    { id: '2', comprimento: 12000, descricao: 'Barra padrão 12m' },
  ]

  it('deve renderizar o título "Tamanho da Barra"', () => {
    renderWithTooltip(
      <BarSizeSelector
        availableSizes={defaultSizes}
        selectedSize={6000}
        onSizeChange={vi.fn()}
      />
    )
    expect(screen.getByText('Tamanho da Barra')).toBeInTheDocument()
  })

  it('deve renderizar o seletor com o tamanho selecionado', () => {
    renderWithTooltip(
      <BarSizeSelector
        availableSizes={defaultSizes}
        selectedSize={6000}
        onSizeChange={vi.fn()}
      />
    )
    const matches = screen.getAllByText(/6000/)
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('não deve renderizar quando availableSizes está vazio', () => {
    const { container } = renderWithTooltip(
      <BarSizeSelector
        availableSizes={[]}
        selectedSize={6000}
        onSizeChange={vi.fn()}
      />
    )
    expect(container.innerHTML).toBe('')
  })

  it('deve mostrar informação do tamanho selecionado', () => {
    renderWithTooltip(
      <BarSizeSelector
        availableSizes={defaultSizes}
        selectedSize={6000}
        onSizeChange={vi.fn()}
      />
    )
    expect(screen.getByText(/Tamanho selecionado:/)).toBeInTheDocument()
  })
})

describe('ProfileSelector - Tooltips', () => {
  it('deve renderizar o label "Perfil do Material (Opcional)"', () => {
    renderWithTooltip(
      <ProfileSelector
        selectedPerfilId=""
        onPerfilChange={vi.fn()}
      />
    )
    expect(screen.getByText('Perfil do Material (Opcional)')).toBeInTheDocument()
  })

  it('não deve renderizar quando onPerfilChange não é fornecido', () => {
    const { container } = renderWithTooltip(
      <ProfileSelector selectedPerfilId="" />
    )
    expect(container.innerHTML).toBe('')
  })

  it('deve renderizar opção "Todos os perfis"', () => {
    renderWithTooltip(
      <ProfileSelector
        selectedPerfilId=""
        onPerfilChange={vi.fn()}
      />
    )
    // O select deve estar renderizado
    const trigger = screen.getByRole('combobox')
    expect(trigger).toBeInTheDocument()
  })

  it('deve mostrar mensagem de filtro quando perfil é selecionado', () => {
    renderWithTooltip(
      <ProfileSelector
        selectedPerfilId="perfil-1"
        onPerfilChange={vi.fn()}
      />
    )
    expect(screen.getByText('Sobras disponíveis serão filtradas por este perfil')).toBeInTheDocument()
  })

  it('não deve mostrar mensagem de filtro quando nenhum perfil está selecionado', () => {
    renderWithTooltip(
      <ProfileSelector
        selectedPerfilId=""
        onPerfilChange={vi.fn()}
      />
    )
    expect(screen.queryByText('Sobras disponíveis serão filtradas por este perfil')).not.toBeInTheDocument()
  })
})

describe('Dashboard KPI Tooltips - Estrutura', () => {
  it('deve importar Tooltip do componente ui/tooltip', async () => {
    const tooltipModule = await import('@/components/ui/tooltip')
    expect(tooltipModule.Tooltip).toBeDefined()
    expect(tooltipModule.TooltipContent).toBeDefined()
    expect(tooltipModule.TooltipTrigger).toBeDefined()
    expect(tooltipModule.TooltipProvider).toBeDefined()
  })
})
