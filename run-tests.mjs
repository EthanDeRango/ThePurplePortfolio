// Lightweight test runner — executes the pure-function regression suite in Node.
// Usage: npm test   (no test framework needed; type:module lets Node import the ESM libs)
import { runSelfTest } from './src/lib/self-test.js';
process.exit(runSelfTest() ? 0 : 1);
