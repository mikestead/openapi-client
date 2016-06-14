import { resolveSpec } from '../../src/spec/spec'
import expect from 'expect'

describe('spec', () => {
  it('should resolve a spec from url', async () => {
    const spec = await resolveSpec('http://petstore.swagger.io/v2/swagger.json')
    expect(spec).toExist()
    expect(spec.host).toBe('petstore.swagger.io')
    expect(spec.basePath).toBe('/v2')
    expect(spec.securityDefinitions).toExist()
    expect(spec.definitions).toExist()
    expect(spec.paths).toExist()
  })
  
  it('should resolve a spec from local file', async () => {
    const path = `${__dirname}/../petstore.yml`
    const spec = await resolveSpec(path)
    expect(spec).toExist()
    expect(spec.host).toBe('petstore.swagger.io')
    expect(spec.basePath).toBe('/v1')
    expect(spec.definitions).toExist()
    expect(spec.paths).toExist()
  })
})
