#!/usr/bin/env node

import { execSync } from 'child_process';
import { mkdirSync, existsSync, copyFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distElectron = path.join(rootDir, 'dist-electron');

if (!existsSync(distElectron)) {
  mkdirSync(distElectron, { recursive: true });
}

console.log('Compiling Electron main process...');
execSync(
  `npx tsc electron/main.ts --outDir dist-electron --module commonjs --target ES2022 --esModuleInterop --skipLibCheck --moduleResolution node`,
  { cwd: rootDir, stdio: 'inherit' }
);

console.log('Compiling Electron preload script...');
execSync(
  `npx tsc electron/preload.ts --outDir dist-electron --module commonjs --target ES2022 --esModuleInterop --skipLibCheck --moduleResolution node`,
  { cwd: rootDir, stdio: 'inherit' }
);

console.log('Electron build complete.');
