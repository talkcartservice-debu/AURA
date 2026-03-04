// Lightweight crypto.getRandomValues polyfill for environments where it's missing.
// This is NOT cryptographically secure, but is sufficient for development
// and libraries (like simple-peer/randombytes) that just need a source of entropy.

if (typeof globalThis !== "undefined") {
  if (!globalThis.crypto) {
    globalThis.crypto = {};
  }

  if (typeof globalThis.crypto.getRandomValues !== "function") {
    // eslint-disable-next-line no-console
    console.warn("[polyfill] crypto.getRandomValues is not available; using Math.random-based fallback.");

    globalThis.crypto.getRandomValues = function getRandomValues(arr) {
      if (!(arr instanceof Uint8Array)) {
        throw new TypeError("Expected Uint8Array");
      }
      for (let i = 0; i < arr.length; i += 1) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    };
  }
}

