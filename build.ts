import esbuild from 'esbuild';

async function build() {
    // Build the ESM bundle
    await esbuild.build({
        entryPoints: ['src/index.ts'],
        bundle: true,
        format: 'esm',
        outfile: 'dist/esm/index.js',
        platform: 'neutral',
        sourcemap: true,
        'treeShaking': true,
    });

    // Build the CommonJS bundle
    await esbuild.build({
        entryPoints: ['src/index.ts'],
        bundle: true,
        format: 'cjs',
        outfile: 'dist/cjs/index.cjs',
        platform: 'node',
        sourcemap: true,
        treeShaking: true,
    });
    console.log('esbuild bundling complete.');
}

build().catch((error) => {
    console.error(error);
    process.exit(1);
});