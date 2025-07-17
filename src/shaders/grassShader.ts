import * as THREE from 'three';

// Create grass field using canvas text sampling (following Codrops tutorial exactly)
export function createGrassFieldFromTextCanvas(
	text: string,
	density: number = 500,
	grassHeight: number = 1.0,
	textGeometry: THREE.BufferGeometry
): THREE.InstancedMesh {
	// Step 1: Create canvas and draw text (following tutorial)
	const fontName = 'Arial';
	const textureFontSize = 100;

	const textCanvas = document.createElement('canvas');
	const textCtx = textCanvas.getContext('2d')!;

	// Calculate canvas size based on text
	const lines = text.split('\n');
	const linesMaxLength = lines.sort((a, b) => b.length - a.length)[0].length;

	const wTexture = textureFontSize * 0.7 * linesMaxLength;
	const hTexture = lines.length * textureFontSize;

	textCanvas.width = wTexture;
	textCanvas.height = hTexture;

	// Clear and draw text exactly like tutorial
	textCtx.font = `bold ${textureFontSize}px ${fontName}`;
	textCtx.fillStyle = '#2a9d8f'; // Color for sampling
	textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);

	lines.forEach((line, i) => {
		textCtx.fillText(line, 0, ((i + 0.8) * hTexture) / lines.length);
	});

	// Step 2: Sample coordinates from canvas - density affects sampling step
	const textureCoordinates: Array<{ x: number; y: number }> = [];
	// Convert density to sampling step: higher density = smaller step = more particles
	// Improved formula: density 100->step 8, density 500->step 4, density 1000->step 2, density 1500->step 1
	const samplingStep = Math.max(1, Math.round(10 - (density / 150)));

	const imageData = textCtx.getImageData(
		0,
		0,
		textCanvas.width,
		textCanvas.height
	);

	for (let y = 0; y < textCanvas.height; y += samplingStep) {
		for (let x = 0; x < textCanvas.width; x += samplingStep) {
			if (imageData.data[(x + y * textCanvas.width) * 4] > 0) {
				textureCoordinates.push({ x, y });
			}
		}
	}

	// Step 3: Create geometry and material for particles - more 3D looking
	const grassGeometry = new THREE.ConeGeometry(0.02 * grassHeight, 0.08 * grassHeight, 8); // Cone shape scaled by grassHeight
	
	// Create shader material with wind animation and lighting
	const grassMaterial = new THREE.ShaderMaterial({
		uniforms: {
			uTime: { value: 0 },
			uColor: { value: new THREE.Color(0x4a7c59) }, // Will be updated by component
			uLightIntensity: { value: 1.5 } // Will be updated by component
		},
		vertexShader: `
			uniform float uTime;
			varying vec3 vNormal;
			varying vec3 vPosition;
			
			void main() {
				vNormal = normalize(normalMatrix * normal);
				vPosition = position;
				
				vec3 pos = position;
				
				// Add subtle wind movement based on instance ID
				float windX = sin(uTime * 2.0 + float(gl_InstanceID) * 0.1) * 0.01;
				float windY = sin(uTime * 1.5 + float(gl_InstanceID) * 0.15) * 0.005;
				float windZ = cos(uTime * 1.8 + float(gl_InstanceID) * 0.05) * 0.003;
				
				pos.x += windX;
				pos.y += windY;
				pos.z += windZ;
				
				vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
				gl_Position = projectionMatrix * mvPosition;
			}
		`,
		fragmentShader: `
			uniform vec3 uColor;
			uniform float uLightIntensity;
			varying vec3 vNormal;
			varying vec3 vPosition;
			
			void main() {
				// Simple directional lighting
				vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
				float NdotL = max(dot(normalize(vNormal), lightDir), 0.0);
				float diffuse = 0.3 + 0.7 * NdotL; // Ambient + diffuse
				
				// Apply lighting and intensity
				vec3 finalColor = uColor * diffuse * uLightIntensity;
				
				gl_FragColor = vec4(finalColor, 1.0);
			}
		`
	});

	// Step 4: Create instanced mesh - use ALL sampled coordinates for complete coverage
	const particleCount = textureCoordinates.length; // Use ALL coordinates to maintain text shape
	const grassField = new THREE.InstancedMesh(
		grassGeometry,
		grassMaterial,
		particleCount
	);

	// Step 5: Convert canvas coordinates to 3D positions (following tutorial)
	const bbox = textGeometry.boundingBox!;
	const textWidth = bbox.max.x - bbox.min.x;
	const fontScaleFactor = textWidth / (wTexture * 0.8);

	const matrix = new THREE.Matrix4();
	const color = new THREE.Color();

	for (let i = 0; i < particleCount; i++) {
		const coord = textureCoordinates[i];

		// Convert canvas coordinates to 3D world coordinates (tutorial method)
		const x3d = (coord.x - wTexture / 2) * fontScaleFactor;
		const y3d = -(coord.y - hTexture / 2) * fontScaleFactor; // Flip Y
		const z3d = bbox.max.z + 0.05;

		// Add random rotation and scale for more organic 3D look
		const rotationX = Math.random() * Math.PI * 0.3; // Slight tilt
		const rotationY = Math.random() * Math.PI * 2; // Random rotation
		const rotationZ = Math.random() * Math.PI * 0.3; // Slight tilt
		const scale = 0.8 + Math.random() * 0.4; // Random size variation

		// Set transformation matrix with rotation and scale
		matrix.makeRotationFromEuler(new THREE.Euler(rotationX, rotationY, rotationZ));
		matrix.scale(new THREE.Vector3(scale, scale, scale));
		matrix.setPosition(x3d, y3d, z3d);
		grassField.setMatrixAt(i, matrix);

		// Set color with more variation
		color.setHSL(0.25 + Math.random() * 0.05, 0.7, 0.3 + Math.random() * 0.2);
		grassField.setColorAt(i, color);
	}

	grassField.instanceMatrix.needsUpdate = true;
	if (grassField.instanceColor) {
		grassField.instanceColor.needsUpdate = true;
	}

	return grassField;
}

