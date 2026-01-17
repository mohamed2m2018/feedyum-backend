// Jest test setup
require('dotenv').config();

// Increase timeout for API calls
jest.setTimeout(30000);

// Silence console logs during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   warn: jest.fn(),
// };
