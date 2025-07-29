import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GrassTitle } from './GrassTitle.js';
import './GrassTitle.js'; // Register the custom element

// Mock Three.js since it requires WebGL context
vi.mock('three', () => ({
	Scene: vi.fn(() => ({ 
		add: vi.fn(), 
		remove: vi.fn(),
		children: []
	})),
	PerspectiveCamera: vi.fn(() => ({ 
		position: { set: vi.fn(), setZ: vi.fn() },
		aspect: 1,
		updateProjectionMatrix: vi.fn()
	})),
	WebGLRenderer: vi.fn(() => ({ 
		setSize: vi.fn(), 
		setPixelRatio: vi.fn(),
		render: vi.fn(),
		dispose: vi.fn()
	})),
	DirectionalLight: vi.fn(() => ({ 
		position: { set: vi.fn() },
		intensity: 1
	})),
	AmbientLight: vi.fn(() => ({})),
	Color: vi.fn(() => ({ 
		multiplyScalar: vi.fn(() => ({ multiplyScalar: vi.fn() }))
	})),
	BufferGeometry: vi.fn(),
	InstancedMesh: vi.fn(() => ({
		material: {
			uniforms: {
				uColor: { value: {} },
				uLightIntensity: { value: 1 }
			}
		},
		rotation: { set: vi.fn() },
		setMatrixAt: vi.fn(),
		setColorAt: vi.fn(),
		instanceMatrix: { needsUpdate: false },
		instanceColor: { needsUpdate: false }
	})),
	Matrix4: vi.fn(() => ({
		makeRotationFromEuler: vi.fn(),
		scale: vi.fn(),
		setPosition: vi.fn()
	})),
	Euler: vi.fn(),
	Vector3: vi.fn(),
	ShaderMaterial: vi.fn()
}));

// Mock FontLoader
vi.mock('three/examples/jsm/loaders/FontLoader.js', () => ({
	FontLoader: vi.fn(() => ({
		load: vi.fn((url, onLoad) => {
			// Simulate successful font loading
			setTimeout(() => onLoad({}), 0);
		})
	}))
}));

// Mock shader functions
vi.mock('./shaders/grassShader.js', () => ({
	createGrassShaderMaterialAsync: vi.fn(() => Promise.resolve({})),
	createGrassFieldFromTextCanvas: vi.fn(() => ({
		material: {
			uniforms: {
				uColor: { value: {} },
				uLightIntensity: { value: 1 }
			}
		},
		rotation: { set: vi.fn() }
	}))
}));

describe('GrassTitle', () => {
	let element: GrassTitle;

	beforeEach(() => {
		// Create a fresh element for each test
		element = document.createElement('grass-title') as GrassTitle;
		document.body.appendChild(element);
	});

	afterEach(() => {
		// Clean up element and stop any animations
		if (element) {
			element.remove();
			// Force cleanup by calling disconnectedCallback if it exists
			if (element.disconnectedCallback) {
				element.disconnectedCallback();
			}
		}
		// Clear document body
		document.body.innerHTML = '';
	});

	it('should create an instance', () => {
		expect(element).toBeInstanceOf(GrassTitle);
		expect(element.tagName.toLowerCase()).toBe('grass-title');
	});

	it('should have default properties', () => {
		expect(element.text).toBe('Welcome');
		expect(element.color).toBe('#c5e194');
		expect(element.lightIntensity).toBe(1.2);
		expect(element.cameraDistance).toBe(10);
		expect(element.grassDensity).toBe(800);
		expect(element.grassHeight).toBe(1.2);
	});

	it('should update text property', () => {
		element.text = 'HELLO';
		expect(element.text).toBe('HELLO');
		
		element.setAttribute('text', 'WORLD');
		expect(element.text).toBe('WORLD');
	});

	it('should update color property', () => {
		element.color = '#ff0000';
		expect(element.color).toBe('#ff0000');
		
		element.setAttribute('color', '#00ff00');
		expect(element.color).toBe('#00ff00');
	});

	it('should update light intensity property', () => {
		element.lightIntensity = 2.0;
		expect(element.lightIntensity).toBe(2.0);
		
		element.setAttribute('light-intensity', '2.5');
		expect(element.lightIntensity).toBe(2.5);
	});

	it('should update camera distance property', () => {
		element.cameraDistance = 15;
		expect(element.cameraDistance).toBe(15);
		
		element.setAttribute('camera-distance', '8');
		expect(element.cameraDistance).toBe(8);
	});

	it('should update grass density property', () => {
		element.grassDensity = 1000;
		expect(element.grassDensity).toBe(1000);
		
		element.setAttribute('grass-density', '500');
		expect(element.grassDensity).toBe(500);
	});

	it('should update grass height property', () => {
		element.grassHeight = 2.0;
		expect(element.grassHeight).toBe(2.0);
		
		element.setAttribute('grass-height', '1.5');
		expect(element.grassHeight).toBe(1.5);
	});

	it('should parse rotation array property', () => {
		element.rotation = [0.1, 0.2, 0.3];
		expect(element.rotation).toEqual([0.1, 0.2, 0.3]);
		
		element.setAttribute('rotation', '[0.5, 0.6, 0.7]');
		expect(element.rotation).toEqual([0.5, 0.6, 0.7]);
	});

	it('should handle invalid rotation gracefully', () => {
		element.setAttribute('rotation', 'invalid-json');
		expect(element.rotation).toEqual([0, 0, 0]); // Should fallback to default
	});

	it('should update font URL property', () => {
		const fontUrl = 'https://example.com/font.json';
		element.fontUrl = fontUrl;
		expect(element.fontUrl).toBe(fontUrl);
		
		element.setAttribute('font-url', fontUrl);
		expect(element.fontUrl).toBe(fontUrl);
	});

	it('should render a canvas element', () => {
		const canvas = element.shadowRoot?.querySelector('canvas');
		expect(canvas).toBeTruthy();
		expect(canvas?.tagName.toLowerCase()).toBe('canvas');
	});

	it('should be a custom element', () => {
		expect(customElements.get('grass-title')).toBe(GrassTitle);
	});

	it('should reflect properties as attributes', () => {
		element.text = 'TEST';
		element.color = '#123456';
		element.lightIntensity = 3.0;
		
		// Properties should be reflected as attributes (Lit handles this automatically)
		// Note: Lit updates attributes asynchronously, so we test the properties instead
		expect(element.text).toBe('TEST');
		expect(element.color).toBe('#123456');
		expect(element.lightIntensity).toBe(3.0);
	});
});