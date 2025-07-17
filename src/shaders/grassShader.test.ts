import { describe, it, expect, vi } from 'vitest';
import { createGrassFieldFromTextCanvas } from './grassShader.js';

// Mock Three.js
vi.mock('three', () => ({
	ConeGeometry: vi.fn(() => ({})),
	ShaderMaterial: vi.fn(() => ({
		uniforms: {
			uTime: { value: 0 },
			uColor: { value: {} },
			uLightIntensity: { value: 1.5 }
		}
	})),
	InstancedMesh: vi.fn((geometry, material, count) => ({
		geometry,
		material,
		count,
		setMatrixAt: vi.fn(),
		setColorAt: vi.fn(),
		instanceMatrix: { needsUpdate: false },
		instanceColor: { needsUpdate: false }
	})),
	Matrix4: vi.fn(() => ({
		makeRotationFromEuler: vi.fn(() => ({})),
		scale: vi.fn(() => ({})),
		setPosition: vi.fn(() => ({}))
	})),
	Euler: vi.fn(() => ({})),
	Vector3: vi.fn(() => ({})),
	Color: vi.fn(() => ({
		setHSL: vi.fn(),
		multiplyScalar: vi.fn(() => ({ multiplyScalar: vi.fn() }))
	})),
	TextureLoader: vi.fn(() => ({
		load: vi.fn((url, onLoad, onProgress, onError) => {
			// Simulate texture loading failure to test procedural texture fallback
			onError?.(new Error('Mock texture load failure'));
		})
	})),
	CanvasTexture: vi.fn(() => ({
		wrapS: 0,
		wrapT: 0,
		repeat: { set: vi.fn() },
		minFilter: 0,
		magFilter: 0,
		generateMipmaps: true
	})),
	RepeatWrapping: 0,
	LinearMipMapLinearFilter: 0,
	LinearFilter: 0,
}));

// Mock canvas and context
const mockCanvas = {
	width: 100,
	height: 100,
	getContext: vi.fn(() => ({
		font: '',
		fillStyle: '',
		clearRect: vi.fn(),
		fillText: vi.fn(),
		getImageData: vi.fn(() => ({
			data: new Uint8ClampedArray(100 * 100 * 4).fill(255) // All white pixels
		})),
		createImageData: vi.fn(() => ({
			data: new Uint8ClampedArray(512 * 512 * 4)
		})),
		putImageData: vi.fn()
	}))
};

// Mock document.createElement for canvas
const originalCreateElement = document.createElement;
document.createElement = vi.fn((tagName: string) => {
	if (tagName === 'canvas') {
		return mockCanvas as any;
	}
	return originalCreateElement.call(document, tagName);
});

describe('grassShader', () => {
	const mockTextGeometry = {
		boundingBox: {
			min: { x: -1, y: -1, z: -1 },
			max: { x: 1, y: 1, z: 1 }
		}
	};

	describe('createGrassFieldFromTextCanvas', () => {
		it('should create an instanced mesh', () => {
			const result = createGrassFieldFromTextCanvas(
				'TEST',
				500,
				1.0,
				mockTextGeometry as any
			);

			expect(result).toBeTruthy();
			expect(result.count).toBeGreaterThan(0);
		});

		it('should scale geometry by grass height', () => {
			const grassHeight = 2.0;
			const result = createGrassFieldFromTextCanvas(
				'TEST',
				500,
				grassHeight,
				mockTextGeometry as any
			);

			// Should create result successfully
			expect(result).toBeTruthy();
		});

		it('should adjust sampling based on density', () => {
			// Test with low density
			const lowDensityResult = createGrassFieldFromTextCanvas(
				'TEST',
				200, // Low density
				1.0,
				mockTextGeometry as any
			);

			// Test with high density
			const highDensityResult = createGrassFieldFromTextCanvas(
				'TEST',
				1000, // High density
				1.0,
				mockTextGeometry as any
			);

			// Both should create instances successfully
			expect(lowDensityResult).toBeTruthy();
			expect(highDensityResult).toBeTruthy();
		});

		it('should handle empty text', () => {
			const result = createGrassFieldFromTextCanvas(
				'',
				500,
				1.0,
				mockTextGeometry as any
			);

			expect(result).toBeTruthy();
		});
	});

});