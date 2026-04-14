/**
 * Example test file to verify Jest setup is working
 * This test demonstrates the basic testing infrastructure for contributors
 */

describe('Jest Configuration', () => {
  it('should run basic tests correctly', () => {
    expect(1 + 1).toBe(2);
  });

  it('should support async operations', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });

  it('should handle object matching', () => {
    const testObject = {
      name: 'BuildFlow MVP',
      type: 'CI/CD Optimization',
      framework: 'Next.js'
    };

    expect(testObject).toEqual({
      name: 'BuildFlow MVP',
      type: 'CI/CD Optimization',
      framework: 'Next.js'
    });
  });
});