// Load environment variables for tests
require('dotenv').config({ path: '.env' });

// Global test setup
jest.setTimeout(10 * 1000);