// Grass texture URLs - using local high-quality textures
const GRASS_TEXTURE_URLS = [
	'/textures/grass1.jpg',
	'/textures/grass3.jpg',
	'https://threejs.org/examples/textures/terrain/grasslight-big.jpg',
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // Fallback 1x1 transparent
];

let grassTextureCache: THREE.Texture | null = null;

export async function loadGrassTexture(): Promise<THREE.Texture> {
	if (grassTextureCache) {
		return grassTextureCache;
	}

	const textureLoader = new THREE.TextureLoader();

	// Try to load grass texture from multiple sources
	for (const url of GRASS_TEXTURE_URLS) {
		try {
			const texture = await new Promise<THREE.Texture>((resolve, reject) => {
				textureLoader.load(url, resolve, undefined, reject);
			});

			// Configure texture for grass-like appearance
			texture.wrapS = THREE.RepeatWrapping;
			texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set(2, 2);
			texture.minFilter = THREE.LinearMipMapLinearFilter;
			texture.magFilter = THREE.LinearFilter;
			texture.generateMipmaps = true;

			grassTextureCache = texture;
			return texture;
		} catch (error) {
			console.warn(`Failed to load grass texture from ${url}:`, error);
			continue;
		}
	}

	// If all external textures fail, create a procedural grass texture
	return createProceduralGrassTexture();
}

