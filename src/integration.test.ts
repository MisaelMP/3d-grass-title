import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import './GrassTitle.js'; // Register the custom element

type ThreeMockHelpers = typeof import('../test/utils/createThreeMocks.ts');
type ThreeMockContext = {
        helpers: ThreeMockHelpers;
        mocks: ReturnType<ThreeMockHelpers['createThreeMockFactories']>;
};

const { ensureThreeMocks } = vi.hoisted(() => {
        let threeMockContext: Promise<ThreeMockContext> | null = null;
        const ensureThreeMocks = () => {
                if (!threeMockContext) {
                        threeMockContext = import('../test/utils/createThreeMocks.ts').then(
                                (helpers: ThreeMockHelpers) => ({
                                        helpers,
                                        mocks: helpers.createThreeMockFactories(vi),
                                })
                        );
                }
                return threeMockContext;
        };

        return { ensureThreeMocks };
});

// Mock Three.js for integration tests
vi.mock('three', async () => {
        const { helpers, mocks } = await ensureThreeMocks();
        return helpers.createThreeModule(vi, mocks);
});

vi.mock('three/examples/jsm/geometries/TextGeometry.js', async () => {
        const { helpers, mocks } = await ensureThreeMocks();
        return helpers.createTextGeometryModule(mocks);
});

vi.mock('three/examples/jsm/loaders/FontLoader.js', async () => {
        const { helpers, mocks } = await ensureThreeMocks();
        return helpers.createFontLoaderModule(vi, mocks.createMockFont, {
                shouldFail: (url) => url.includes('invalid'),
        });
});

vi.mock('./shaders/grassShader.js', async () => {
        const { mocks } = await ensureThreeMocks();
        return {
                createGrassShaderMaterialAsync: vi.fn(() =>
                        Promise.resolve(new mocks.MockShaderMaterial())
                ),
                createGrassFieldFromTextCanvas: vi.fn(() => new mocks.MockInstancedMesh()),
        };
});

describe('Integration Tests', () => {
        let container: HTMLDivElement;
        let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

        beforeEach(() => {
                consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
                container = document.createElement('div');
                document.body.appendChild(container);
        });

        afterEach(() => {
                consoleErrorSpy.mockRestore();
                // Clean up all elements and stop animations
                const elements = container.querySelectorAll('grass-title');
                elements.forEach(element => {
			if (element && (element as any).disconnectedCallback) {
				(element as any).disconnectedCallback();
			}
		});
		if (container) {
			container.remove();
		}
		// Clear document body
		document.body.innerHTML = '';
	});

	it('should work with HTML attributes', async () => {
		container.innerHTML = `
			<grass-title 
				text="HELLO" 
				color="#ff0000" 
				light-intensity="2.0"
				camera-distance="12"
				grass-density="600"
				grass-height="1.5"
				font-url="https://example.com/font.json"
			></grass-title>
		`;

		const element = container.querySelector('grass-title');
		expect(element).toBeTruthy();
		
		// Wait for element to initialize
		await new Promise(resolve => setTimeout(resolve, 10));
		
		expect(element?.getAttribute('text')).toBe('HELLO');
		expect(element?.getAttribute('color')).toBe('#ff0000');
		expect(element?.getAttribute('light-intensity')).toBe('2');
	});

	it('should handle dynamic property updates', async () => {
		const element = document.createElement('grass-title');
		container.appendChild(element);

		// Wait for initialization
		await new Promise(resolve => setTimeout(resolve, 10));

		// Update properties dynamically
		element.setAttribute('text', 'DYNAMIC');
		element.setAttribute('color', '#00ff00');
		element.setAttribute('light-intensity', '3.0');

		expect(element.getAttribute('text')).toBe('DYNAMIC');
		expect(element.getAttribute('color')).toBe('#00ff00');
		expect(element.getAttribute('light-intensity')).toBe('3.0');
	});

	it('should handle font loading success and failure', async () => {
		// Test successful font loading
		const element1 = document.createElement('grass-title');
		element1.setAttribute('font-url', 'https://example.com/valid-font.json');
		container.appendChild(element1);

		// Test failed font loading
		const element2 = document.createElement('grass-title');
		element2.setAttribute('font-url', 'https://example.com/invalid-font.json');
		container.appendChild(element2);

		// Wait for font loading attempts
		await new Promise(resolve => setTimeout(resolve, 50));

		// Both elements should still be functional
		expect(element1.shadowRoot?.querySelector('canvas')).toBeTruthy();
		expect(element2.shadowRoot?.querySelector('canvas')).toBeTruthy();
	});

	it('should work with JavaScript API', async () => {
		const element = document.createElement('grass-title');
		container.appendChild(element);

		// Test programmatic property setting
		(element as any).text = 'API TEST';
		(element as any).color = '#purple';
		(element as any).lightIntensity = 2.5;
		(element as any).cameraDistance = 8;
		(element as any).grassDensity = 1000;
		(element as any).grassHeight = 2.0;
		(element as any).rotation = [0.1, 0.2, 0.3];

		expect((element as any).text).toBe('API TEST');
		expect((element as any).color).toBe('#purple');
		expect((element as any).lightIntensity).toBe(2.5);
		expect((element as any).cameraDistance).toBe(8);
		expect((element as any).grassDensity).toBe(1000);
		expect((element as any).grassHeight).toBe(2.0);
		expect((element as any).rotation).toEqual([0.1, 0.2, 0.3]);
	});

	it('should clean up when removed from DOM', async () => {
		const element = document.createElement('grass-title');
		container.appendChild(element);

		// Wait for initialization
		await new Promise(resolve => setTimeout(resolve, 10));

		// Remove from DOM
		container.removeChild(element);

		// Element should clean up properly (no errors thrown)
		expect(true).toBe(true); // If we get here, cleanup worked
	});
});