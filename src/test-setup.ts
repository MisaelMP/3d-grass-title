// Test setup file for vitest
import { afterEach, vi, beforeAll } from 'vitest';

// Global setup for all tests
beforeAll(() => {
	// Ensure we're in a clean state
	vi.clearAllMocks();
	vi.clearAllTimers();
});

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

// Safely set up mocks on global object
try {
	global.requestAnimationFrame = mockRequestAnimationFrame;
	global.cancelAnimationFrame = mockCancelAnimationFrame;
} catch (error) {
	console.warn('Could not set global animation frame mocks:', error);
}

// Also mock window if it exists
if (typeof window !== 'undefined') {
	try {
		window.requestAnimationFrame = mockRequestAnimationFrame;
		window.cancelAnimationFrame = mockCancelAnimationFrame;
	} catch (error) {
		console.warn('Could not set window animation frame mocks:', error);
	}
}

// Mock ResizeObserver safely
try {
	global.ResizeObserver = vi.fn().mockImplementation((_callback: ResizeObserverCallback) => ({
		observe: vi.fn(),
		unobserve: vi.fn(),
		disconnect: vi.fn(),
	}));
} catch (error) {
	console.warn('Could not mock ResizeObserver:', error);
}

// Mock performance.now for consistent timing in tests
try {
	if (!global.performance) {
		global.performance = {} as Performance;
	}

	// Use Object.defineProperty to override read-only property
	Object.defineProperty(global.performance, 'now', {
		value: vi.fn(() => Date.now()),
		writable: true,
		configurable: true,
	});
} catch (error) {
	console.warn('Could not mock performance.now:', error);
	// Fallback: try to set it directly if defineProperty fails
	try {
		(global.performance as any).now = vi.fn(() => Date.now());
	} catch (fallbackError) {
		console.warn('Fallback performance.now mock also failed:', fallbackError);
	}
}

// Clean up animation frames after each test
afterEach(() => {
	animationFrameCallbacks.clear();
	animationFrameId = 0;
	vi.clearAllTimers();
	vi.clearAllMocks();
});
