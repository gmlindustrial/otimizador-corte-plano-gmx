import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProjectService } from '../../src/services/entities/ProjetoService'

describe('ProjectService', () => {
  let projectService: ProjectService

  beforeEach(() => {
    projectService = new ProjectService()
    vi.clearAllMocks()
  })

  it('should validate project data correctly', async () => {
    const validProject = {
      nome: 'Test Project',
      numero_projeto: 'P001',
      cliente_id: '123e4567-e89b-12d3-a456-426614174000',
      obra_id: '123e4567-e89b-12d3-a456-426614174001'
    }

    expect(() => projectService.validateProjectData(validProject)).not.toThrow()
  })

  it('should reject invalid project data', async () => {
    const invalidProject = {
      nome: '',
      numero_projeto: 'P001'
    }

    expect(() => projectService.validateProjectData(invalidProject)).toThrow()
  })

  it('should format project number correctly', () => {
    expect(projectService.formatProjectNumber('123')).toBe('P123')
    expect(projectService.formatProjectNumber('P123')).toBe('P123')
    expect(projectService.formatProjectNumber('')).toBe('P001')
  })
})