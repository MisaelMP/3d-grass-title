import type { VitestUtils } from 'vitest';

export type VitestMocker = Pick<VitestUtils, 'fn'>;

export const createThreeMockFactories = (mock: VitestMocker) => {
        class MockShaderMaterial {
                uniforms: Record<string, { value: unknown }>;
                dispose = mock.fn();

                constructor() {
                        this.uniforms = {
                                uColor: { value: {} },
                                uLightIntensity: { value: 1 },
                                uSpread: { value: 0 },
                                uTime: { value: 0 },
                        };
                }
        }

        class MockInstancedMesh {
                material: MockShaderMaterial;
                rotation = { set: mock.fn() };
                geometry = { dispose: mock.fn() };
                instanceMatrix = { needsUpdate: false };
                instanceColor = { needsUpdate: false };
                setMatrixAt = mock.fn();
                setColorAt = mock.fn();
                userData = { isTextMesh: true };

                constructor(
                        _geometry?: unknown,
                        material?: MockShaderMaterial | MockShaderMaterial[],
                        _count?: number
                ) {
                        if (Array.isArray(material)) {
                                this.material = material[0] ?? new MockShaderMaterial();
                        } else {
                                this.material = material ?? new MockShaderMaterial();
                        }
                }
        }

        class MockTextGeometry {
                boundingBox = {
                        min: { x: -0.5, y: -0.25, z: -0.1 },
                        max: { x: 0.5, y: 0.25, z: 0.1 },
                };
                translate = mock.fn();

                computeBoundingBox() {
                        return this.boundingBox;
                }
        }

        class MockColor {
                hex: unknown;
                multiplyScalar = mock.fn(() => this);
                setHSL = mock.fn();

                constructor(hex?: unknown) {
                        this.hex = hex;
                }
        }

        const createMockFont = () => ({
                generateShapes: mock.fn(() => []),
        });

        return {
                MockShaderMaterial,
                MockInstancedMesh,
                MockTextGeometry,
                MockColor,
                createMockFont,
        };
};

export type ThreeMockFactories = ReturnType<typeof createThreeMockFactories>;

export const createThreeModule = (mock: VitestMocker, factories: ThreeMockFactories) => {
        const { MockShaderMaterial, MockInstancedMesh, MockColor } = factories;
        return {
                Scene: mock.fn(() => {
                        const children: any[] = [];
                        return {
                                add: mock.fn((child: any) => {
                                        if (child && typeof child === 'object' && !('userData' in child)) {
                                                (child as { userData?: Record<string, unknown> }).userData = {};
                                        }
                                        children.push(child);
                                }),
                                remove: mock.fn((child: any) => {
                                        const index = children.indexOf(child);
                                        if (index !== -1) {
                                                children.splice(index, 1);
                                        }
                                }),
                                children,
                                background: null,
                        };
                }),
                PerspectiveCamera: mock.fn(() => ({
                        position: { set: mock.fn(), setZ: mock.fn() },
                        aspect: 1,
                        updateProjectionMatrix: mock.fn(),
                })),
                WebGLRenderer: mock.fn(() => ({
                        setSize: mock.fn(),
                        setPixelRatio: mock.fn(),
                        render: mock.fn(),
                        dispose: mock.fn(),
                })),
                DirectionalLight: mock.fn(() => ({
                        position: { set: mock.fn() },
                        intensity: 1,
                })),
                AmbientLight: mock.fn(() => ({})),
                Color: MockColor,
                InstancedMesh: MockInstancedMesh,
                Matrix4: mock.fn(() => ({
                        makeRotationFromEuler: mock.fn(),
                        scale: mock.fn(),
                        setPosition: mock.fn(),
                })),
                Euler: mock.fn(),
                Vector3: mock.fn(),
                ShaderMaterial: MockShaderMaterial,
        };
};

export const createTextGeometryModule = (factories: ThreeMockFactories) => ({
        TextGeometry: factories.MockTextGeometry,
});

interface FontLoaderOptions {
        shouldFail?: (url: string) => boolean;
        createError?: () => Error;
}

export const createFontLoaderModule = (
        mock: VitestMocker,
        createMockFont: () => { generateShapes: ReturnType<VitestUtils['fn']> },
        options: FontLoaderOptions = {}
) => ({
        FontLoader: mock.fn(() => ({
                load: mock.fn(
                        (
                                url: string,
                                onLoad?: (font: unknown) => void,
                                _onProgress?: unknown,
                                onError?: (error: Error) => void
                        ) => {
                                const fail = options.shouldFail?.(url) ?? false;
                                const callback = fail
                                        ? () => onError?.(options.createError?.() ?? new Error('Font not found'))
                                        : () => onLoad?.(createMockFont());
                                setTimeout(callback, 0);
                        }
                ),
        })),
        Font: class {},
});
