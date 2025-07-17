import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig(() => {
	const isDemoMode = process.env.npm_lifecycle_event === 'build:demo';

	if (isDemoMode) {
		// Demo build - builds the index.html for deployment
		return {
			plugins: [],
			root: '.',
			base: '/',
			build: {
				outDir: 'dist',
				rollupOptions: {
					input: 'index.html',
				},
			},
		};
	}

	// Library build - builds the NPM package
	return {
		plugins: [
			dts({
				insertTypesEntry: true,
				include: ['src/**/*'],
				exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
			}),
		],
		root: '.',
		build: {
			lib: {
				entry: 'src/index.ts',
				name: 'GrassTitle',
				fileName: 'index',
				formats: ['es'],
			},
			rollupOptions: {
				external: ['lit', 'three'],
				output: {
					globals: {
						lit: 'Lit',
						three: 'THREE',
					},
				},
			},
		},
		server: {
			open: '/',
		},
	};
});