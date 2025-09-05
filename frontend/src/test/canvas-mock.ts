// Mock canvas for test environment
import { vi } from 'vitest';

// Mock HTMLCanvasElement
class MockCanvas {
  width = 0;
  height = 0;

  getContext(): MockCanvasRenderingContext2D {
    return new MockCanvasRenderingContext2D();
  }

  toDataURL(): string {
    return 'data:image/png;base64,mock-canvas-data';
  }
}

// Mock CanvasGradient
class MockCanvasGradient {
  addColorStop = vi.fn();
}

// Mock CanvasRenderingContext2D
class MockCanvasRenderingContext2D {
  fillStyle = '#000000';
  font = '10px sans-serif';
  textAlign = 'left';
  textBaseline = 'top';
  strokeStyle = '#000000';
  lineWidth = 1;

  fillRect = vi.fn();
  fillText = vi.fn();
  strokeRect = vi.fn();
  measureText = vi.fn().mockReturnValue({ width: 100 });
  clearRect = vi.fn();
  beginPath = vi.fn();
  closePath = vi.fn();
  stroke = vi.fn();
  fill = vi.fn();
  arc = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  save = vi.fn();
  restore = vi.fn();
  translate = vi.fn();
  rotate = vi.fn();
  scale = vi.fn();

  createLinearGradient = vi.fn().mockReturnValue(new MockCanvasGradient());
}

// Mock HTMLCanvasElement.prototype.getContext
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn().mockReturnValue(new MockCanvasRenderingContext2D()),
  writable: true,
});

// Mock document.createElement for canvas
const originalCreateElement = document.createElement.bind(document);
document.createElement = vi.fn().mockImplementation((tagName: string) => {
  if (tagName === 'canvas') {
    return new MockCanvas() as unknown as HTMLCanvasElement;
  }
  return originalCreateElement(tagName);
});

export { MockCanvas, MockCanvasRenderingContext2D };
