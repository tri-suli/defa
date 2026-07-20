import { describe, it, expect } from 'vitest';
import { compilePatterns, scanContent } from '../src/scanner';

describe('scanContent', () => {
  it('flags a line containing a fake API key with line number', () => {
    const patterns = compilePatterns(['sk-[A-Za-z0-9]{16,}']);
    const content = 'line one\nkey = sk-ABCDEFGHIJKLMNOP123\nlast';
    const findings = scanContent('CLAUDE.md', content, patterns);
    expect(findings).toHaveLength(1);
    expect(findings[0].line).toBe(2);
    expect(findings[0].relPath).toBe('CLAUDE.md');
  });

  it('returns empty when nothing matches', () => {
    const patterns = compilePatterns(['sk-[A-Za-z0-9]{16,}']);
    expect(scanContent('CLAUDE.md', 'nothing here', patterns)).toEqual([]);
  });

  it('strips trailing \\r so end-anchored patterns match CRLF content', () => {
    const patterns = compilePatterns(['AKIA[0-9A-Z]{16}$']);
    const content = 'line one\r\nkey = AKIAABCDEFGHIJKLMNOP\r\nlast\r\n';
    const findings = scanContent('CLAUDE.md', content, patterns);
    expect(findings).toHaveLength(1);
    expect(findings[0].line).toBe(2);
    expect(findings[0].snippet).toBe('AKIAABCDEFGHIJKLMNOP');
  });
});
