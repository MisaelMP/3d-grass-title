// Test setup file for vitest
import { afterEach, vi } from 'vitest';

// Mock requestAnimationFrame and cancelAnimationFrame for Node.js environment
let animationFrameId = 0;
const animationFrameCallbacks = new Map<number, FrameRequestCallback>();

// Mock both global and window versions
const mockRequestAnimationFrame = vi.fn((callback: FrameRequestCallback): number => {
	const id = ++animationFrameId;
	animationFrameCallbacks.set(id, callback);
	// Don't execute callback immediately to avoid recursion issues
	return id;
});

const mockCancelAnimationFrame = vi.fn((id: number): void => {
	animationFrameCallbacks.delete(id);
});

// Set up mocks on global object
global.requestAnimationFrame = mockRequestAnimationFrame;
global.cancelAnimationFrame = mockCancelAnimationFrame;

// Also mock window if it exists
if (typeof window !== 'undefined') {
	window.requestAnimationFrame = mockRequestAnimationFrame;
	window.cancelAnimationFrame = mockCancelAnimationFrame;
}

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation((_callback: ResizeObserverCallback) => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// Mock performance.now for consistent timing in tests
global.performance = global.performance || {};
global.performance.now = vi.fn(() => Date.now());

// Clean up animation frames after each test
afterEach(() => {
	animationFrameCallbacks.clear();
	animationFrameId = 0;
	vi.clearAllTimers();
	vi.clearAllMocks();
});
