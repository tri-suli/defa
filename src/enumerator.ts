import fg from 'fast-glob';

export async function enumeratePayload(payloadDir: string): Promise<string[]> {
  const files = await fg('**/*', { cwd: payloadDir, dot: true, onlyFiles: true });
  return files.sort();
}
