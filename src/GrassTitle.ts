import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { createGrassFieldFromTextCanvas } from './shaders/grassShader.js';

@customElement('grass-title')
export class GrassTitle extends LitElement {
	@property({ type: String, reflect: true }) text: string = 'Welcome';
	@property({ type: String, reflect: true }) color: string = '#c5e194';
	@property({
		type: Number,
		reflect: true,
		attribute: 'light-intensity',
	})
	lightIntensity: number = 1.2;
	@property({
		type: Array,
		converter: {
			fromAttribute: (value: string) => {
				try {
					return JSON.parse(value);
				} catch {
					return [0, 0, 0];
				}
			},
			toAttribute: (value: [number, number, number]) => JSON.stringify(value),
		},
	})
	rotation: [number, number, number] = [0, 0, 0];
	@property({
		type: Number,
		reflect: true,
		attribute: 'camera-distance',
	})
	cameraDistance: number = 10; // Increased for better view of moss text
	@property({
		type: String,
		reflect: true,
		attribute: 'font-url',
	})
	fontUrl?: string;
	@property({
		type: Number,
		reflect: true,
		attribute: 'grass-density',
	})
	grassDensity: number = 800; // Increased for better grass coverage
	@property({
		type: Number,
		reflect: true,
		attribute: 'grass-height',
	})
	grassHeight: number = 1.2;
	@property({
		type: String,
		reflect: true,
	})
	link?: string;

	private scene!: THREE.Scene;
	private camera!: THREE.PerspectiveCamera;
	private renderer!: THREE.WebGLRenderer;
	private grassField!: THREE.InstancedMesh;
	private light!: THREE.DirectionalLight;
	private canvas!: HTMLCanvasElement;
	private animationId!: number;
	private fontLoader!: FontLoader;
	private font!: Font;
	private resizeObserver!: ResizeObserver;
	private isAnimating: boolean = false;

	static styles = css`
		:host {
			display: block;
			width: 100%;
			height: 25rem;
			position: relative;
		}

		canvas {
			width: 100%;
			height: 100%;
			display: block;
			cursor: pointer;
		}
	`;

	render() {
		return html`<canvas @click="${this.handleClick}"></canvas>`;
	}

