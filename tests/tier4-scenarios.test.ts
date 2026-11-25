import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { WORKSPACE_ROOT } from './test-helpers.js';

describe('Tier 4: Real-World Scenarios Suite', () => {
  // =========================================================================
  // Scenario 1: TypeScript Compilation Integrity Check
  // =========================================================================
  it('Scenario 1: TypeScript compiler (tsc) validates frontend & backend with 0 errors', async () => {
    const tscScript = path.join(WORKSPACE_ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
    assert(fs.existsSync(tscScript), 'typescript bin/tsc must exist');

    const result = await new Promise<{ code: number | null; stdout: string; stderr: string }>(
      (resolve) => {
        const child = spawn(process.execPath, [tscScript, '-p', 'tsconfig.json', '--noEmit'], {
          cwd: WORKSPACE_ROOT,
          windowsHide: true,
        });

        let stdout = '';
        let stderr = '';
        child.stdout?.on('data', (d) => (stdout += d.toString()));
        child.stderr?.on('data', (d) => (stderr += d.toString()));

        child.on('close', (code) => {
          resolve({ code, stdout, stderr });
        });
      }
    );

    assert.equal(result.code, 0, `tsc failed with code ${result.code}: ${result.stdout} ${result.stderr}`);
    assert.equal(result.stderr.trim(), '', 'tsc stderr should be empty');
  });

  // =========================================================================
  // Scenario 2: Server Source Syntax & Production Bundle Verification
  // =========================================================================
  it('Scenario 2: Server production bundling compiles server/index.ts to valid CommonJS bundle', async () => {
    const serverSource = path.join(WORKSPACE_ROOT, 'server', 'index.ts');
    assert(fs.existsSync(serverSource), 'server/index.ts must exist');

    const distServerBundle = path.join(WORKSPACE_ROOT, 'dist-server', 'index.cjs');
    assert(fs.existsSync(distServerBundle), 'dist-server/index.cjs bundle must exist');

    const stats = fs.statSync(distServerBundle);
    assert(stats.size > 50000, `dist-server bundle size must be substantial (> 50KB), got ${stats.size}`);

    // Verify key route signatures in the bundled server
    const bundleContent = fs.readFileSync(distServerBundle, 'utf8');
    assert(bundleContent.includes('/api/search'), 'Bundle must contain /api/search route');
    assert(bundleContent.includes('/api/download'), 'Bundle must contain /api/download route');
    assert(bundleContent.includes('/api/user-data'), 'Bundle must contain /api/user-data route');
    assert(bundleContent.includes('/api/charts'), 'Bundle must contain /api/charts route');
    assert(bundleContent.includes('/api/focus-window'), 'Bundle must contain /api/focus-window route');
  });

  // =========================================================================
  // Scenario 3: Vite Frontend Asset & Production Build Verification
  // =========================================================================
  it('Scenario 3: Vite frontend distribution contains valid SPA structure and assets', () => {
    const distHtml = path.join(WORKSPACE_ROOT, 'dist', 'index.html');
    assert(fs.existsSync(distHtml), 'dist/index.html must exist');

    const htmlContent = fs.readFileSync(distHtml, 'utf8');
    assert(htmlContent.includes('<div id="root">'), 'HTML must contain root container');
    assert(htmlContent.includes('<script type="module"'), 'HTML must reference bundled module script');

    const assetsDir = path.join(WORKSPACE_ROOT, 'dist', 'assets');
    assert(fs.existsSync(assetsDir), 'dist/assets directory must exist');

    const assetFiles = fs.readdirSync(assetsDir);
    const hasJsBundle = assetFiles.some((f) => f.endsWith('.js'));
    const hasCssBundle = assetFiles.some((f) => f.endsWith('.css'));

    assert(hasJsBundle, 'dist/assets must contain bundled JS files');
    assert(hasCssBundle, 'dist/assets must contain bundled CSS stylesheets');
  });

  // =========================================================================
  // Scenario 4: Inno Setup Compiler Validation (ISCC.exe)
  // =========================================================================
  it('Scenario 4: Inno Setup compiler (ISCC.exe /O-) validates installer.iss with 0 errors', async () => {
    const isccPath = 'C:\\Users\\juste\\AppData\\Local\\Programs\\Inno Setup 6\\ISCC.exe';
    const issPath = 'C:\\Users\\juste\\AppData\\Local\\NotMusic-Build\\installer.iss';

    assert(fs.existsSync(isccPath), `ISCC compiler must exist at ${isccPath}`);
    assert(fs.existsSync(issPath), `Inno Setup script must exist at ${issPath}`);

    const result = await new Promise<{ code: number | null; stdout: string; stderr: string }>(
      (resolve) => {
        const child = spawn(isccPath, ['/O-', issPath], {
          windowsHide: true,
        });

        let stdout = '';
        let stderr = '';
        child.stdout?.on('data', (d) => (stdout += d.toString()));
        child.stderr?.on('data', (d) => (stderr += d.toString()));

        child.on('close', (code) => {
          resolve({ code, stdout, stderr });
        });
      }
    );

    assert.equal(result.code, 0, `ISCC.exe failed with code ${result.code}: ${result.stdout} ${result.stderr}`);
    assert(
      result.stdout.includes('Successful compile'),
      `ISCC output must confirm successful compile: ${result.stdout}`
    );
  });

  // =========================================================================
  // Scenario 5: Packaging Staging Directory Integrity Check
  // =========================================================================
  it('Scenario 5: Packaging staging directory has complete runtime and application structure', () => {
    const buildAppDir = 'C:\\Users\\juste\\AppData\\Local\\NotMusic-Build\\app';
    assert(fs.existsSync(buildAppDir), `Staging app directory must exist at ${buildAppDir}`);

    // Main Electron executable
    const exePath = path.join(buildAppDir, 'NotMusic.exe');
    assert(fs.existsSync(exePath), 'NotMusic.exe executable must exist in staging');
    const exeStats = fs.statSync(exePath);
    assert(exeStats.size > 50 * 1024 * 1024, `NotMusic.exe must be > 50MB, got ${exeStats.size}`);

    // Electron core runtime dependencies
    const requiredBinaries = [
      'ffmpeg.dll',
      'icudtl.dat',
      'resources.pak',
      'v8_context_snapshot.bin',
    ];

    for (const bin of requiredBinaries) {
      const binPath = path.join(buildAppDir, bin);
      assert(fs.existsSync(binPath), `Required runtime binary ${bin} must exist in staging`);
    }

    // Resources application folder
    const appResourcesDir = path.join(buildAppDir, 'resources', 'app');
    assert(fs.existsSync(appResourcesDir), 'resources/app directory must exist in staging');

    const requiredAppFiles = [
      'package.json',
      'index.html',
      path.join('dist', 'index.html'),
      path.join('dist-server', 'index.cjs'),
      path.join('electron', 'main.cjs'),
    ];

    for (const relFile of requiredAppFiles) {
      const fullPath = path.join(appResourcesDir, relFile);
      assert(fs.existsSync(fullPath), `Required staging application file ${relFile} must exist`);
    }
  });
});
