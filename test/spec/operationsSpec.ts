import { resolveSpec } from '../../src/spec/spec'
import { getOperations } from '../../src/spec/operations'
import expect from 'expect'

describe('operations', () => {
  it('should parse operations from spec', async () => {
    const path = `${__dirname}/../petstore.yml`
    const spec = await resolveSpec(path)
    const operations = getOperations(spec)
    expect(operations).toExist()
    expect(operations.length).toBe(3)
    
    const listPets = operations.find(op => op.id === 'listPets')
    expect(listPets).toExist()
    expect(listPets.method).toBe('get')
    expect(listPets.path).toBe('/pets')
    expect(listPets.tags).toExist()
    expect(listPets.tags[0]).toBe('pets')
    expect(listPets.responses).toExist()
    expect(listPets.responses.length).toBe(2)
    
    const res200 = listPets.responses.find(res => res.code === '200')
    expect(res200).toExist()
    expect(res200.headers['x-next'].type).toBe('string')
    const resDefault = listPets.responses.find(res => res.code === 'default')
    expect(resDefault).toExist()
  })
})