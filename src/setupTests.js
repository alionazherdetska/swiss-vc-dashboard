import "@testing-library/jest-dom";

// Provide a simple ResizeObserver mock for tests
class ResizeObserverMock {
  constructor(cb) {
    this.cb = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  configurable: true,
  value: ResizeObserverMock,
});

// Ensure getBoundingClientRect returns a width so ResponsiveD3Container renders children
Element.prototype.getBoundingClientRect = function () {
  return { width: 800, height: 200, top: 0, left: 0, right: 800, bottom: 200 };
};

// Suppress a noisy, harmless warning about ReactDOMTestUtils.act deprecation
// origin: react-dom/test-utils used by older testing-library compat layers.
// Prefer upgrading dependencies long-term; this just keeps test output clean.
const _consoleError = console.error;
console.error = (...args) => {
  try {
    const first = args[0];
    if (typeof first === "string" && first.includes("ReactDOMTestUtils.act is deprecated")) {
      return;
    }
  } catch (e) {
    // ignore
  }
  _consoleError.apply(console, args);
};