function createProceduralGrassTexture(): THREE.Texture {
	const size = 512;
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d')!;

	// Create realistic grass-like texture
	const imageData = ctx.createImageData(size, size);
	const data = imageData.data;

	for (let i = 0; i < size; i++) {
		for (let j = 0; j < size; j++) {
			const idx = (i * size + j) * 4;

			// Create complex grass fiber pattern
			const x = i / size;
			const y = j / size;

			// Multiple layers of grass-like noise
			const grassNoise1 = Math.sin(y * 80 + x * 12) * 0.4 + 0.6;
			const grassNoise2 = Math.sin(x * 120 + y * 30) * 0.3 + 0.7;
			const grassNoise3 = Math.sin(x * 200 + y * 90) * 0.2 + 0.8;
			const grassNoise4 = Math.sin(y * 150 + x * 45) * 0.15 + 0.85;

			// Create grass blade direction
			const bladeDirection = Math.sin(x * 60 + y * 40) * 0.1 + 0.9;

			// Combine all noise layers
			const grassValue =
				grassNoise1 * grassNoise2 * grassNoise3 * grassNoise4 * bladeDirection;

			// Add some random variation
			const randomVariation = (Math.random() - 0.5) * 0.1;
			const finalGrassValue = Math.max(
				0,
				Math.min(1, grassValue + randomVariation)
			);

			// Create realistic grass colors with more variation
			const baseR = 0.15 + finalGrassValue * 0.25;
			const baseG = 0.35 + finalGrassValue * 0.45;
			const baseB = 0.08 + finalGrassValue * 0.15;

			// Add subtle brown/yellow tints for realism
			const brownTint = Math.sin(x * 30 + y * 50) * 0.05 + 0.95;
			const yellowTint = Math.sin(x * 70 + y * 20) * 0.03 + 0.97;

			data[idx] = Math.floor(baseR * brownTint * 255); // R
			data[idx + 1] = Math.floor(baseG * yellowTint * 255); // G
			data[idx + 2] = Math.floor(baseB * brownTint * 255); // B
			data[idx + 3] = 255; // A
		}
	}

	ctx.putImageData(imageData, 0, 0);

	const texture = new THREE.CanvasTexture(canvas);
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(2, 2);
	texture.minFilter = THREE.LinearMipMapLinearFilter;
	texture.magFilter = THREE.LinearFilter;
	texture.generateMipmaps = true;

	grassTextureCache = texture;
	return texture;
}

export async function createGrassShaderMaterialAsync(
	color: string,
	lightIntensity: number
): Promise<THREE.ShaderMaterial> {
	// Load grass texture
	const grassTexture = await loadGrassTexture();

	// Convert hex color to base and tip colors
	const baseColor = new THREE.Color(color).multiplyScalar(0.4);
	const tipColor = new THREE.Color(color).multiplyScalar(0.9);

	const uniforms = {
		uTime: { value: 0 },
		uGrassTexture: { value: grassTexture },
		uBaseColor: { value: baseColor },
		uTipColor: { value: tipColor },
		uOpacity: { value: 1.0 },
		uLightIntensity: { value: lightIntensity },
	};

	return new THREE.ShaderMaterial({
		uniforms,
		vertexShader: `
			uniform float uTime;
			varying vec2 vUv;
			varying vec3 vNormal;
			
			void main() {
				vUv = uv;
				vNormal = normalize(normalMatrix * normal);
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`,
		fragmentShader: `
			uniform sampler2D uGrassTexture;
			uniform vec3 uBaseColor;
			uniform vec3 uTipColor;
			uniform float uOpacity;
			uniform float uLightIntensity;
			varying vec2 vUv;
			varying vec3 vNormal;
			
			void main() {
				vec4 grassTexture = texture2D(uGrassTexture, vUv);
				vec3 grassColor = mix(uBaseColor, uTipColor, vUv.y);
				grassColor = mix(grassColor, grassColor * grassTexture.rgb, 0.6);
				
				// Simple lighting
				vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
				float NdotL = max(dot(normalize(vNormal), lightDir), 0.0);
				float diffuse = 0.6 + 0.4 * NdotL;
				
				grassColor *= diffuse * uLightIntensity;
				
				gl_FragColor = vec4(grassColor, uOpacity);
			}
		`,
		side: THREE.DoubleSide,
		transparent: false,
	});
}