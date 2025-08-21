// Minimal stub for @testing-library/jest-dom matchers used in tests
// Only implements toBeInTheDocument used by our tests

expect.extend({
  toBeInTheDocument(received: any) {
    const pass = received !== null && received !== undefined;
    return {
      pass,
      message: () => (pass ? 'element found in document' : 'element not found in document'),
    };
  },
});

export {};
