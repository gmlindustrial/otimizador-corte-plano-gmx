import { describe, it, expect, vi } from 'vitest'
import { ProjetoService } from '../../src/services/entities/ProjetoService'

describe('ProjetoService', () => {
  it('should be instantiable', () => {
    const service = new ProjetoService()
    expect(service).toBeDefined()
  })

  it('should have CRUD methods from BaseService', () => {
    const service = new ProjetoService()
    expect(typeof service.getAll).toBe('function')
    expect(typeof service.getById).toBe('function')
    expect(typeof service.create).toBe('function')
    expect(typeof service.update).toBe('function')
    expect(typeof service.delete).toBe('function')
  })

  it('should have audit-specific methods', () => {
    const service = new ProjetoService()
    expect(typeof service.createWithAudit).toBe('function')
  })
})
