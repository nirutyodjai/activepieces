// Minimal polyfills for streaming APIs used by some SDKs during tests
// Provide TransformStream, ReadableStream, and WritableStream shims so imports don't throw
// These are minimal and only intended for the test environment.

// Add jest-dom matchers (toBeInTheDocument, etc.)
import '@testing-library/jest-dom';

// @ts-ignore
if (typeof (global as any).TransformStream === 'undefined') {
  // Minimal TransformStream stub
  // Instances expose readable and writable properties; no real streaming behavior.
  // This satisfies libraries that check for existence/use TransformStream constructor.
  (global as any).TransformStream = class {
    readable: any;
    writable: any;
    constructor() {
      this.readable = {};
      this.writable = {};
    }
  };
}

if (typeof (global as any).ReadableStream === 'undefined') {
  (global as any).ReadableStream = class {
    constructor() {}
  };
}

if (typeof (global as any).WritableStream === 'undefined') {
  (global as any).WritableStream = class {
    constructor() {}
  };
}
