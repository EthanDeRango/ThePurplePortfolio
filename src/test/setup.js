// Vitest setup — jest-dom matchers + jsdom shims the components expect.
import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement these; the dashboard calls them on tab switches / charts.
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
window.scrollTo = () => {};