	firstUpdated() {
		this.canvas = this.shadowRoot!.querySelector('canvas')!;
		this.initThreeJS();
		this.loadFont();
		this.setupResizeObserver();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		if (this.animationId) {
			cancelAnimationFrame(this.animationId);
		}
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
		}
		this.cleanup();
	}

	private initThreeJS() {
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x000000);

		const rect = this.canvas.getBoundingClientRect();
		this.camera = new THREE.PerspectiveCamera(
			75,
			rect.width / rect.height,
			0.1,
			1000
		);
		this.camera.position.set(0, 0, this.cameraDistance);

		this.renderer = new THREE.WebGLRenderer({
			canvas: this.canvas,
			antialias: true,
			alpha: true,
		});
		this.renderer.setSize(rect.width, rect.height);
		this.renderer.setPixelRatio(window.devicePixelRatio);

		this.light = new THREE.DirectionalLight(0xffffff, this.lightIntensity);
		this.light.position.set(1, 1, 1);
		this.scene.add(this.light);

		const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
		this.scene.add(ambientLight);
	}

	private loadFont() {
		this.fontLoader = new FontLoader();

		const fontPath =
			this.fontUrl ||
			'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json';

		this.fontLoader.load(
			fontPath,
			async (font: Font) => {
				this.font = font;
				await this.createGrassField();
				if (!this.animationId) {
					this.animateScene();
				}
			},
			undefined,
			async (error: unknown) => {
				console.error('Font loading error:', error);
				// Just continue with animation even if font fails
				if (!this.animationId) {
					this.animateScene();
				}
			}
		);
	}

	private async createGrassField() {
		if (this.grassField) {
			this.scene.remove(this.grassField);
			this.grassField.geometry.dispose();
			if (this.grassField.material) {
				if (Array.isArray(this.grassField.material)) {
					this.grassField.material.forEach((mat) => mat.dispose());
				} else {
					this.grassField.material.dispose();
				}
			}
		}

		// Remove any existing text mesh
		const existingTextMesh = this.scene.children.find(
			(child) => child.userData.isTextMesh
		);
		if (existingTextMesh) {
			this.scene.remove(existingTextMesh);
		}

		try {
			// Create text geometry
			const { TextGeometry } = await import(
				'three/examples/jsm/geometries/TextGeometry.js'
			);
			const textGeometry = new TextGeometry(this.text, {
				font: this.font,
				size: 1,
				height: 0.5,
				curveSegments: 12,
				bevelEnabled: true,
				bevelThickness: 0.1,
				bevelSize: 0.05,
				bevelOffset: 0,
				bevelSegments: 5,
			});

			textGeometry.computeBoundingBox();
			const centerOffsetX =
				-0.5 *
				(textGeometry.boundingBox!.max.x - textGeometry.boundingBox!.min.x);
			const centerOffsetY =
				-0.5 *
				(textGeometry.boundingBox!.max.y - textGeometry.boundingBox!.min.y);
			textGeometry.translate(centerOffsetX, centerOffsetY, 0);

			// Create particles following canvas text sampling
			this.grassField = createGrassFieldFromTextCanvas(
				this.text,
				this.grassDensity,
				this.grassHeight,
				textGeometry
			);
			this.scene.add(this.grassField);

			// Apply initial color and light intensity to particles
			if (this.grassField.material instanceof THREE.ShaderMaterial) {
				const material = this.grassField.material;
				const uniforms = material.uniforms as Record<string, THREE.IUniform>;
				if (uniforms.uColor) {
					uniforms.uColor.value = new THREE.Color(this.color);
				}
				if (uniforms.uLightIntensity) {
					uniforms.uLightIntensity.value = this.lightIntensity;
				}
			}
		} catch (error) {
			console.error('Error creating grass text:', error);
		}
	}

	// Fallback function removed - we only use text shader material now

	private animateScene = () => {
		this.animationId = requestAnimationFrame(this.animateScene);

		// Update time for animations
		const time = performance.now() * 0.001;

		// Update shader uniforms for wind animation
		if (this.grassField && this.grassField.material) {
			const material = this.grassField.material as THREE.ShaderMaterial;
			if (material.uniforms && material.uniforms.uTime) {
				material.uniforms.uTime.value = time;
			}
		}

		this.renderer.render(this.scene, this.camera);
	};

	private setupResizeObserver() {
		this.resizeObserver = new ResizeObserver(() => {
			this.handleResize();
		});
		this.resizeObserver.observe(this);
	}

	private handleResize() {
		const rect = this.canvas.getBoundingClientRect();
		this.camera.aspect = rect.width / rect.height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(rect.width, rect.height);
	}

	private cleanup() {
		if (this.grassField) {
			this.scene.remove(this.grassField);
			this.grassField.geometry.dispose();
			if (this.grassField.material) {
				if (Array.isArray(this.grassField.material)) {
					this.grassField.material.forEach((mat) => mat.dispose());
				} else {
					this.grassField.material.dispose();
				}
			}
		}
		if (this.renderer) {
			this.renderer.dispose();
		}
	}

	updated(changedProperties: Map<string, any>) {
		// Handle text changes - recreate grass field if font is loaded
		if (changedProperties.has('text') && this.font) {
			this.createGrassField();
		}

		// Handle grass density or height changes
		if (
			(changedProperties.has('grassDensity') ||
				changedProperties.has('grassHeight')) &&
			this.font
		) {
			this.createGrassField();
		}

		// Handle color changes - update material uniforms
		if (
			changedProperties.has('color') &&
			this.grassField &&
			this.grassField.material
		) {
			const material = this.grassField.material as THREE.ShaderMaterial;
			const uniforms = material.uniforms as Record<string, THREE.IUniform>;
			// Update the actual uColor uniform that exists in the particle shader
			if (uniforms.uColor) {
				uniforms.uColor.value = new THREE.Color(this.color);
			}
		}

		// Handle light intensity changes
		if (changedProperties.has('lightIntensity')) {
			if (this.light) {
				this.light.intensity = this.lightIntensity;
			}
			// Update particle shader light intensity uniform
			if (this.grassField && this.grassField.material) {
				const material = this.grassField.material as THREE.ShaderMaterial;
				const uniforms = material.uniforms as Record<string, THREE.IUniform>;
				if (uniforms.uLightIntensity) {
					uniforms.uLightIntensity.value = this.lightIntensity;
				}
			}
		}

		// Handle rotation changes
		if (changedProperties.has('rotation') && this.grassField) {
			this.grassField.rotation.set(
				this.rotation[0],
				this.rotation[1],
				this.rotation[2]
			);
		}

		// Handle camera distance changes
		if (changedProperties.has('cameraDistance') && this.camera) {
			this.camera.position.setZ(this.cameraDistance);
		}

		// Handle font URL changes - reload font
		if (changedProperties.has('fontUrl')) {
			this.loadFont();
		}
	}

	private handleClick = () => {
		if (!this.link || this.isAnimating) return;

		this.isAnimating = true;
		this.startParticleSpreadAnimation();
	};

	private startParticleSpreadAnimation = () => {
		if (!this.grassField || !this.grassField.material) return;

		const material = this.grassField.material as THREE.ShaderMaterial;
		const uniforms = material.uniforms as Record<string, THREE.IUniform>;

		if (uniforms.uSpread) {
			// Animate spread from 0 to 1
			const startTime = performance.now();
			const duration = 800; // 800ms for spread animation

			const animateSpread = () => {
				const elapsed = performance.now() - startTime;
				const progress = Math.min(elapsed / duration, 1);

				// Smooth easing function
				const easeProgress = 1 - Math.pow(1 - progress, 3);
				uniforms.uSpread.value = easeProgress;

				if (progress < 1) {
					requestAnimationFrame(animateSpread);
				} else {
					// Start return animation after a brief pause
					setTimeout(() => {
						this.startParticleReturnAnimation();
					}, 200);
				}
			};

			animateSpread();
		}
	};

	private startParticleReturnAnimation = () => {
		if (!this.grassField || !this.grassField.material) return;

		const material = this.grassField.material as THREE.ShaderMaterial;
		const uniforms = material.uniforms as Record<string, THREE.IUniform>;

		if (uniforms.uSpread) {
			// Animate spread from 1 back to 0
			const startTime = performance.now();
			const duration = 600; // 600ms for return animation

			const animateReturn = () => {
				const elapsed = performance.now() - startTime;
				const progress = Math.min(elapsed / duration, 1);

				// Smooth easing function
				const easeProgress = 1 - Math.pow(1 - progress, 2);
				uniforms.uSpread.value = 1 - easeProgress;

				if (progress < 1) {
					requestAnimationFrame(animateReturn);
				} else {
					// Navigate after return animation completes
					this.isAnimating = false;
					if (this.link) {
						window.location.href = this.link;
					}
				}
			};

			animateReturn();
		}
	};
}
