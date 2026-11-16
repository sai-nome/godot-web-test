import { mkdir, writeFile } from 'node:fs/promises';
for (const dir of ['node_modules', 'dist', '.cache']) {
  await mkdir(dir, { recursive: true });
  await writeFile(dir + '/.gdignore', '');
}
