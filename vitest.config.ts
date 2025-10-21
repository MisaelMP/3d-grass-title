import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'happy-dom',
		globals: true,
		setupFiles: ['./src/test-setup.ts'],
		// Add more explicit configuration for CI environments
		pool: 'forks',
		isolate: true,
		// Increase timeout for CI environments
		testTimeout: 10000,
		// Handle unhandled promise rejections
		dangerouslyIgnoreUnhandledErrors: false,
	},
});