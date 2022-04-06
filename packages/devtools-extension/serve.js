const esbuild = require('esbuild');
const webext = require('web-ext');

esbuild.build({
  entryPoints: [
    './src/index.ts',
    './src/devtools-page.ts',
    './src/content-script.ts',
    './src/page-script.js',
  ],
  outdir: 'dist',
  bundle: true,
  watch: true,
  sourcemap: 'linked',
  tsconfig: 'tsconfig.json',
});

webext.cmd.run({
  sourceDir: process.cwd(),
  target: 'chromium',
  startUrl: 'http://localhost:3000',
});